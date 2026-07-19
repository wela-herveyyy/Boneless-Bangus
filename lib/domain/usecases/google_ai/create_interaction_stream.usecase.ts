import { GoogleGenAI } from "@google/genai";
import type {
  CreateInteractionInput,
  GoogleAiStreamEvent,
} from "@/lib/entities/google_ai.type";
import {
  GOOGLE_AI_AGENTS,
  GOOGLE_AI_DEFAULT_MODEL,
} from "@/lib/entities/google_ai.type";
import { getSession } from "../auth/get_session.usecase";
import { getProfile } from "../profile/get_profile.usecase";

const AGENT_TIMEOUT_MS = 300_000;
const MAX_ATTEMPTS = 2;
const MAX_TOOL_ROUNDS = 5;

type PendingToolCall = {
  id: string;
  name: string;
  arguments: string;
};

function thoughtSummaryText(delta: { type: string; content?: unknown }): string | null {
  if (delta.type !== "thought_summary") return null;
  const content = delta.content;
  if (
    content &&
    typeof content === "object" &&
    "type" in content &&
    (content as { type: string }).type === "text" &&
    "text" in content &&
    typeof (content as { text: unknown }).text === "string"
  ) {
    return (content as { text: string }).text;
  }
  return null;
}

function isRetriableGoogleError(message: string): boolean {
  return /404|requested entity was not found|internal error/i.test(message);
}

function isToolsUnsupportedError(message: string): boolean {
  return /tool|function.?call|not supported|invalid argument.*tool/i.test(message);
}

function parseToolArgs(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function appendArgDelta(pending: PendingToolCall | undefined, delta: Record<string, unknown>) {
  if (!pending) return;
  const chunk =
    (typeof delta.arguments === "string" && delta.arguments) ||
    (typeof delta.partial_arguments === "string" && delta.partial_arguments) ||
    "";
  if (chunk) pending.arguments += chunk;
}

async function resolveApiKey(): Promise<string | null> {
  let apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const session = await getSession();
  if (session?.user?.id) {
    const profile = await getProfile(session.user.id);
    if (profile.settings?.geminiApiKey) {
      apiKey = profile.settings.geminiApiKey;
    } else if (profile.team?.geminiApiKey) {
      apiKey = profile.team.geminiApiKey;
    }
  }
  return apiKey ?? null;
}

/** Yields normalized thinking / text / lifecycle events from Interactions SSE. */
export async function* createInteractionStream(
  input: CreateInteractionInput,
): AsyncGenerator<GoogleAiStreamEvent> {
  const message = input.message.trim();
  if (!message) {
    yield { type: "error", error: "Message is required." };
    return;
  }

  const apiKey = await resolveApiKey();
  if (!apiKey) {
    yield { type: "error", error: "GEMINI_API_KEY is not set in environment or your profile." };
    return;
  }

  const modelOrAgent = input.model ?? GOOGLE_AI_DEFAULT_MODEL;
  const isAgent = GOOGLE_AI_AGENTS.has(modelOrAgent);
  let previousInteractionId = input.previousInteractionId;
  let lastError = "Google AI stream failed.";
  let toolsEnabled = Boolean(input.tools?.length && input.executeTool);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let sawProgress = false;
    let completed = false;
    let retriable: string | null = null;
    let dropToolsAndRetry = false;

    try {
      const ai = new GoogleGenAI({ apiKey });
      let roundInput: string | Array<Record<string, unknown>> = message;
      let interactionId = previousInteractionId;

      for (let toolRound = 0; toolRound <= MAX_TOOL_ROUNDS; toolRound++) {
        const previous = interactionId ? { previous_interaction_id: interactionId } : {};
        const toolsPayload =
          toolsEnabled && input.tools?.length ? { tools: input.tools } : {};

        const stream = isAgent
          ? await ai.interactions.create(
              {
                agent: modelOrAgent,
                input: roundInput as never,
                environment: "remote",
                stream: true,
                agent_config: { type: "dynamic", thinking_summaries: "auto" },
                ...(input.systemInstruction
                  ? { system_instruction: input.systemInstruction }
                  : {}),
                ...toolsPayload,
                ...previous,
              },
              { timeout: AGENT_TIMEOUT_MS },
            )
          : await ai.interactions.create({
              model: modelOrAgent,
              input: roundInput as never,
              stream: true,
              ...(input.systemInstruction
                ? { system_instruction: input.systemInstruction }
                : {}),
              ...toolsPayload,
              ...previous,
            });

        const pendingCalls = new Map<number, PendingToolCall>();
        let status: string | undefined;
        let completedId: string | undefined;
        let inputTokens: number | undefined;
        let outputTokens: number | undefined;
        let roundRetriable: string | null = null;

        for await (const event of stream) {
          switch (event.event_type) {
            case "interaction.created": {
              const id = event.interaction?.id;
              if (id) {
                sawProgress = true;
                completedId = id;
                interactionId = id;
                if (toolRound === 0) {
                  yield { type: "created", conversationId: id };
                }
              }
              break;
            }
            case "step.start": {
              const step = event.step as { type?: string; id?: string; name?: string; arguments?: unknown };
              if (step?.type === "function_call" && step.id && step.name) {
                sawProgress = true;
                let argsStr = "";
                if (step.arguments) {
                  argsStr =
                    typeof step.arguments === "string"
                      ? step.arguments
                      : JSON.stringify(step.arguments);
                }
                pendingCalls.set(event.index, {
                  id: step.id,
                  name: step.name,
                  arguments: argsStr,
                });
              }
              break;
            }
            case "step.delta": {
              const delta = event.delta;
              if (!delta || typeof delta !== "object" || !("type" in delta)) break;
              const deltaObj = delta as Record<string, unknown> & { type: string };

              if (deltaObj.type === "text" && typeof deltaObj.text === "string") {
                sawProgress = true;
                yield { type: "text", text: deltaObj.text };
                break;
              }

              if (deltaObj.type === "arguments_delta" || deltaObj.type === "arguments") {
                appendArgDelta(pendingCalls.get(event.index), deltaObj);
                break;
              }

              const thought = thoughtSummaryText(delta as { type: string; content?: unknown });
              if (thought) {
                sawProgress = true;
                yield { type: "thinking", text: thought };
              }
              break;
            }
            case "interaction.completed": {
              const interaction = event.interaction;
              const id = interaction?.id;
              status = interaction?.status;
              inputTokens = interaction?.usage?.total_input_tokens;
              outputTokens = interaction?.usage?.total_output_tokens;
              if (!id) {
                lastError = "Google AI completed without an interaction id.";
                roundRetriable = isRetriableGoogleError(lastError) ? lastError : null;
                if (!roundRetriable) {
                  yield { type: "error", error: lastError };
                  return;
                }
                break;
              }
              completedId = id;
              interactionId = id;
              break;
            }
            case "error": {
              const messageText =
                event.error &&
                typeof event.error === "object" &&
                "message" in event.error &&
                typeof event.error.message === "string"
                  ? event.error.message
                  : "Google AI stream error.";
              lastError = messageText;
              if (!sawProgress && toolsEnabled && isToolsUnsupportedError(messageText)) {
                dropToolsAndRetry = true;
                break;
              }
              if (!sawProgress && isRetriableGoogleError(messageText)) {
                roundRetriable = messageText;
              } else {
                yield { type: "error", error: messageText };
                return;
              }
              break;
            }
            default:
              break;
          }
          if (roundRetriable || dropToolsAndRetry) break;
        }

        if (dropToolsAndRetry) {
          toolsEnabled = false;
          retriable = lastError;
          break;
        }

        if (roundRetriable) {
          retriable = roundRetriable;
          break;
        }

        if (status === "requires_action" && pendingCalls.size > 0 && input.executeTool) {
          const results: Array<Record<string, unknown>> = [];
          for (const call of pendingCalls.values()) {
            try {
              const data = await input.executeTool(call.name, parseToolArgs(call.arguments));
              results.push({
                type: "function_result",
                name: call.name,
                call_id: call.id,
                result: [{ type: "text", text: JSON.stringify(data ?? null) }],
              });
            } catch (error) {
              results.push({
                type: "function_result",
                name: call.name,
                call_id: call.id,
                is_error: true,
                result: [
                  {
                    type: "text",
                    text: error instanceof Error ? error.message : "Workspace tool failed.",
                  },
                ],
              });
            }
          }
          roundInput = results;
          continue;
        }

        if (completedId) {
          completed = true;
          yield {
            type: "completed",
            conversationId: completedId,
            status,
            inputTokens,
            outputTokens,
          };
          return;
        }

        lastError = "Google AI stream ended with no response.";
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Google AI stream failed.";
      if (!sawProgress && toolsEnabled && isToolsUnsupportedError(lastError)) {
        toolsEnabled = false;
        retriable = lastError;
      } else if (!sawProgress && isRetriableGoogleError(lastError)) {
        retriable = lastError;
      } else {
        yield { type: "error", error: lastError };
        return;
      }
    }

    if (completed) return;

    if (!retriable || attempt === MAX_ATTEMPTS - 1) {
      yield { type: "error", error: lastError };
      return;
    }

    // Drop broken interaction chain; Gemma Interactions often 500s transiently.
    previousInteractionId = undefined;
  }
}

import { GoogleGenAI } from "@google/genai";
import type {
  CreateInteractionInput,
  GoogleAiStreamEvent,
} from "@/lib/entities/google_ai.type";
import {
  GOOGLE_AI_AGENTS,
  GOOGLE_AI_DEFAULT_MODEL,
} from "@/lib/entities/google_ai.type";
import { connectMcpServers, executeMcpTool, type McpRuntimeSession } from "@/lib/domain/services/mcp_runtime.service";

const AGENT_TIMEOUT_MS = 300_000;
const MAX_ATTEMPTS = 2;
const MAX_TOOL_TURNS = 6;

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

/** Yields normalized thinking / text / tools / lifecycle events from Interactions SSE. */
export async function* createInteractionStream(
  input: CreateInteractionInput,
): AsyncGenerator<GoogleAiStreamEvent> {
  const message = input.message.trim();
  if (!message) {
    yield { type: "error", error: "Message is required." };
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    yield { type: "error", error: "GEMINI_API_KEY is not set." };
    return;
  }

  const modelOrAgent = input.model ?? GOOGLE_AI_DEFAULT_MODEL;
  const isAgent = GOOGLE_AI_AGENTS.has(modelOrAgent);
  let previousInteractionId = input.previousInteractionId;
  let lastError = "Google AI stream failed.";

  // Connect to requested MCP servers before beginning stream
  let mcpSession: McpRuntimeSession | undefined;
  let optionsTools: Array<{ functionDeclarations: Array<{ type: "function"; name: string; description?: string; parameters?: unknown }> }> | undefined;

  if (input.mcpServers && Array.isArray(input.mcpServers) && input.mcpServers.length > 0) {
    const connResult = await connectMcpServers(input.mcpServers, input.userId || "anonymous");
    mcpSession = connResult.session;

    for (const w of connResult.warnings) {
      yield { type: "tool_warning", slug: w.slug, reason: w.reason };
    }

    if (connResult.tools.length > 0) {
      const functionDeclarations = connResult.tools.map((t) => ({
        type: "function" as const,
        name: t.namespacedName,
        description: t.description,
        parameters: t.inputSchema,
      }));
      optionsTools = [{ functionDeclarations }];
    }
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let sawProgress = false;
    let completed = false;
    let retriable: string | null = null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      let currentInput: unknown = message;
      let toolTurn = 0;

      while (toolTurn < MAX_TOOL_TURNS && !completed) {
        const previous = previousInteractionId
          ? { previous_interaction_id: previousInteractionId }
          : {};

        const stream = isAgent
          ? await ai.interactions.create(
              {
                agent: modelOrAgent,
                input: currentInput as string,
                environment: "remote",
                stream: true,
                agent_config: { type: "dynamic", thinking_summaries: "auto" } as any,
                ...(input.systemInstruction ? { system_instruction: input.systemInstruction } : {}),
                ...(optionsTools ? { tools: optionsTools as any } : {}),
                ...previous,
              },
              { timeout: AGENT_TIMEOUT_MS },
            )
          : await ai.interactions.create({
              model: modelOrAgent,
              input: currentInput as string,
              stream: true,
              ...(input.systemInstruction ? { system_instruction: input.systemInstruction } : {}),
              ...(optionsTools ? { tools: optionsTools as any } : {}),
              ...previous,
            });

        const pendingToolCalls = new Map<
          string,
          { id: string; name: string; arguments: Record<string, unknown> }
        >();

        let currentInteractionId = previousInteractionId;
        let requiresAction = false;
        let finalTokens: { input?: number; output?: number; status?: string } = {};

        for await (const event of stream) {
          const evtAny = event as any;
          if (evtAny.interaction?.id) {
            currentInteractionId = evtAny.interaction.id;
          }

          if (evtAny.interaction?.status === "requires_action") {
            requiresAction = true;
          }

          // Extract function call steps from status updates or lifecycle events
          const steps = (evtAny.interaction?.steps || []) as Array<{
            type?: string;
            id?: string;
            name?: string;
            arguments?: Record<string, unknown>;
          }>;
          for (const s of steps) {
            if (s.type === "function_call" && s.id && s.name) {
              pendingToolCalls.set(s.id, {
                id: s.id,
                name: s.name,
                arguments: s.arguments || {},
              });
            }
          }

          switch (event.event_type) {
            case "interaction.created": {
              if (currentInteractionId && toolTurn === 0) {
                sawProgress = true;
                yield { type: "created", conversationId: currentInteractionId };
              }
              break;
            }
            case "step.start":
            case "step.stop": {
              const s = evtAny.step;
              if (s && s.type === "function_call" && s.id && s.name) {
                pendingToolCalls.set(s.id, {
                  id: s.id,
                  name: s.name,
                  arguments: s.arguments || {},
                });
              }
              break;
            }
            case "step.delta": {
              const delta = event.delta as any;
              if (!delta || typeof delta !== "object") break;
              if (delta.type === "text" && typeof delta.text === "string") {
                sawProgress = true;
                yield { type: "text", text: delta.text };
                break;
              }
              const thought = thoughtSummaryText(delta);
              if (thought) {
                sawProgress = true;
                yield { type: "thinking", text: thought };
                break;
              }
              if (delta.type === "function_call" && delta.id && delta.name) {
                pendingToolCalls.set(delta.id, {
                  id: delta.id,
                  name: delta.name,
                  arguments: delta.arguments || {},
                });
              }
              break;
            }
            case "interaction.completed": {
              const interaction = event.interaction as any;
              finalTokens = {
                status: interaction?.status,
                input: interaction?.usage?.total_input_tokens,
                output: interaction?.usage?.total_output_tokens,
              };
              if (interaction?.status === "requires_action") {
                requiresAction = true;
              }
              break;
            }
            case "error": {
              const messageText =
                evtAny.error && typeof evtAny.error.message === "string"
                  ? evtAny.error.message
                  : "Google AI stream error.";
              lastError = messageText;
              if (!sawProgress && isRetriableGoogleError(messageText)) {
                retriable = messageText;
              } else {
                yield { type: "error", error: messageText };
                return;
              }
              break;
            }
            default:
              break;
          }
          if (retriable) break;
        }

        if (retriable) break;

        // Check if tools were called or action required
        if (pendingToolCalls.size > 0 || requiresAction) {
          if (!currentInteractionId) {
            yield { type: "error", error: "Tool call requested without interaction id." };
            return;
          }

          previousInteractionId = currentInteractionId;
          const functionResultSteps: Array<{
            type: "function_result";
            call_id: string;
            name: string;
            result: string;
            is_error: boolean;
          }> = [];

          for (const tc of pendingToolCalls.values()) {
            const lookup = mcpSession?.toolLookup.get(tc.name);
            const slug = lookup?.slug || "unknown";
            const toolName = lookup?.toolName || tc.name;

            yield { type: "tool_call", slug, toolName };

            let result = { ok: false, content: "No active session" };
            if (mcpSession) {
              result = await executeMcpTool(mcpSession, tc.name, tc.arguments);
            }

            yield { type: "tool_result", slug, toolName, ok: result.ok };

            functionResultSteps.push({
              type: "function_result",
              call_id: tc.id,
              name: tc.name,
              result: result.content,
              is_error: !result.ok,
            });
          }

          currentInput = functionResultSteps;
          toolTurn++;
          continue;
        }

        // No tools called -> completion reached
        if (!currentInteractionId) {
          lastError = "Google AI completed without an interaction id.";
          retriable = isRetriableGoogleError(lastError) ? lastError : null;
          if (!retriable) {
            yield { type: "error", error: lastError };
            return;
          }
          break;
        }

        completed = true;
        yield {
          type: "completed",
          conversationId: currentInteractionId,
          status: finalTokens.status,
          inputTokens: finalTokens.input,
          outputTokens: finalTokens.output,
        };
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Google AI stream failed.";
      if (!sawProgress && isRetriableGoogleError(lastError)) {
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

    previousInteractionId = undefined;
  }
}

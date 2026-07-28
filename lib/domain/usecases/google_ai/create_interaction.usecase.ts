import { GoogleGenAI } from "@google/genai";
import type {
  CreateInteractionInput,
  CreateInteractionOutput,
  GoogleAiResult,
} from "@/lib/entities/google_ai.type";
import {
  GOOGLE_AI_AGENTS,
  GOOGLE_AI_DEFAULT_MODEL,
} from "@/lib/entities/google_ai.type";
import { resolveApiKey } from "@/lib/domain/usecases/ai/resolve_api_key.usecase";
import { AI_PROVIDER } from "@/lib/entities/ai.type";
import { getSession } from "../auth/get_session.usecase";

const AGENT_TIMEOUT_MS = 300_000;
const MAX_TOOL_ROUNDS = 5;

function parseToolArgs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function isStaleChainError(message: string): boolean {
  return /unrecoverable data loss|invalid_request|the 'type' parameter is required|terminated|requested entity was not found/i.test(
    message,
  );
}

export async function createInteraction(
  input: CreateInteractionInput,
): Promise<GoogleAiResult<CreateInteractionOutput>> {
  const message = input.message.trim();
  if (!message) {
    return { ok: false, error: "Message is required." };
  }

  const session = await getSession();
  const resolved = await resolveApiKey(
    session?.user?.id,
    AI_PROVIDER.GOOGLE_AI,
    input.keySource,
  );
  if (!resolved.ok) return { ok: false, error: resolved.error };
  const apiKey = resolved.apiKey;

  const modelOrAgent = input.model ?? GOOGLE_AI_DEFAULT_MODEL;
  const isAgent = GOOGLE_AI_AGENTS.has(modelOrAgent);
  let previousInteractionId = input.previousInteractionId;
  let toolsEnabled = Boolean(input.tools?.length && input.executeTool);
  let roundInput: string | Array<Record<string, unknown>> = message;
  let clearedStaleChain = false;

  try {
    const ai = new GoogleGenAI({ apiKey });

    for (let toolRound = 0; toolRound <= MAX_TOOL_ROUNDS; toolRound++) {
      const previous = previousInteractionId
        ? { previous_interaction_id: previousInteractionId }
        : {};
      const toolsPayload =
        toolsEnabled && input.tools?.length ? { tools: input.tools } : {};

      let interaction;
      try {
        interaction = isAgent
          ? await ai.interactions.create(
              {
                agent: modelOrAgent,
                input: roundInput as never,
                environment: "remote",
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
              ...(input.systemInstruction
                ? { system_instruction: input.systemInstruction }
                : {}),
              ...toolsPayload,
              ...previous,
            });
      } catch (error) {
        const errText = error instanceof Error ? error.message : "Google AI request failed.";
        if (
          previousInteractionId &&
          !clearedStaleChain &&
          isStaleChainError(errText)
        ) {
          console.warn(
            "[createInteraction] Stale interaction chain — retrying fresh:",
            errText.slice(0, 160),
          );
          previousInteractionId = undefined;
          clearedStaleChain = true;
          roundInput = message;
          toolRound = -1; // re-run from round 0 after increment
          continue;
        }
        if (toolsEnabled && /tool|function.?call|not supported/i.test(errText)) {
          toolsEnabled = false;
          continue;
        }
        throw error;
      }

      if (!interaction.id) {
        return { ok: false, error: "Google AI returned no interaction id." };
      }

      previousInteractionId = interaction.id;

      if (interaction.status === "requires_action" && input.executeTool) {
        const steps = Array.isArray(interaction.steps) ? interaction.steps : [];
        const functionCalls = steps.flatMap((s) => {
          if (!s || typeof s !== "object" || !("type" in s)) return [];
          const step = s as {
            type?: string;
            id?: string;
            name?: string;
            arguments?: unknown;
          };
          if (step.type !== "function_call" || !step.id || !step.name) return [];
          return [{ id: step.id, name: step.name, arguments: step.arguments }];
        });

        if (functionCalls.length === 0) {
          break;
        }

        const results: Array<Record<string, unknown>> = [];
        for (const call of functionCalls) {
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

      const text =
        typeof interaction.output_text === "string" ? interaction.output_text.trim() : "";

      return {
        ok: true,
        data: {
          id: interaction.id,
          text: text || "(No response)",
          status: interaction.status,
          inputTokens: interaction.usage?.total_input_tokens,
          outputTokens: interaction.usage?.total_output_tokens,
        },
      };
    }

    return { ok: false, error: "Google AI tool loop exceeded max rounds." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Google AI request failed.",
    };
  }
}

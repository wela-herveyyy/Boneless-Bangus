import { GoogleGenAI } from "@google/genai";
import type {
  CreateInteractionInput,
  CreateInteractionOutput,
  GoogleAiResult,
  GoogleAiStreamEvent,
} from "@/lib/entities/google_ai.type";
import {
  GOOGLE_AI_AGENTS,
  GOOGLE_AI_DEFAULT_MODEL,
} from "@/lib/entities/google_ai.type";

const AGENT_TIMEOUT_MS = 300_000;

export async function createInteraction(
  input: CreateInteractionInput,
): Promise<GoogleAiResult<CreateInteractionOutput>> {
  const message = input.message.trim();
  if (!message) {
    return { ok: false, error: "Message is required." };
  }

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is not set." };
  }

  const modelOrAgent = input.model ?? GOOGLE_AI_DEFAULT_MODEL;
  const isAgent = GOOGLE_AI_AGENTS.has(modelOrAgent);
  const previous = input.previousInteractionId
    ? { previous_interaction_id: input.previousInteractionId }
    : {};

  try {
    const ai = new GoogleGenAI({ apiKey });

    const interaction = isAgent
      ? await ai.interactions.create(
          {
            agent: modelOrAgent,
            input: message,
            environment: "remote",
            ...(input.systemInstruction
              ? { system_instruction: input.systemInstruction }
              : {}),
            ...previous,
          },
          { timeout: AGENT_TIMEOUT_MS },
        )
      : await ai.interactions.create({
          model: modelOrAgent,
          input: message,
          ...(input.systemInstruction
            ? { system_instruction: input.systemInstruction }
            : {}),
          ...previous,
        });

    const text =
      typeof interaction.output_text === "string" ? interaction.output_text.trim() : "";

    if (!interaction.id) {
      return { ok: false, error: "Google AI returned no interaction id." };
    }

    return {
      ok: true,
      data: {
        id: interaction.id,
        text: text || "(No response)",
        status: interaction.status,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Google AI request failed.",
    };
  }
}

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

/**
 * Stream Google Interactions events. Yields normalized thinking/text/lifecycle events.
 */
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
  const previous = input.previousInteractionId
    ? { previous_interaction_id: input.previousInteractionId }
    : {};

  try {
    const ai = new GoogleGenAI({ apiKey });

    const stream = isAgent
      ? await ai.interactions.create(
          {
            agent: modelOrAgent,
            input: message,
            environment: "remote",
            stream: true,
            // ponytail: dynamic agents accept extra agent_config fields
            agent_config: { type: "dynamic", thinking_summaries: "auto" },
            ...(input.systemInstruction
              ? { system_instruction: input.systemInstruction }
              : {}),
            ...previous,
          },
          { timeout: AGENT_TIMEOUT_MS },
        )
      : await ai.interactions.create({
          model: modelOrAgent,
          input: message,
          stream: true,
          generation_config: { thinking_summaries: "auto" },
          ...(input.systemInstruction
            ? { system_instruction: input.systemInstruction }
            : {}),
          ...previous,
        });

    for await (const event of stream) {
      switch (event.event_type) {
        case "interaction.created": {
          const id = event.interaction?.id;
          if (id) yield { type: "created", conversationId: id };
          break;
        }
        case "step.delta": {
          const delta = event.delta;
          if (!delta || typeof delta !== "object" || !("type" in delta)) break;
          if (delta.type === "text" && "text" in delta && typeof delta.text === "string") {
            yield { type: "text", text: delta.text };
            break;
          }
          const thought = thoughtSummaryText(delta as { type: string; content?: unknown });
          if (thought) yield { type: "thinking", text: thought };
          break;
        }
        case "interaction.completed": {
          const interaction = event.interaction;
          const id = interaction?.id;
          if (!id) {
            yield { type: "error", error: "Google AI completed without an interaction id." };
            break;
          }
          yield {
            type: "completed",
            conversationId: id,
            status: interaction.status,
            inputTokens: interaction.usage?.total_input_tokens,
            outputTokens: interaction.usage?.total_output_tokens,
          };
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
          yield { type: "error", error: messageText };
          break;
        }
        default:
          // ignore status_update, step.start/stop, unknown
          break;
      }
    }
  } catch (error) {
    yield {
      type: "error",
      error: error instanceof Error ? error.message : "Google AI stream failed.",
    };
  }
}

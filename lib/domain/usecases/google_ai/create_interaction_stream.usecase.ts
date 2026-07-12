import { GoogleGenAI } from "@google/genai";
import type {
  CreateInteractionInput,
  GoogleAiStreamEvent,
} from "@/lib/entities/google_ai.type";
import {
  GOOGLE_AI_AGENTS,
  GOOGLE_AI_DEFAULT_MODEL,
} from "@/lib/entities/google_ai.type";

const AGENT_TIMEOUT_MS = 300_000;
const MAX_ATTEMPTS = 2;

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

/** Yields normalized thinking / text / lifecycle events from Interactions SSE. */
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

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const previous = previousInteractionId
      ? { previous_interaction_id: previousInteractionId }
      : {};
    let sawProgress = false;
    let completed = false;
    let retriable: string | null = null;

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
            ...(input.systemInstruction
              ? { system_instruction: input.systemInstruction }
              : {}),
            ...previous,
          });

      for await (const event of stream) {
        switch (event.event_type) {
          case "interaction.created": {
            const id = event.interaction?.id;
            if (id) {
              sawProgress = true;
              yield { type: "created", conversationId: id };
            }
            break;
          }
          case "step.delta": {
            const delta = event.delta;
            if (!delta || typeof delta !== "object" || !("type" in delta)) break;
            if (delta.type === "text" && "text" in delta && typeof delta.text === "string") {
              sawProgress = true;
              yield { type: "text", text: delta.text };
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
            if (!id) {
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

    // Drop broken interaction chain; Gemma Interactions often 500s transiently.
    previousInteractionId = undefined;
  }
}

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
          ...previous,
        },
        { timeout: AGENT_TIMEOUT_MS },
      )
      : await ai.interactions.create({
        model: modelOrAgent,
        input: message,
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

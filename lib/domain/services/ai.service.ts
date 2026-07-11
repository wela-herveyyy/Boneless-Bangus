import { promptAgent } from "@/lib/domain/services/cursor.service";
import { createInteraction } from "@/lib/domain/services/google_ai.service";
import {
  AI_PROVIDER,
  type AiResult,
  type PromptAiInput,
  type PromptAiOutput,
} from "@/lib/entities/ai.type";

export async function promptAi(input: PromptAiInput): Promise<AiResult<PromptAiOutput>> {
  const message = input.message.trim();
  if (!message) {
    return { ok: false, error: "Message is required." };
  }

  switch (input.provider) {
    case AI_PROVIDER.CURSOR: {
      const result = await promptAgent({
        message,
        name: input.name,
        email: input.email,
        mcpServers: input.mcpServers,
        skills: input.skills,
      });
      if (!result.ok) return result;
      return {
        ok: true,
        data: {
          provider: AI_PROVIDER.CURSOR,
          text: result.data.result?.trim() || "(No response)",
          conversationId: result.data.requestId,
        },
      };
    }

    case AI_PROVIDER.GOOGLE_AI: {
      const result = await createInteraction({
        message,
        model: input.model,
        previousInteractionId: input.previousInteractionId,
      });
      if (!result.ok) return result;
      return {
        ok: true,
        data: {
          provider: AI_PROVIDER.GOOGLE_AI,
          text: result.data.text,
          conversationId: result.data.id,
        },
      };
    }

    default: {
      // ponytail: exhaustiveness — add case when wiring a new provider
      const _never: never = input.provider;
      return { ok: false, error: `Unknown AI provider: ${String(_never)}` };
    }
  }
}

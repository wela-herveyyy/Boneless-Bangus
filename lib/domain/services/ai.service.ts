import { getSession } from "@/lib/domain/services/auth.service";
import { promptAgent } from "@/lib/domain/services/cursor.service";
import { createInteraction } from "@/lib/domain/services/google_ai.service";
import {
  getGoogleWorkspaceAuthStatusService,
  runWorkspaceChatToolService,
} from "@/lib/domain/services/google_workspace_auth.service";
import { BBAI_SYSTEM_CONTEXT, usageFromApi } from "@/lib/domain/usecases/ai/prompt.usecase";
import {
  WORKSPACE_GEMINI_SYSTEM_HINT,
  WORKSPACE_GEMINI_TOOLS,
} from "@/lib/domain/usecases/google_workspace_auth/workspace_gemini_tools.usecase";
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
        message: `${BBAI_SYSTEM_CONTEXT}\n\n${message}`,
        name: input.name,
        email: input.email,
        mcpServers: input.mcpServers,
        skills: input.skills,
        files: input.files,
        keySource: input.keySource,
      });
      if (!result.ok) return result;
      return {
        ok: true,
        data: {
          provider: AI_PROVIDER.CURSOR,
          text: result.data.result?.trim() || "(No response)",
          conversationId: result.data.requestId,
          usage: usageFromApi(),
        },
      };
    }

    case AI_PROVIDER.GOOGLE_AI: {
      let workspaceConnected = false;
      let userId: string | undefined;
      try {
        const session = await getSession();
        userId = session?.user?.id;
        if (userId) {
          const status = await getGoogleWorkspaceAuthStatusService(userId);
          workspaceConnected = status.isConnected;
        }
      } catch {
        workspaceConnected = false;
      }

      const systemInstruction = workspaceConnected
        ? `${BBAI_SYSTEM_CONTEXT}\n\n${WORKSPACE_GEMINI_SYSTEM_HINT}`
        : BBAI_SYSTEM_CONTEXT;

      const result = await createInteraction({
        message,
        model: input.model,
        previousInteractionId: input.previousInteractionId,
        systemInstruction,
        keySource: input.keySource,
        ...(workspaceConnected && userId
          ? {
            tools: WORKSPACE_GEMINI_TOOLS,
            executeTool: (name, args) =>
              runWorkspaceChatToolService(userId!, name, args),
          }
          : {}),
      });
      if (!result.ok) return result;
      return {
        ok: true,
        data: {
          provider: AI_PROVIDER.GOOGLE_AI,
          text: result.data.text,
          conversationId: result.data.id,
          usage: usageFromApi({
            inputTokens: result.data.inputTokens,
            outputTokens: result.data.outputTokens,
          }),
        },
      };
    }

    default: {
      const _never: never = input.provider;
      return { ok: false, error: `Unknown AI provider: ${String(_never)}` };
    }
  }
}

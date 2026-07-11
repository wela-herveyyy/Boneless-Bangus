"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { promptAi } from "@/lib/domain/services/ai.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import {
  AI_PROVIDER,
  type AiProvider,
  type AiResult,
  type PromptAiInput,
  type PromptAiOutput,
} from "@/lib/entities/ai.type";
import {
  hasPermission,
  USER_PERMISSION,
  type UserPermission,
} from "@/lib/entities/users.type";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

function permissionFor(provider: AiProvider): UserPermission {
  switch (provider) {
    case AI_PROVIDER.CURSOR:
      return USER_PERMISSION.CURSOR_PROMPT;
    case AI_PROVIDER.GOOGLE_AI:
      return USER_PERMISSION.GOOGLE_AI_INTERACT;
    default: {
      const _never: never = provider;
      return _never;
    }
  }
}

export async function promptAiAction(
  input: PromptAiInput,
): Promise<AiResult<PromptAiOutput>> {
  const action = `ai:prompt:${input.provider}`;
  const permission = permissionFor(input.provider);

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({
        userId: "anonymous",
        action,
        success: false,
        error: "Authentication required.",
      });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasPermission(userSession.user.role, permission)) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: "Not authorized.",
        role: userSession.user.role,
      });
      return { ok: false, error: "You are not authorized for this action." };
    }

    const name = input.name?.trim() || userSession.user.name;
    const email = input.email?.trim() || userSession.user.email;

    const result = await promptAi({ ...input, name, email });

    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: {
        provider: input.provider,
        conversationId: result.ok ? result.data.conversationId : undefined,
      },
    });

    return result;
  } catch (error) {
    const messageText = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: messageText });
    return { ok: false, error: messageText };
  }
}

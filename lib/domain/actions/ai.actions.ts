"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { promptAi } from "@/lib/domain/services/ai.service";
import {
  insertAiMessage,
  listConversationMessages,
  listConversations,
} from "@/lib/domain/services/ai_conversation.service";
import { cleanupAiPrompt } from "@/lib/domain/usecases/ai/prompt.usecase";
import { resolveApiKeySource } from "@/lib/domain/usecases/ai/resolve_api_key_source.usecase";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import {
  AI_PROVIDER,
  type AiConversationListItem,
  type AiMessagePage,
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

export async function listConversationsAction(): Promise<
  AiResult<AiConversationListItem[]>
> {
  const action = "ai:conversations:list";
  const permission = USER_PERMISSION.AI_CONVERSATIONS;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!hasPermission(userSession.user.permissions, permission)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await listConversations(userSession.user.id);
    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
    });
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function listConversationMessagesAction(
  conversationId: string,
  opts?: { limit?: number; before?: number },
): Promise<AiResult<AiMessagePage>> {
  const action = "ai:conversations:messages";
  const permission = USER_PERMISSION.AI_CONVERSATIONS;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!hasPermission(userSession.user.permissions, permission)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await listConversationMessages(
      userSession.user.id,
      conversationId,
      opts,
    );
    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { conversationId, ...opts },
    });
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
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

    if (!hasPermission(userSession.user.permissions, permission)) {
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
    if (!result.ok) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: result.error,
        role: userSession.user.role,
        metadata: { provider: input.provider, dbConversationId: input.dbConversationId },
      });
      return result;
    }

    const cleaned = cleanupAiPrompt(result.data.text, result.data.usage);
    const hasFiles = Array.isArray(input.files) && input.files.length > 0;
    const keySource = await resolveApiKeySource(
      userSession.user.id,
      input.provider,
      input.keySource,
    );
    const saved = await insertAiMessage({
      userId: userSession.user.id,
      conversationId: input.dbConversationId,
      content: input.message || (hasFiles ? `[Attached ${input.files!.length} file(s)]` : ""),
      aiFeedback: cleaned.content,
      usage: cleaned.usage,
      keySource,
    });

    if (!saved.ok) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: saved.error,
        role: userSession.user.role,
      });
      return { ok: false, error: saved.error };
    }

    await logAction({
      userId: userSession.user.id,
      action,
      success: true,
      role: userSession.user.role,
      metadata: {
        provider: input.provider,
        conversationId: result.data.conversationId,
        dbConversationId: saved.data.conversationId,
        messageId: saved.data.messageId,
        ...cleaned.usage,
      },
    });

    return {
      ok: true,
      data: {
        ...result.data,
        text: cleaned.content,
        dbConversationId: saved.data.conversationId,
        messageId: saved.data.messageId,
        usage: cleaned.usage,
      },
    };
  } catch (error) {
    const messageText = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: messageText });
    return { ok: false, error: messageText };
  }
}

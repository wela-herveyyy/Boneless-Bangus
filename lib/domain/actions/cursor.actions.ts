"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { promptAgent } from "@/lib/domain/services/cursor.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import type {
  CursorMcpServerConfig,
  CursorResult,
  CursorSkill,
  PromptAgentOutput,
} from "@/lib/entities/cursor.type";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export type PromptAgentActionInput = {
  message: string;
  name?: string;
  email?: string;
  mcpServers?: Record<string, CursorMcpServerConfig>;
  skills?: CursorSkill[];
};

export async function promptAgentAction(
  input: PromptAgentActionInput,
): Promise<CursorResult<PromptAgentOutput>> {
  const action = "cursor:prompt";
  const permission = USER_PERMISSION.CURSOR_PROMPT;

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

    const result = await promptAgent({
      message: input.message,
      name,
      email,
      mcpServers: input.mcpServers,
      skills: input.skills,
    });

    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: {
        name,
        email,
        mcpCount: input.mcpServers ? Object.keys(input.mcpServers).length : 0,
        skillCount: input.skills?.length ?? 0,
      },
    });

    return result;
  } catch (error) {
    const messageText = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: messageText });
    return { ok: false, error: messageText };
  }
}

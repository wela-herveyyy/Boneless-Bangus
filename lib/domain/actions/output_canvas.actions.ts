"use server";

import { auth } from "@/lib/domain/services/auth.service";
import {
  getOutputCanvasByConversationService,
  getOutputCanvasByIdService,
  listOutputCanvasesService,
  upsertOutputCanvasService,
} from "@/lib/domain/services/output_canvas.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import type { FrappeOutputTarget, FrappeToolMode } from "@/lib/entities/frappe_output.type";
import type { OutputCanvasItem, OutputCanvasResult } from "@/lib/entities/output_canvas.type";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export async function listOutputCanvasesAction(): Promise<
  OutputCanvasResult<OutputCanvasItem[]>
> {
  const action = "output_canvas:list";
  const permission = USER_PERMISSION.AI_CONVERSATIONS;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!hasPermission(userSession.user.permissions, permission)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await listOutputCanvasesService(userSession.user.id);
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

export async function upsertOutputCanvasAction(input: {
  conversationId: string;
  toolMode: FrappeToolMode;
  target: FrappeOutputTarget;
  title?: string;
}): Promise<OutputCanvasResult<OutputCanvasItem>> {
  const action = "output_canvas:upsert";
  const permission = USER_PERMISSION.AI_CONVERSATIONS;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!hasPermission(userSession.user.permissions, permission)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await upsertOutputCanvasService({
      userId: userSession.user.id,
      conversationId: input.conversationId,
      toolMode: input.toolMode,
      target: input.target,
      title: input.title,
    });
    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { conversationId: input.conversationId, canvasId: result.ok ? result.data.id : null },
    });
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function getOutputCanvasByIdAction(
  canvasId: string,
): Promise<OutputCanvasResult<OutputCanvasItem>> {
  const action = "output_canvas:get";
  const permission = USER_PERMISSION.AI_CONVERSATIONS;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!hasPermission(userSession.user.permissions, permission)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await getOutputCanvasByIdService(userSession.user.id, canvasId);
    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { canvasId },
    });
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function getOutputCanvasByConversationAction(
  conversationId: string,
): Promise<OutputCanvasResult<OutputCanvasItem | null>> {
  const action = "output_canvas:get_by_conversation";
  const permission = USER_PERMISSION.AI_CONVERSATIONS;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!hasPermission(userSession.user.permissions, permission)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    return getOutputCanvasByConversationService(userSession.user.id, conversationId);
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

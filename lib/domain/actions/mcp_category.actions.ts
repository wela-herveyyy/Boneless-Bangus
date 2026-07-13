"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import {
  listMcpCategories,
  createMcpCategory,
  updateMcpCategory,
  deleteMcpCategory,
} from "@/lib/domain/services/mcp_category.service";
import {
  hasMcpPermission,
  MCP_PERMISSION,
  type McpResult,
} from "@/lib/entities/mcp_server.type";
import type { McpCategorySelect } from "@/lib/entities/mcp_category.type";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export async function listMcpCategoriesAction(): Promise<McpResult<McpCategorySelect[]>> {
  const action = "mcp_category:list";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_READ)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized.", role: userSession.user.role });
      return { ok: false, error: "You are not authorized for this action." };
    }

    const categories = await listMcpCategories();
    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    return { ok: true, data: categories };
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function createMcpCategoryAction(input: {
  slug: string;
  name: string;
  description?: string;
  displayOrder?: number;
}): Promise<McpResult<McpCategorySelect>> {
  const action = "mcp_category:create";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_MANAGE_ALL)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Only admins or owners can create categories.", role: userSession.user.role });
      return { ok: false, error: "Only admins or owners can create categories." };
    }

    const result = await createMcpCategory(input);
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function updateMcpCategoryAction(input: {
  id: string;
  name?: string;
  description?: string | null;
  displayOrder?: number;
}): Promise<McpResult<McpCategorySelect>> {
  const action = "mcp_category:update";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_MANAGE_ALL)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Only admins or owners can update categories.", role: userSession.user.role });
      return { ok: false, error: "Only admins or owners can update categories." };
    }

    const result = await updateMcpCategory(input);
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function deleteMcpCategoryAction(id: string): Promise<McpResult> {
  const action = "mcp_category:delete";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_MANAGE_ALL)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Only admins or owners can delete categories.", role: userSession.user.role });
      return { ok: false, error: "Only admins or owners can delete categories." };
    }

    const result = await deleteMcpCategory(id);
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error, metadata: { targetCategoryId: id } });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message, metadata: { targetCategoryId: id } });
    return { ok: false, error: message };
  }
}

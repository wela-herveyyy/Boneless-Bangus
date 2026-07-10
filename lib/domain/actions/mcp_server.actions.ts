"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import {
  getMcpCatalogue,
  createMcpServer,
  updateMcpServer,
  deleteMcpServer,
} from "@/lib/domain/services/mcp_server.service";
import { listMcpCategories } from "@/lib/domain/services/mcp_category.service";
import {
  hasMcpPermission,
  MCP_PERMISSION,
  type CreateMcpInput,
  type DeleteMcpInput,
  type McpDataPayload,
  type McpResult,
  type McpServerDetailed,
  type UpdateMcpInput,
  USER_AI_CONFIG_DEFAULT,
} from "@/lib/entities/mcp_server.type";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export async function getMcpDataAction(): Promise<McpResult<McpDataPayload>> {
  const action = "mcp:get-data";
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

    const [catalogue, categories] = await Promise.all([
      getMcpCatalogue(),
      listMcpCategories(),
    ]);

    const canManageAll = hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_MANAGE_ALL);

    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });

    return {
      ok: true,
      data: {
        catalogue,
        categories,
        userConfig: USER_AI_CONFIG_DEFAULT,
        currentUserId: userSession.user.id,
        canManageAll,
      },
    };
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function createMcpServerAction(
  input: CreateMcpInput,
): Promise<McpResult<McpServerDetailed>> {
  const action = "mcp:create";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_CREATE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized to create MCP servers.", role: userSession.user.role });
      return { ok: false, error: "Not authorized to create MCP servers." };
    }

    const result = await createMcpServer({ ...input, userId: userSession.user.id });
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error, metadata: { slug: input.slug } });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message, metadata: { slug: input.slug } });
    return { ok: false, error: message };
  }
}

export async function updateMcpServerAction(
  input: UpdateMcpInput,
): Promise<McpResult<McpServerDetailed>> {
  const action = "mcp:update";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_CREATE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized to update MCP servers.", role: userSession.user.role });
      return { ok: false, error: "Not authorized to update MCP servers." };
    }

    const canManageAll = hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_MANAGE_ALL);
    if (!canManageAll) {
      const catalogue = await getMcpCatalogue();
      const server = catalogue.find((s) => s.id === input.id);
      if (!server || server.userId !== userSession.user.id) {
        return { ok: false, error: "You can only update your own MCP servers." };
      }
    }

    const result = await updateMcpServer(input);
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error, metadata: { targetId: input.id } });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message, metadata: { targetId: input.id } });
    return { ok: false, error: message };
  }
}

export async function deleteMcpServerAction(
  input: DeleteMcpInput,
): Promise<McpResult> {
  const action = "mcp:delete";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_CREATE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized to delete MCP servers.", role: userSession.user.role });
      return { ok: false, error: "Not authorized to delete MCP servers." };
    }

    const canManageAll = hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_MANAGE_ALL);
    if (!canManageAll) {
      const catalogue = await getMcpCatalogue();
      const server = catalogue.find((s) => s.id === input.id);
      if (!server || server.userId !== userSession.user.id) {
        return { ok: false, error: "You can only delete your own MCP servers." };
      }
    }

    const result = await deleteMcpServer(input);
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error, metadata: { targetId: input.id } });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message, metadata: { targetId: input.id } });
    return { ok: false, error: message };
  }
}

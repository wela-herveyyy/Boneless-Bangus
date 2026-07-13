"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import {
  listMcpServerTools,
  addMcpServerTool,
  updateMcpServerTool,
  deleteMcpServerTool,
} from "@/lib/domain/services/mcp_server_tool.service";
import { getMcpCatalogue } from "@/lib/domain/services/mcp_server.service";
import {
  hasMcpPermission,
  MCP_PERMISSION,
  type McpResult,
} from "@/lib/entities/mcp_server.type";
import type { McpServerToolSelect } from "@/lib/entities/mcp_server_tool.type";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export async function listMcpServerToolsAction(serverId: string): Promise<McpResult<McpServerToolSelect[]>> {
  const action = "mcp_server_tool:list";
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

    const tools = await listMcpServerTools(serverId);
    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    return { ok: true, data: tools };
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function addMcpServerToolAction(input: {
  mcpServerId: string;
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  displayOrder?: number;
}): Promise<McpResult<McpServerToolSelect>> {
  const action = "mcp_server_tool:add";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_CREATE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized to create tools.", role: userSession.user.role });
      return { ok: false, error: "Not authorized to create tools." };
    }

    const canManageAll = hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_MANAGE_ALL);
    if (!canManageAll) {
      const catalogue = await getMcpCatalogue();
      const server = catalogue.find((s) => s.id === input.mcpServerId);
      if (!server || server.userId !== userSession.user.id) {
        return { ok: false, error: "You can only add tools to your own MCP servers." };
      }
    }

    const result = await addMcpServerTool(input);
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function updateMcpServerToolAction(input: {
  id: string;
  name?: string;
  description?: string;
  inputSchema?: Record<string, unknown> | null;
  displayOrder?: number;
}): Promise<McpResult<McpServerToolSelect>> {
  const action = "mcp_server_tool:update";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_CREATE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized to update tools.", role: userSession.user.role });
      return { ok: false, error: "Not authorized to update tools." };
    }

    const canManageAll = hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_MANAGE_ALL);
    if (!canManageAll) {
      const catalogue = await getMcpCatalogue();
      const server = catalogue.find((s) => s.tools.some((t) => t.id === input.id));
      if (!server || server.userId !== userSession.user.id) {
        return { ok: false, error: "You can only update tools on your own MCP servers." };
      }
    }

    const result = await updateMcpServerTool(input);
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function deleteMcpServerToolAction(id: string): Promise<McpResult> {
  const action = "mcp_server_tool:delete";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_CREATE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized to delete tools.", role: userSession.user.role });
      return { ok: false, error: "Not authorized to delete tools." };
    }

    const canManageAll = hasMcpPermission(userSession.user.role, MCP_PERMISSION.MCP_MANAGE_ALL);
    if (!canManageAll) {
      const catalogue = await getMcpCatalogue();
      const server = catalogue.find((s) => s.tools.some((t) => t.id === id));
      if (!server || server.userId !== userSession.user.id) {
        return { ok: false, error: "You can only delete tools from your own MCP servers." };
      }
    }

    const result = await deleteMcpServerTool(id);
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error, metadata: { targetToolId: id } });
    return result;
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message, metadata: { targetToolId: id } });
    return { ok: false, error: message };
  }
}

import { asc, eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpServerTool } from "@/database/schema";
import type { McpServerToolSelect } from "@/lib/entities/mcp_server_tool.type";

export async function listMcpServerToolsUseCase(
  serverId: string,
): Promise<McpServerToolSelect[]> {
  try {
    if (!serverId) return [];

    return await database
      .select()
      .from(mcpServerTool)
      .where(eq(mcpServerTool.mcpServerId, serverId))
      .orderBy(asc(mcpServerTool.displayOrder), asc(mcpServerTool.name));
  } catch (error) {
    console.error("Failed to fetch tools for server:", error);
    return [];
  }
}

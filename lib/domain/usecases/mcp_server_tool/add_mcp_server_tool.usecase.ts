import { revalidateTag } from "next/cache";
import { database } from "@/database";
import { mcpServerTool } from "@/database/schema";
import type { McpServerToolSelect, McpToolInput } from "@/lib/entities/mcp_server_tool.type";
import type { McpResult } from "@/lib/entities/mcp_server.type";

export type AddMcpServerToolInput = McpToolInput & {
  mcpServerId: string;
  displayOrder?: number;
};

function parseSchema(val: unknown): Record<string, unknown> | null {
  if (!val) return null;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof val === "object" && val !== null ? (val as Record<string, unknown>) : null;
}

export async function addMcpServerToolUseCase(
  input: AddMcpServerToolInput,
): Promise<McpResult<McpServerToolSelect>> {
  try {
    if (!input.mcpServerId || !input.name.trim()) {
      return { ok: false, error: "Server ID and tool name are required." };
    }

    const newTool: McpServerToolSelect = {
      id: crypto.randomUUID(),
      mcpServerId: input.mcpServerId,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      inputSchema: parseSchema(input.inputSchema),
      displayOrder: input.displayOrder ?? 0,
      createdAt: new Date(),
    };

    await database.insert(mcpServerTool).values(newTool);
    revalidateTag("mcp_catalogue", "hours");

    return { ok: true, data: newTool };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add tool.";
    return { ok: false, error: message };
  }
}

import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpServerTool } from "@/database/schema";
import type { McpServerToolSelect } from "@/lib/entities/mcp_server_tool.type";
import type { McpResult } from "@/lib/entities/mcp_server.type";

export type UpdateMcpServerToolInput = {
  id: string;
  name?: string;
  description?: string;
  inputSchema?: Record<string, unknown> | null;
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

export async function updateMcpServerToolUseCase(
  input: UpdateMcpServerToolInput,
): Promise<McpResult<McpServerToolSelect>> {
  try {
    if (!input.id) {
      return { ok: false, error: "Tool ID is required." };
    }

    const [existing] = await database
      .select()
      .from(mcpServerTool)
      .where(eq(mcpServerTool.id, input.id))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Tool not found." };
    }

    const updated: McpServerToolSelect = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      inputSchema: input.inputSchema !== undefined ? parseSchema(input.inputSchema) : existing.inputSchema,
      displayOrder: input.displayOrder ?? existing.displayOrder,
    };

    await database
      .update(mcpServerTool)
      .set({
        name: updated.name,
        description: updated.description,
        inputSchema: updated.inputSchema,
        displayOrder: updated.displayOrder,
      })
      .where(eq(mcpServerTool.id, input.id));

    revalidateTag("mcp_catalogue", "hours");

    return { ok: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tool.";
    return { ok: false, error: message };
  }
}

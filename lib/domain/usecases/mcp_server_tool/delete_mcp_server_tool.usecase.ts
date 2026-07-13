import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpServerTool } from "@/database/schema";
import type { McpResult } from "@/lib/entities/mcp_server.type";

export async function deleteMcpServerToolUseCase(id: string): Promise<McpResult> {
  try {
    if (!id) {
      return { ok: false, error: "Tool ID is required." };
    }

    await database.delete(mcpServerTool).where(eq(mcpServerTool.id, id));
    revalidateTag("mcp_catalogue", "hours");

    return { ok: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete tool.";
    return { ok: false, error: message };
  }
}

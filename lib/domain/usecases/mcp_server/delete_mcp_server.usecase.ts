import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpServer } from "@/database/schema";
import type { DeleteMcpInput, McpResult } from "@/lib/entities/mcp_server.type";

export async function deleteMcpServerUseCase(input: DeleteMcpInput): Promise<McpResult> {
  try {
    if (!input.id) {
      return { ok: false, error: "Server ID is required." };
    }

    await database.delete(mcpServer).where(eq(mcpServer.id, input.id));
    revalidateTag("mcp_catalogue", "hours");

    return { ok: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete MCP server.";
    return { ok: false, error: message };
  }
}

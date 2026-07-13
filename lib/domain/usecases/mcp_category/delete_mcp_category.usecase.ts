import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpCategory, mcpServer } from "@/database/schema";
import type { McpResult } from "@/lib/entities/mcp_server.type";

export async function deleteMcpCategoryUseCase(id: string): Promise<McpResult> {
  try {
    if (!id) {
      return { ok: false, error: "Category ID is required." };
    }

    const [referencingServer] = await database
      .select({ id: mcpServer.id })
      .from(mcpServer)
      .where(eq(mcpServer.categoryId, id))
      .limit(1);

    if (referencingServer) {
      return {
        ok: false,
        error: "Cannot delete category because it is currently assigned to one or more MCP servers.",
      };
    }

    await database.delete(mcpCategory).where(eq(mcpCategory.id, id));

    revalidateTag("mcp_categories", "hours");
    revalidateTag("mcp_catalogue", "hours");

    return { ok: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category.";
    return { ok: false, error: message };
  }
}

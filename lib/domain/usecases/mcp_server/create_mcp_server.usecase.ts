import { revalidateTag } from "next/cache";
import { database } from "@/database";
import { mcpServer, mcpServerTool } from "@/database/schema";
import type { CreateMcpInput, McpResult, McpServerDetailed } from "@/lib/entities/mcp_server.type";
import { getMcpCatalogueUseCase } from "./get_mcp_catalogue.usecase";

export type CreateMcpServerWithUser = CreateMcpInput & {
  userId: string;
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

export async function createMcpServerUseCase(
  input: CreateMcpServerWithUser,
): Promise<McpResult<McpServerDetailed>> {
  try {
    const slug = input.slug.trim().toLowerCase();
    const name = input.name.trim();

    if (!slug || !name || !input.categoryId || !input.userId) {
      return { ok: false, error: "Slug, name, category, and user ID are required." };
    }

    const serverId = crypto.randomUUID();

    await database.transaction(async (tx) => {
      await tx.insert(mcpServer).values({
        id: serverId,
        slug,
        name,
        description: input.description.trim(),
        categoryId: input.categoryId,
        userId: input.userId,
        configTemplate: input.configTemplate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (input.tools && input.tools.length > 0) {
        const toolsToInsert = input.tools.map((t, idx) => ({
          id: crypto.randomUUID(),
          mcpServerId: serverId,
          name: (t.name || "").trim(),
          description: (t.description || "").trim(),
          inputSchema: parseSchema(t.inputSchema),
          displayOrder: idx,
          createdAt: new Date(),
        }));
        await tx.insert(mcpServerTool).values(toolsToInsert);
      }
    });

    revalidateTag("mcp_catalogue", "hours");

    const catalogue = await getMcpCatalogueUseCase();
    const created = catalogue.find((s) => s.id === serverId);

    if (!created) {
      return { ok: false, error: "Server created but failed to retrieve details." };
    }

    return { ok: true, data: created };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create MCP server.";
    return { ok: false, error: message };
  }
}

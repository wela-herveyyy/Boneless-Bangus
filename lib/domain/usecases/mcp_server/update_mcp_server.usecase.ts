import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpServer, mcpServerTool } from "@/database/schema";
import type { McpResult, McpServerDetailed, UpdateMcpInput } from "@/lib/entities/mcp_server.type";
import { fetchMcpServerByIdFromDb, getMcpCatalogueUseCase } from "./get_mcp_catalogue.usecase";

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

export async function updateMcpServerUseCase(
  input: UpdateMcpInput,
): Promise<McpResult<McpServerDetailed>> {
  try {
    if (!input.id) {
      return { ok: false, error: "Server ID is required." };
    }

    const [existing] = await database
      .select()
      .from(mcpServer)
      .where(eq(mcpServer.id, input.id))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Server not found." };
    }

    await database.transaction(async (tx) => {
      await tx
        .update(mcpServer)
        .set({
          name: input.name?.trim() ?? existing.name,
          description: input.description !== undefined ? input.description.trim() : existing.description,
          categoryId: input.categoryId ?? existing.categoryId,
          configTemplate: input.configTemplate ?? existing.configTemplate,
          isGlobal: input.isGlobal ?? existing.isGlobal,
          updatedAt: new Date(),
        })
        .where(eq(mcpServer.id, input.id));

      if (input.tools !== undefined) {
        await tx.delete(mcpServerTool).where(eq(mcpServerTool.mcpServerId, input.id));
        if (input.tools.length > 0) {
          const toolsToInsert = input.tools.map((t, idx) => ({
            id: crypto.randomUUID(),
            mcpServerId: input.id,
            name: (t.name || "").trim(),
            description: (t.description || "").trim(),
            inputSchema: parseSchema(t.inputSchema),
            displayOrder: idx,
            createdAt: new Date(),
          }));
          await tx.insert(mcpServerTool).values(toolsToInsert);
        }
      }
    });

    revalidateTag("mcp_catalogue", "hours");

    const updated = await fetchMcpServerByIdFromDb(input.id);

    if (!updated) {
      return { ok: false, error: "Server updated but failed to retrieve details." };
    }

    return { ok: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update MCP server.";
    return { ok: false, error: message };
  }
}

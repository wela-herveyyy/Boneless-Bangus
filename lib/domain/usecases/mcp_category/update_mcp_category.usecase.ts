import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpCategory } from "@/database/schema";
import type { McpCategorySelect } from "@/lib/entities/mcp_category.type";
import type { McpResult } from "@/lib/entities/mcp_server.type";

export type UpdateMcpCategoryInput = {
  id: string;
  name?: string;
  description?: string | null;
  displayOrder?: number;
};

export async function updateMcpCategoryUseCase(
  input: UpdateMcpCategoryInput,
): Promise<McpResult<McpCategorySelect>> {
  try {
    if (!input.id) {
      return { ok: false, error: "Category ID is required." };
    }

    const [existing] = await database
      .select()
      .from(mcpCategory)
      .where(eq(mcpCategory.id, input.id))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Category not found." };
    }

    const updated: McpCategorySelect = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      description: input.description !== undefined ? (input.description?.trim() ?? null) : existing.description,
      displayOrder: input.displayOrder ?? existing.displayOrder,
      updatedAt: new Date(),
    };

    await database
      .update(mcpCategory)
      .set({
        name: updated.name,
        description: updated.description,
        displayOrder: updated.displayOrder,
        updatedAt: updated.updatedAt,
      })
      .where(eq(mcpCategory.id, input.id));

    revalidateTag("mcp_categories", "hours");
    revalidateTag("mcp_catalogue", "hours");

    return { ok: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category.";
    return { ok: false, error: message };
  }
}

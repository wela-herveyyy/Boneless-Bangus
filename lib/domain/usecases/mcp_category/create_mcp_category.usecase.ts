import { revalidateTag } from "next/cache";
import { database } from "@/database";
import { mcpCategory } from "@/database/schema";
import type { McpCategorySelect } from "@/lib/entities/mcp_category.type";
import type { McpResult } from "@/lib/entities/mcp_server.type";

export type CreateMcpCategoryInput = {
  slug: string;
  name: string;
  description?: string;
  displayOrder?: number;
};

export async function createMcpCategoryUseCase(
  input: CreateMcpCategoryInput,
): Promise<McpResult<McpCategorySelect>> {
  try {
    const slug = input.slug.trim().toLowerCase();
    const name = input.name.trim();

    if (!slug || !name) {
      return { ok: false, error: "Slug and name are required." };
    }

    const newCategory: McpCategorySelect = {
      id: crypto.randomUUID(),
      slug,
      name,
      description: input.description?.trim() ?? null,
      displayOrder: input.displayOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await database.insert(mcpCategory).values(newCategory);
    revalidateTag("mcp_categories", "hours");
    revalidateTag("mcp_catalogue", "hours");

    return { ok: true, data: newCategory };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category.";
    return { ok: false, error: message };
  }
}

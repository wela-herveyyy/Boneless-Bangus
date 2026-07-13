import { cacheLife, cacheTag } from "next/cache";
import { asc } from "drizzle-orm";
import { database } from "@/database";
import { mcpCategory } from "@/database/schema";
import type { McpCategorySelect } from "@/lib/entities/mcp_category.type";

export async function listMcpCategoriesUseCase(): Promise<McpCategorySelect[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("mcp_categories");

  try {
    return await database
      .select()
      .from(mcpCategory)
      .orderBy(asc(mcpCategory.displayOrder), asc(mcpCategory.name));
  } catch (error) {
    console.error("Failed to fetch MCP categories:", error);
    return [];
  }
}

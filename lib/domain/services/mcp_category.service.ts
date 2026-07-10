import { listMcpCategoriesUseCase } from "../usecases/mcp_category/list_mcp_categories.usecase";
import { createMcpCategoryUseCase, type CreateMcpCategoryInput } from "../usecases/mcp_category/create_mcp_category.usecase";
import { updateMcpCategoryUseCase, type UpdateMcpCategoryInput } from "../usecases/mcp_category/update_mcp_category.usecase";
import { deleteMcpCategoryUseCase } from "../usecases/mcp_category/delete_mcp_category.usecase";
import type { McpCategorySelect } from "@/lib/entities/mcp_category.type";
import type { McpResult } from "@/lib/entities/mcp_server.type";

export async function listMcpCategories(): Promise<McpCategorySelect[]> {
  return listMcpCategoriesUseCase();
}

export async function createMcpCategory(
  input: CreateMcpCategoryInput,
): Promise<McpResult<McpCategorySelect>> {
  return createMcpCategoryUseCase(input);
}

export async function updateMcpCategory(
  input: UpdateMcpCategoryInput,
): Promise<McpResult<McpCategorySelect>> {
  return updateMcpCategoryUseCase(input);
}

export async function deleteMcpCategory(id: string): Promise<McpResult> {
  return deleteMcpCategoryUseCase(id);
}

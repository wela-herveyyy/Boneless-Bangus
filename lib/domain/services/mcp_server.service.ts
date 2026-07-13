import { getMcpCatalogueUseCase } from "../usecases/mcp_server/get_mcp_catalogue.usecase";
import { createMcpServerUseCase, type CreateMcpServerWithUser } from "../usecases/mcp_server/create_mcp_server.usecase";
import { updateMcpServerUseCase } from "../usecases/mcp_server/update_mcp_server.usecase";
import { deleteMcpServerUseCase } from "../usecases/mcp_server/delete_mcp_server.usecase";
import type {
  DeleteMcpInput,
  McpResult,
  McpServerDetailed,
  UpdateMcpInput,
} from "@/lib/entities/mcp_server.type";

export async function getMcpCatalogue(): Promise<McpServerDetailed[]> {
  return getMcpCatalogueUseCase();
}

export async function createMcpServer(
  input: CreateMcpServerWithUser,
): Promise<McpResult<McpServerDetailed>> {
  return createMcpServerUseCase(input);
}

export async function updateMcpServer(
  input: UpdateMcpInput,
): Promise<McpResult<McpServerDetailed>> {
  return updateMcpServerUseCase(input);
}

export async function deleteMcpServer(
  input: DeleteMcpInput,
): Promise<McpResult> {
  return deleteMcpServerUseCase(input);
}

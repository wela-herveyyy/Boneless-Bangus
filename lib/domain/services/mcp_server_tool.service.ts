import { listMcpServerToolsUseCase } from "../usecases/mcp_server_tool/list_mcp_server_tools.usecase";
import { addMcpServerToolUseCase, type AddMcpServerToolInput } from "../usecases/mcp_server_tool/add_mcp_server_tool.usecase";
import { updateMcpServerToolUseCase, type UpdateMcpServerToolInput } from "../usecases/mcp_server_tool/update_mcp_server_tool.usecase";
import { deleteMcpServerToolUseCase } from "../usecases/mcp_server_tool/delete_mcp_server_tool.usecase";
import type { McpServerToolSelect } from "@/lib/entities/mcp_server_tool.type";
import type { McpResult } from "@/lib/entities/mcp_server.type";

export async function listMcpServerTools(
  serverId: string,
): Promise<McpServerToolSelect[]> {
  return listMcpServerToolsUseCase(serverId);
}

export async function addMcpServerTool(
  input: AddMcpServerToolInput,
): Promise<McpResult<McpServerToolSelect>> {
  return addMcpServerToolUseCase(input);
}

export async function updateMcpServerTool(
  input: UpdateMcpServerToolInput,
): Promise<McpResult<McpServerToolSelect>> {
  return updateMcpServerToolUseCase(input);
}

export async function deleteMcpServerTool(id: string): Promise<McpResult> {
  return deleteMcpServerToolUseCase(id);
}

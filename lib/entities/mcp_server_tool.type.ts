import { mcpServerTool } from "@/database/schema";

export type McpServerToolSelect = typeof mcpServerTool.$inferSelect;
export type McpServerToolInsert = typeof mcpServerTool.$inferInsert;

export type McpToolInput = {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown> | string | null;
};

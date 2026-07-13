import { useMemo } from "react";
import type { McpServer } from "@/lib/entities/mcp_server.type";

export type UseMcpServerCardReturn = {
  toolsCount: number;
  toolsLabel: string;
};

export function useMcpServerCard(server: McpServer): UseMcpServerCardReturn {
  return useMemo(() => {
    const toolsCount = server.tools?.length ?? 0;
    const toolsLabel = `${toolsCount} ${toolsCount === 1 ? "tool" : "tools"} included`;
    return { toolsCount, toolsLabel };
  }, [server.tools]);
}

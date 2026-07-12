import { useMemo } from "react";
import type { McpServer } from "@/lib/entities/mcp_server.type";

export type UseMcpToolsPreviewModalReturn = {
  tools: any[];
  isEnabled: boolean;
};

export function useMcpToolsPreviewModal(server: McpServer | null): UseMcpToolsPreviewModalReturn {
  return useMemo(() => {
    if (!server) {
      return { tools: [], isEnabled: false };
    }
    const tools = server.tools || [];
    const isEnabled = Boolean(server.enabled);
    return { tools, isEnabled };
  }, [server]);
}

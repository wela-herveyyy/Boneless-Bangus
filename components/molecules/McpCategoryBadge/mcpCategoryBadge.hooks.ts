import type { McpCategory } from "@/lib/entities/mcp_server.type";

export function useMcpCategoryBadge(category: McpCategory) {
  const isCompany = category === "company_tools";

  const className = [
    "rounded-full px-2 py-0.5 text-[10px] font-medium",
    isCompany ? "bg-secondary/15 text-secondary" : "bg-surface-container-high text-on-surface-muted",
  ].join(" ");

  return { className };
}

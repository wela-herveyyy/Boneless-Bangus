import type { BadgeVariant } from "@/components/atoms/Badge/badge.hooks";
import { getCategoryLabel, type McpCategory } from "@/lib/entities/mcp_server.type";

export function useMcpCategoryBadge(category: McpCategory) {
  const variant: BadgeVariant = category === "company_tools" ? "secondary" : "muted";
  const label = getCategoryLabel(category);

  return { variant, label };
}

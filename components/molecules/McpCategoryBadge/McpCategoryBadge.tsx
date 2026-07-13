import { Badge } from "@/components/atoms/Badge/Badge";
import type { McpCategory } from "@/lib/entities/mcp_server.type";
import { useMcpCategoryBadge } from "./mcpCategoryBadge.hooks";

type McpCategoryBadgeProps = {
  category: McpCategory;
};

export function McpCategoryBadge({ category }: McpCategoryBadgeProps) {
  const { variant, label } = useMcpCategoryBadge(category);
  return <Badge variant={variant}>{label}</Badge>;
}

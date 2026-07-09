import { getCategoryLabel, type McpCategory } from "@/lib/entities/mcp_server.type";
import { useMcpCategoryBadge } from "./mcpCategoryBadge.hooks";

type McpCategoryBadgeProps = {
  category: McpCategory;
};

export function McpCategoryBadge({ category }: McpCategoryBadgeProps) {
  const { className } = useMcpCategoryBadge(category);
  return <span className={className}>{getCategoryLabel(category)}</span>;
}

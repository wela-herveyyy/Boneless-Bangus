import { LuCheck } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { McpCategoryBadge } from "@/components/molecules/McpCategoryBadge/McpCategoryBadge";
import type { McpServer } from "@/lib/entities/mcp_server.type";

export type McpServerCardProps = {
  server: McpServer;
  onToggle: () => void;
  isPendingDelete?: boolean;
  onEdit?: () => void;
  onRequestDelete?: () => void;
  onCancelDelete?: () => void;
  onConfirmDelete?: () => void;
};

export function McpServerCard({
  server,
  onToggle,
}: McpServerCardProps) {
  return (
    <li className="rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high/60 ghost-border">
      {/* Title & Category */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-on-surface">{server.name}</p>
        <McpCategoryBadge category={server.category} />
      </div>

      {/* Description */}
      <p className="mt-1.5 text-xs leading-relaxed text-on-surface-muted">
        {server.description}
      </p>

      {/* Footer row: Author on left, Install button on right */}
      <div className="mt-4 flex items-center justify-between gap-3 pt-1">
        <p className="truncate text-[11px] text-on-surface-muted">by {server.author}</p>

        <Button
          type="button"
          onClick={onToggle}
          variant={server.enabled ? "secondary" : "primary"}
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold shadow-bloom"
        >
          {server.enabled ? (
            <>
              <LuCheck className="size-3.5" aria-hidden />
              <span>Installed</span>
            </>
          ) : (
            "Install"
          )}
        </Button>
      </div>
    </li>
  );
}




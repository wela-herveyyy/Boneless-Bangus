import { LuCheck, LuPencil, LuTrash2, LuWrench } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { McpCategoryBadge } from "@/components/molecules/McpCategoryBadge/McpCategoryBadge";
import type { McpServer } from "@/lib/entities/mcp_server.type";

export type McpServerCardProps = {
  server: McpServer;
  onToggle: () => void;
  onViewTools?: () => void;
  isPendingDelete?: boolean;
  onEdit?: () => void;
  onRequestDelete?: () => void;
  onCancelDelete?: () => void;
  onConfirmDelete?: () => void;
  canManage?: boolean;
};

export function McpServerCard({
  server,
  onToggle,
  onViewTools,
  isPendingDelete,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  canManage,
}: McpServerCardProps) {
  const toolsCount = server.tools?.length ?? 0;

  return (
    <li className="flex flex-col justify-between rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high/60 ghost-border">
      <div>
        {/* Title & Category */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-on-surface">{server.name}</p>
          <McpCategoryBadge category={server.category} />
        </div>

        {/* Description */}
        <p className="mt-1.5 text-xs leading-relaxed text-on-surface-muted">
          {server.description}
        </p>

        {/* Tools Badge / Trigger */}
        {toolsCount > 0 && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={onViewTools}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-surface-container-high transition-colors"
            >
              <LuWrench className="size-3" aria-hidden />
              <span>
                {toolsCount} {toolsCount === 1 ? "tool" : "tools"} included
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Footer row: Author on left, Actions on right */}
      <div className="mt-4 flex items-center justify-between gap-3 pt-2 border-t border-outline/10">
        <p className="truncate text-[11px] text-on-surface-muted">by {server.author}</p>

        <div className="flex items-center gap-2">
          {canManage && (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  title="Edit server"
                  className="p-1.5 text-on-surface-muted hover:text-on-surface rounded-lg transition-colors"
                >
                  <LuPencil className="size-3.5" aria-hidden />
                </button>
              )}
              {onRequestDelete && !isPendingDelete && (
                <button
                  type="button"
                  onClick={onRequestDelete}
                  title="Delete server"
                  className="p-1.5 text-on-surface-muted hover:text-red-400 rounded-lg transition-colors"
                >
                  <LuTrash2 className="size-3.5" aria-hidden />
                </button>
              )}
            </>
          )}

          {isPendingDelete ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-red-400 font-medium">Delete?</span>
              <button
                type="button"
                onClick={onConfirmDelete}
                className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="px-2 py-0.5 rounded bg-surface-container text-on-surface-muted hover:text-on-surface"
              >
                No
              </button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={onToggle}
              variant={server.enabled ? "secondary" : "primary"}
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-bloom"
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
          )}
        </div>
      </div>
    </li>
  );
}

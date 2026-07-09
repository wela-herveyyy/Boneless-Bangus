import { LuPencil, LuPower, LuTrash2, LuX } from "react-icons/lu";
import { McpCategoryBadge } from "@/components/molecules/McpCategoryBadge/McpCategoryBadge";
import type { McpServer } from "@/lib/entities/mcp_server.type";

export type McpServerCardProps = {
  server: McpServer;
  isPendingDelete: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export function McpServerCard({
  server,
  isPendingDelete,
  onToggle,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: McpServerCardProps) {
  return (
    <li className="rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high/60">
      <div className="flex items-start justify-between gap-3">
        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-on-surface">{server.name}</p>
            <McpCategoryBadge category={server.category} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">
            {server.description}
          </p>
          <p className="mt-2 text-[10px] text-on-surface-muted">by {server.author}</p>
        </div>

        {/* Actions */}
        <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
          {/* Edit */}
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${server.name}`}
            className="flex size-8 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted transition-colors hover:bg-surface-container-highest hover:text-primary"
          >
            <LuPencil className="size-3.5" aria-hidden />
          </button>

          {/* Delete — two-click confirm */}
          {isPendingDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onCancelDelete}
                aria-label="Cancel delete"
                className="flex size-8 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted transition-colors hover:bg-surface-container-highest"
              >
                <LuX className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                aria-label={`Confirm delete ${server.name}`}
                className="flex size-8 items-center justify-center rounded-xl bg-secondary/15 text-secondary transition-colors hover:bg-secondary/25"
              >
                <LuTrash2 className="size-3.5" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRequestDelete}
              aria-label={`Delete ${server.name}`}
              className="flex size-8 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted transition-colors hover:bg-secondary/15 hover:text-secondary"
            >
              <LuTrash2 className="size-3.5" aria-hidden />
            </button>
          )}

          {/* Enable / Disable */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={server.enabled ? `Disable ${server.name}` : `Enable ${server.name}`}
            aria-pressed={server.enabled}
            className={[
              "flex size-8 items-center justify-center rounded-xl transition-colors",
              server.enabled
                ? "bg-tertiary/15 text-tertiary shadow-[0_0_24px_color-mix(in_srgb,var(--tertiary)_20%,transparent)]"
                : "bg-surface-container-high text-on-surface-muted hover:bg-surface-container-highest hover:text-on-surface",
            ].join(" ")}
          >
            <LuPower className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}


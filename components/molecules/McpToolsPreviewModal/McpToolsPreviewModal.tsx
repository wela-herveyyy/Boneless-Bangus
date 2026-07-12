"use client";

import { LuCheck, LuInfo, LuPower, LuTerminal, LuUser, LuWrench, LuX } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { McpCategoryBadge } from "@/components/molecules/McpCategoryBadge/McpCategoryBadge";
import type { McpServer } from "@/lib/entities/mcp_server.type";
import { useMcpToolsPreviewModal } from "./mcpToolsPreviewModal.hooks";

export type McpToolsPreviewModalProps = {
  server: McpServer | null;
  onClose: () => void;
  onToggle?: (serverId: string) => void;
};

export function McpToolsPreviewModal({ server, onClose, onToggle }: McpToolsPreviewModalProps) {
  const { tools, isEnabled } = useMcpToolsPreviewModal(server);
  if (!server) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col max-h-[88vh] w-full max-w-xl rounded-3xl bg-surface-container-lowest p-6 shadow-bloom border border-outline/20">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-outline/10 pb-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                <LuWrench className="size-5" aria-hidden />
              </span>
              <h3 className="font-display text-xl font-bold text-on-surface">
                {server.name}
              </h3>
              {server.category && (
                <McpCategoryBadge category={server.category as any} />
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-on-surface-muted pt-0.5">
              <span className="flex items-center gap-1">
                <LuUser className="size-3.5 text-primary/80" aria-hidden />
                <span>by <strong className="text-on-surface/90">{server.author}</strong></span>
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] bg-surface-container-low px-2 py-0.5 rounded text-on-surface-muted">
                slug: {server.slug}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-on-surface-muted hover:text-on-surface rounded-xl hover:bg-surface-container-low transition-colors shrink-0"
            aria-label="Close details preview"
          >
            <LuX className="size-5" aria-hidden />
          </button>
        </div>

        {/* Modal Body (Scrollable Information & Tools) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Server Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface uppercase tracking-wider">
              <LuInfo className="size-3.5 text-primary" aria-hidden />
              <span>About This MCP Server</span>
            </div>
            <p className="text-sm text-on-surface/90 leading-relaxed bg-surface-container-low p-3.5 rounded-2xl border border-outline/10">
              {server.description || "No detailed description provided for this server."}
            </p>
          </div>

          {/* Configuration Template Preview */}
          {server.configTemplate && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface uppercase tracking-wider">
                <LuTerminal className="size-3.5 text-primary" aria-hidden />
                <span>Configuration Template</span>
              </div>
              <pre className="text-[11px] font-mono overflow-x-auto bg-surface-container-low/80 p-3 rounded-2xl border border-outline/10 text-on-surface/80 leading-relaxed">
                {server.configTemplate}
              </pre>
            </div>
          )}

          {/* Available Tools List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-on-surface uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <LuWrench className="size-3.5 text-primary" aria-hidden />
                <span>Available Tools ({tools.length})</span>
              </div>
              <span className="text-[10px] text-on-surface-muted font-normal lowercase">
                AI-callable functions
              </span>
            </div>

            {tools.length === 0 ? (
              <div className="text-center py-8 bg-surface-container-low/40 rounded-2xl border border-dashed border-outline/20 text-on-surface-muted text-xs">
                No individual tools documented for this server yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tools.map((tool: any) => {
                  const toolName = tool.toolName || tool.name || "Unnamed Tool";
                  return (
                    <div
                      key={tool.id || toolName}
                      className="rounded-2xl bg-surface-container-low p-4 space-y-2 border border-outline/10"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {toolName}
                        </code>
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed">
                        {tool.description || "No description provided."}
                      </p>
                      {tool.useCases && (
                        <div className="pt-2 border-t border-outline/10 text-[11px]">
                          <span className="font-semibold text-on-surface-muted">Use cases: </span>
                          <span className="text-on-surface/80">{tool.useCases}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer (Action Buttons) */}
        <div className="border-t border-outline/10 pt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-on-surface-muted">Status:</span>
            {isEnabled ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full text-[11px]">
                <LuCheck className="size-3.5" aria-hidden />
                <span>Installed & Active</span>
              </span>
            ) : (
              <span className="font-medium text-on-surface-muted bg-surface-container px-2.5 py-1 rounded-full text-[11px]">
                Not Installed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="px-4 py-2 text-xs font-semibold"
            >
              Close
            </Button>
            {onToggle && (
              <Button
                type="button"
                onClick={() => onToggle(server.id)}
                variant={isEnabled ? "danger" : "primary"}
                className={[
                  "flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl shadow-sm transition-all",
                  isEnabled
                    ? "border-error/30 text-error hover:bg-error/10 hover:border-error"
                    : "bg-primary text-on-primary hover:bg-primary-hover shadow-bloom",
                ].join(" ")}
              >
                <LuPower className="size-3.5" aria-hidden />
                <span>{isEnabled ? "Uninstall Server" : "Install Server"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

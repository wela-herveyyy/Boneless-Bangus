"use client";

import { LuCheck, LuInfo, LuPower, LuTerminal, LuUser, LuWrench } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { McpCategoryBadge } from "@/components/molecules/McpCategoryBadge/McpCategoryBadge";
import { Modal } from "@/components/molecules/Modal/Modal";
import type { McpServer } from "@/lib/entities/mcp_server.type";
import { useMcpToolsPreviewModal } from "./mcpToolsPreviewModal.hooks";

export type McpToolsPreviewModalProps = {
  server: McpServer | null;
  onClose: () => void;
  onToggle?: (serverId: string) => void;
};

export function McpToolsPreviewModal({ server, onClose, onToggle }: McpToolsPreviewModalProps) {
  const { tools, isEnabled } = useMcpToolsPreviewModal(server);

  return (
    <Modal
      isOpen={Boolean(server)}
      onClose={onClose}
      size="lg"
      title={
        server ? (
          <span className="flex flex-wrap items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LuWrench className="size-5" aria-hidden />
            </span>
            <span className="font-display text-xl font-bold text-on-surface">{server.name}</span>
            {server.category ? <McpCategoryBadge category={server.category as never} /> : null}
          </span>
        ) : (
          "MCP server"
        )
      }
      description={
        server ? (
          <span className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <LuUser className="size-3.5 text-primary/80" aria-hidden />
              by <strong className="text-on-surface">{server.author}</strong>
            </span>
            <span className="rounded-md bg-surface-container-low px-2 py-0.5 font-mono text-[11px]">
              slug: {server.slug}
            </span>
          </span>
        ) : undefined
      }
      footer={
        server ? (
          <>
            <div className="mr-auto flex items-center gap-2 text-xs">
              <span className="text-on-surface-muted">Status:</span>
              {isEnabled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary/10 px-2.5 py-1 text-[11px] font-bold text-tertiary">
                  <LuCheck className="size-3.5" aria-hidden />
                  Installed & Active
                </span>
              ) : (
                <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-medium text-on-surface-muted">
                  Not Installed
                </span>
              )}
            </div>
            <Button type="button" onClick={onClose} variant="secondary" className="px-4 py-2 text-xs">
              Close
            </Button>
            {onToggle ? (
              <Button
                type="button"
                onClick={() => onToggle(server.id)}
                variant={isEnabled ? "danger" : "primary"}
                className="flex items-center gap-2 px-5 py-2 text-xs"
              >
                <LuPower className="size-3.5" aria-hidden />
                {isEnabled ? "Uninstall Server" : "Install Server"}
              </Button>
            ) : null}
          </>
        ) : undefined
      }
    >
      {server ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
              <LuInfo className="size-3.5 text-primary" aria-hidden />
              About this MCP server
            </div>
            <p className="rounded-2xl bg-surface-container-low p-3.5 text-sm leading-relaxed text-on-surface">
              {server.description || "No detailed description provided for this server."}
            </p>
          </div>

          {server.configTemplate ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface">
                <LuTerminal className="size-3.5 text-primary" aria-hidden />
                Configuration template
              </div>
              <pre className="overflow-x-auto rounded-2xl bg-surface-container-low p-3 font-mono text-[11px] leading-relaxed text-on-surface-muted">
                {server.configTemplate}
              </pre>
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface">
              <div className="flex items-center gap-1.5">
                <LuWrench className="size-3.5 text-primary" aria-hidden />
                Available tools ({tools.length})
              </div>
              <span className="text-[10px] font-normal lowercase text-on-surface-muted">
                AI-callable functions
              </span>
            </div>

            {tools.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-low px-4 py-8 text-center text-xs text-on-surface-muted">
                No individual tools documented for this server yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tools.map((tool: { id?: string; toolName?: string; name?: string; description?: string; useCases?: string }) => {
                  const toolName = tool.toolName || tool.name || "Unnamed Tool";
                  return (
                    <div
                      key={tool.id || toolName}
                      className="space-y-2 rounded-2xl bg-surface-container-low p-4"
                    >
                      <code className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                        {toolName}
                      </code>
                      <p className="text-xs leading-relaxed text-on-surface">
                        {tool.description || "No description provided."}
                      </p>
                      {tool.useCases ? (
                        <p className="pt-1 text-[11px] text-on-surface-muted">
                          <span className="font-semibold">Use cases: </span>
                          {tool.useCases}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

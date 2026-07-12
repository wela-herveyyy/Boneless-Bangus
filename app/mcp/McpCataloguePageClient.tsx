"use client";

import Link from "next/link";
import { LuPlus, LuSearch, LuWrench, LuX } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { McpServerCard } from "@/components/molecules/McpServerCard/McpServerCard";
import type { McpServerToolSelect } from "@/lib/entities/mcp_server_tool.type";
import {
  useMcpCataloguePageClient,
  type McpCataloguePageClientProps,
} from "./mcpCataloguePageClient.hooks";

export function McpCataloguePageClient({ initialData }: McpCataloguePageClientProps) {
  const {
    servers,
    categories,
    currentUserId,
    canManageAll,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    deletingId,
    setDeletingId,
    selectedServerForTools,
    setSelectedServerForTools,
    filteredServers,
    toggleServer,
    confirmDelete,
  } = useMcpCataloguePageClient({ initialData });

  return (
    <div className="space-y-6">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search servers by name, description, or author..."
            className="w-full rounded-2xl bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-muted/60 ghost-border focus:bg-surface-container-lowest"
          />
        </div>

        <Link href="/mcp/new">
          <Button variant="primary" className="flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-bloom text-sm font-semibold">
            <LuPlus className="size-4" />
            <span>Register New Server</span>
          </Button>
        </Link>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={[
            "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
            activeCategory === "all"
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high",
          ].join(" ")}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.slug)}
            className={[
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              activeCategory === cat.slug
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high",
            ].join(" ")}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Server Grid */}
      {filteredServers.length === 0 ? (
        <div className="rounded-3xl bg-surface-container-low p-12 text-center border border-outline/10">
          <p className="text-sm font-medium text-on-surface">No MCP servers found</p>
          <p className="mt-1 text-xs text-on-surface-muted">Try clearing your search query or switching categories.</p>
          <Link href="/mcp/new" className="inline-block mt-4">
            <Button variant="secondary" className="gap-2 text-xs px-4 py-2">
              <LuPlus className="size-3.5" />
              <span>Add Your Own Server</span>
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServers.map((server) => {
            const raw = servers.find((s) => s.id === server.id);
            const canManage = canManageAll || Boolean(raw && raw.id && server.author !== "Custom" && server.author === currentUserId);

            return (
              <McpServerCard
                key={server.id}
                server={server}
                canManage={canManage}
                isPendingDelete={deletingId === server.id}
                onToggle={() => toggleServer(server.id)}
                onViewTools={() => setSelectedServerForTools(server)}
                onEdit={() => {
                  window.location.href = `/mcp/${server.id}/edit`;
                }}
                onRequestDelete={() => setDeletingId(server.id)}
                onCancelDelete={() => setDeletingId(null)}
                onConfirmDelete={() => confirmDelete(server.id)}
              />
            );
          })}
        </ul>
      )}

      {/* Tools Preview Modal */}
      {selectedServerForTools && (
        <div className="fixed inset-0 z-130 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col max-h-[85vh] w-full max-w-lg rounded-3xl bg-surface-container-lowest p-6 shadow-bloom border border-outline/20">
            <div className="flex items-start justify-between gap-4 border-b border-outline/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    <LuWrench className="size-4" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-on-surface">
                    {selectedServerForTools.name} Tools
                  </h3>
                </div>
                <p className="mt-1 text-xs text-on-surface-muted">
                  by {selectedServerForTools.author} • {selectedServerForTools.tools?.length || 0} available tools
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedServerForTools(null)}
                className="p-2 text-on-surface-muted hover:text-on-surface rounded-xl hover:bg-surface-container-low transition-colors"
              >
                <LuX className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {!selectedServerForTools.tools || selectedServerForTools.tools.length === 0 ? (
                <div className="text-center py-8 text-on-surface-muted text-xs">
                  No individual tools documented for this server yet.
                </div>
              ) : (
                selectedServerForTools.tools.map((tool: McpServerToolSelect) => (
                  <div
                    key={tool.id || tool.name}
                    className="rounded-2xl bg-surface-container-low p-4 space-y-2 border border-outline/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {tool.name}
                      </code>
                    </div>
                    <p className="text-xs text-on-surface leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-outline/10 pt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => setSelectedServerForTools(null)}
                variant="secondary"
                className="px-5 py-2 text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

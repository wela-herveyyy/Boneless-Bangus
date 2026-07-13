"use client";

import Link from "next/link";
import { LuPlus, LuSearch, LuWrench, LuX } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { McpServerCard } from "@/components/molecules/McpServerCard/McpServerCard";
import { McpToolsPreviewModal } from "@/components/molecules/McpToolsPreviewModal/McpToolsPreviewModal";
import type { McpServerToolSelect } from "@/lib/entities/mcp_server_tool.type";
import {
  useMcpCataloguePage,
  type McpCataloguePageProps,
} from "./mcpCataloguePage.hooks";

export function McpCataloguePage({ initialData }: McpCataloguePageProps) {
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
  } = useMcpCataloguePage({ initialData });

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
            const canManage = canManageAll || Boolean(
              currentUserId && ((raw?.userId && raw.userId === currentUserId) || (server.userId && server.userId === currentUserId))
            );

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
      <McpToolsPreviewModal
        server={selectedServerForTools}
        onClose={() => setSelectedServerForTools(null)}
        onToggle={(serverId) => toggleServer(serverId)}
      />
    </div>
  );
}

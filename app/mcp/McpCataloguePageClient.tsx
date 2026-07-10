"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuPlus, LuSearch, LuWrench, LuX } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { McpServerCard } from "@/components/molecules/McpServerCard/McpServerCard";
import { deleteMcpServerAction } from "@/lib/domain/actions/mcp_server.actions";
import { USER_AI_CONFIG_DEFAULT, type McpDataPayload, type McpServer, type UserAiConfig } from "@/lib/entities/mcp_server.type";
import { loadUserAiConfigFromIdb, saveUserAiConfigToIdb } from "@/lib/utils/mcp-idb";

export type McpCataloguePageClientProps = {
  initialData: McpDataPayload;
};

export function McpCataloguePageClient({ initialData }: McpCataloguePageClientProps) {
  const [rawServers, setRawServers] = useState(initialData.catalogue);
  const [categories] = useState(initialData.categories);
  const [currentUserId] = useState(initialData.currentUserId);
  const [canManageAll] = useState(initialData.canManageAll);
  const [userConfig, setUserConfig] = useState<UserAiConfig>(USER_AI_CONFIG_DEFAULT);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedServerForTools, setSelectedServerForTools] = useState<McpServer | null>(null);

  useEffect(() => {
    loadUserAiConfigFromIdb().then(setUserConfig).catch(console.error);
  }, []);

  const servers: McpServer[] = useMemo(() => {
    return rawServers.map((s) => {
      const isEnabled = Boolean(userConfig.mcpServers && userConfig.mcpServers[s.slug]);
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        author: s.user?.name || "Custom",
        category: s.category?.slug || "dev-tools",
        categoryId: s.categoryId,
        configTemplate: typeof s.configTemplate === "string"
          ? s.configTemplate
          : JSON.stringify(s.configTemplate, null, 2),
        configTemplateObj: s.configTemplate,
        enabled: isEnabled,
        tools: s.tools || [],
      };
    });
  }, [rawServers, userConfig]);

  const filteredServers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return servers.filter((server) => {
      const matchesCat = activeCategory === "all" || server.category === activeCategory;
      const matchesQ =
        !q ||
        server.name.toLowerCase().includes(q) ||
        server.description.toLowerCase().includes(q) ||
        server.author.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [servers, query, activeCategory]);

  const toggleServer = async (id: string) => {
    const target = servers.find((s) => s.id === id);
    if (!target) return;

    const nextMcpServers = { ...(userConfig.mcpServers || {}) };
    if (target.enabled) {
      delete nextMcpServers[target.slug];
    } else {
      nextMcpServers[target.slug] = target.configTemplateObj || { url: "" };
    }

    const nextConfig = { ...userConfig, mcpServers: nextMcpServers };
    setUserConfig(nextConfig);
    await saveUserAiConfigToIdb(nextConfig);
  };

  const confirmDelete = async (id: string) => {
    const res = await deleteMcpServerAction({ id });
    if (res.ok) {
      setRawServers((prev) => prev.filter((s) => s.id !== id));
    }
    setDeletingId(null);
  };

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
            const raw = rawServers.find((s) => s.id === server.id);
            const canManage = canManageAll || Boolean(raw && raw.userId === currentUserId);

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
                selectedServerForTools.tools.map((tool: any) => (
                  <div
                    key={tool.id || tool.toolName || tool.name}
                    className="rounded-2xl bg-surface-container-low p-4 space-y-2 border border-outline/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {tool.toolName || tool.name}
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

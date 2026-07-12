"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuPackageSearch, LuPlus, LuSearch, LuWrench, LuX } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { McpCategoryBadge } from "@/components/molecules/McpCategoryBadge/McpCategoryBadge";
import { McpServerCard } from "@/components/molecules/McpServerCard/McpServerCard";
import { McpServerForm } from "@/components/organisms/McpServerForm/McpServerForm";
import {
  useRightSidebar,
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
} from "@/components/molecules/RightSidebar";
import { MCP_CATEGORIES, type McpServer, useMcpMarketplace } from "./mcpMarketplace.hooks";

export function McpMarketplace() {
  const {
    filteredServers,
    categories,
    currentUserId,
    canManageAll,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    toggleServer,
    view,
    form,
    setFormField,
    saveState,
    deletingServerId,
    startCreate,
    startEdit,
    cancelForm,
    saveServer,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useMcpMarketplace();

  const [selectedServerForTools, setSelectedServerForTools] = useState<McpServer | null>(null);

  const sidebar = useRightSidebar("mcp", {
    bodyClass: "bbai-mcp-sidebar-open",
    onClose: () => {
      if (selectedServerForTools) setSelectedServerForTools(null);
      if (view !== "list") cancelForm();
    },
    onEscape: () => {
      if (selectedServerForTools) {
        setSelectedServerForTools(null);
        return true;
      }
      if (view !== "list") {
        cancelForm();
        return true;
      }
      return false;
    },
  });

  const { closeSidebar } = sidebar;

  const panelTitle =
    view === "create" ? "New Server" : view === "edit" ? "Edit Server" : "Explore MCP Servers";
  const panelSubtitle =
    view === "create"
      ? "Register a new MCP server"
      : view === "edit"
        ? "Update server details"
        : "MCP MARKETPLACE";

  return (
    <>
      <RightSidebarTrigger
        sidebar={sidebar}
        icon={<LuPackageSearch className="size-5" aria-hidden />}
        labelOpen="Hide MCP Marketplace"
        labelClosed="Show MCP Marketplace"
        topClass="top-[calc(50%-3.5rem)]"
      />

      <RightSidebarBackdrop sidebar={sidebar} />

      <RightSidebarPanel sidebar={sidebar} className="mcp-marketplace-panel">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 bg-surface-container-low p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted">
              {panelSubtitle}
            </p>
            <h2 className="font-display text-xl font-bold text-primary">{panelTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={view !== "list" ? cancelForm : closeSidebar}
              className="flex size-9 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
              aria-label={view !== "list" ? "Cancel and go back" : "Close MCP Marketplace"}
            >
              <LuX className="size-5" />
            </button>
          </div>
        </header>

        {/* List view */}
        {view === "list" ? (
          <>
            {/* Search, Add Button & Category Filters */}
            <div className="flex flex-col gap-3.5 border-b border-primary/10 px-4 py-4">
              {/* Search input */}
              <div className="relative">
                <LuSearch
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted"
                  aria-hidden
                />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search servers..."
                  className="w-full rounded-2xl bg-surface-container-low py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-muted/60 ghost-border focus:bg-surface-container-lowest"
                  aria-label="Search MCP servers"
                />
              </div>

              {/* Full-width Add Button */}
              <Button
                type="button"
                onClick={startCreate}
                variant="primary"
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold shadow-bloom"
              >
                <LuPlus className="size-4" aria-hidden />
                <span>Add Your Own Server</span>
              </Button>

              {/* Category filters */}
              <div className="flex gap-1.5 overflow-x-auto pt-0.5 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={[
                    "shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all",
                    activeCategory === "all"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high",
                  ].join(" ")}
                >
                  All
                </button>
                {MCP_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setActiveCategory(cat.value)}
                    className={[
                      "shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all",
                      activeCategory === cat.value
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high",
                    ].join(" ")}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Server list */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {filteredServers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <LuSearch className="size-8 text-on-surface-muted/40 mb-2" aria-hidden />
                  <p className="text-sm font-medium text-on-surface-muted">No servers found</p>
                  <p className="text-xs text-on-surface-muted/70 mt-1">
                    {query || activeCategory !== "all"
                      ? "Try adjusting your search query or filters"
                      : "Register your first MCP server to get started"}
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredServers.map((server) => (
                    <McpServerCard
                      key={server.id}
                      server={server}
                      canManage={
                        canManageAll || Boolean(currentUserId && server.author && server.author === currentUserId)
                      }
                      onToggle={() => toggleServer(server.id)}
                      onViewTools={() => setSelectedServerForTools(server)}
                      onEdit={() => startEdit(server)}
                      isPendingDelete={deletingServerId === server.id}
                      onRequestDelete={() => requestDelete(server.id)}
                      onCancelDelete={cancelDelete}
                      onConfirmDelete={() => confirmDelete(server.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}

        {/* Create / Edit form view */}
        {view === "create" || view === "edit" ? (
          <McpServerForm
            mode={view}
            form={form}
            setFormField={setFormField}
            saveState={saveState}
            onSave={saveServer}
            onCancel={cancelForm}
            categories={categories}
          />
        ) : null}
      </RightSidebarPanel>

      {/* Tools Preview Modal */}
      {selectedServerForTools && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in">
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
                aria-label="Close tools preview"
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
                    {tool.useCases && (
                      <div className="pt-2 border-t border-outline/10 text-[11px]">
                        <span className="font-semibold text-on-surface-muted">Use cases: </span>
                        <span className="text-on-surface/80">{tool.useCases}</span>
                      </div>
                    )}
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
    </>
  );
}

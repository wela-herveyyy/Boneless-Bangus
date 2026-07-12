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
import { McpToolsPreviewModal } from "@/components/molecules/McpToolsPreviewModal";
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
    myServersCount,
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
              <div className="flex gap-1.5 overflow-x-auto pt-0.5 pb-1 no-scrollbar">
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
                {currentUserId && myServersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory("my-servers")}
                    className={[
                      "shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all flex items-center gap-1",
                      activeCategory === "my-servers"
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high",
                    ].join(" ")}
                  >
                    <span>My Servers</span>
                    <span className="rounded-full bg-surface/30 px-1.5 py-0.2 text-[10px] font-bold">
                      {myServersCount}
                    </span>
                  </button>
                )}
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
              ) : activeCategory === "all" && !query.trim() && myServersCount > 0 ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2.5 px-1">
                      <h4 className="text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">
                        Your Custom Servers ({myServersCount})
                      </h4>
                      <span className="text-[10px] text-primary font-semibold">Full Manage Access</span>
                    </div>
                    <ul className="space-y-3">
                      {filteredServers
                        .filter((s) => s.userId === currentUserId)
                        .map((server) => (
                          <McpServerCard
                            key={server.id}
                            server={server}
                            canManage={
                              canManageAll || Boolean(currentUserId && server.userId && server.userId === currentUserId)
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
                  </div>

                  <div className="pt-2 border-t border-outline/10">
                    <h4 className="mb-2.5 px-1 text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">
                      Catalogue Servers
                    </h4>
                    <ul className="space-y-3">
                      {filteredServers
                        .filter((s) => s.userId !== currentUserId)
                        .map((server) => (
                          <McpServerCard
                            key={server.id}
                            server={server}
                            canManage={
                              canManageAll || Boolean(currentUserId && server.userId && server.userId === currentUserId)
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
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredServers.map((server) => (
                    <McpServerCard
                      key={server.id}
                      server={server}
                      canManage={
                        canManageAll || Boolean(currentUserId && server.userId && server.userId === currentUserId)
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
      <McpToolsPreviewModal
        server={selectedServerForTools}
        onClose={() => setSelectedServerForTools(null)}
        onToggle={(serverId) => toggleServer(serverId)}
      />
    </>
  );
}

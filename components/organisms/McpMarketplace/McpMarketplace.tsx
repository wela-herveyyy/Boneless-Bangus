"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuPackageSearch, LuPlus, LuSearch, LuWrench } from "react-icons/lu";
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
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { McpToolsPreviewModal } from "@/components/molecules/McpToolsPreviewModal/McpToolsPreviewModal";
import { MCP_CATEGORIES, type McpServer, useMcpMarketplace } from "./mcpMarketplace.hooks";

export function McpMarketplace({ topOffset }: { topOffset?: string } = {}) {
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
        topOffset={topOffset}
      />

      <RightSidebarBackdrop sidebar={sidebar} />

      <RightSidebarPanel sidebar={sidebar} className="mcp-marketplace-panel">
        <RightSidebarHeader
          sidebar={sidebar}
          subtitle={panelSubtitle}
          title={panelTitle}
          onClose={view !== "list" ? cancelForm : closeSidebar}
          closeLabel={view !== "list" ? "Cancel and go back" : "Close MCP Marketplace"}
        />

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



              {/* Category filters */}
              <div className="flex gap-1.5 overflow-x-auto pt-0.5 pb-1 bbai-scroll">
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
                      onToggle={() => toggleServer(server.id)}
                      onViewTools={() => setSelectedServerForTools(server)}
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

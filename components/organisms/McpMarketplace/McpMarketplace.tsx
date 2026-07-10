"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuPackageSearch, LuPlus, LuSearch, LuX } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { McpCategoryBadge } from "@/components/molecules/McpCategoryBadge/McpCategoryBadge";
import { McpServerCard } from "@/components/molecules/McpServerCard/McpServerCard";
import { McpServerForm } from "@/components/organisms/McpServerForm/McpServerForm";
import { MCP_CATEGORIES, useMcpMarketplace } from "./mcpMarketplace.hooks";

export function McpMarketplace() {
  const {
    filteredServers,
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

  const [hoverOpen, setHoverOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen = hoverOpen || pinnedOpen;

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      if (!pinnedOpen) setHoverOpen(false);
    }, 180);
  }, [clearCloseTimer, pinnedOpen]);

  const openFromHover = useCallback(() => {
    clearCloseTimer();
    setHoverOpen(true);
  }, [clearCloseTimer]);

  const togglePinned = useCallback(() => {
    setPinnedOpen((current) => {
      const next = !current;
      if (next) setHoverOpen(true);
      return next;
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setPinnedOpen(false);
    setHoverOpen(false);
  }, []);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (view !== "list") cancelForm();
        else closeSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSidebar, cancelForm, isOpen, view]);

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
      {/* Trigger */}
      <button
        type="button"
        aria-label={isOpen ? "Hide MCP Marketplace" : "Show MCP Marketplace"}
        aria-expanded={isOpen}
        onClick={togglePinned}
        onMouseEnter={openFromHover}
        onMouseLeave={scheduleClose}
        className={[
          "mcp-marketplace-trigger fixed top-[calc(50%-3.5rem)] z-120 flex -translate-y-1/2 items-center justify-center",
          "bg-surface-container-highest text-primary shadow-bloom ghost-border",
          "size-12 transition-[right,transform,background-color] duration-300 ease-out hover:bg-primary hover:text-on-primary",
          isOpen ? "right-[min(100vw-3rem,22rem)]" : "right-0",
        ].join(" ")}
      >
        <LuPackageSearch className="size-5" aria-hidden />
      </button>

      {/* Backdrop */}
      <div
        className={[
          "mcp-marketplace-backdrop fixed inset-0 z-110 bg-on-surface/20 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={closeSidebar}
        aria-hidden={!isOpen}
      />

      {/* Panel */}
      <aside
        onMouseEnter={openFromHover}
        onMouseLeave={scheduleClose}
        aria-hidden={!isOpen}
        className={[
          "mcp-marketplace-panel fixed top-0 right-0 z-115 flex h-full w-[min(100vw-3rem,22rem)] flex-col",
          "bg-surface-container-lowest shadow-bloom ghost-border",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
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
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-3 px-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-muted">
                  Available Servers
                </p>
              </div>

              {filteredServers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface-muted">
                    <LuPackageSearch className="size-5" aria-hidden />
                  </span>
                  <p className="text-sm font-medium text-on-surface">No servers found</p>
                  <p className="mt-1 text-xs text-on-surface-muted">
                    Try a different search or category.
                  </p>
                  <Button
                    onClick={startCreate}
                    variant="secondary"
                    className="mt-4 gap-2 px-4 py-2 text-sm"
                  >
                    <LuPlus className="size-4" aria-hidden />
                    Add server
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3.5">
                  {filteredServers.map((server) => (
                    <McpServerCard
                      key={server.id}
                      server={server}
                      isPendingDelete={deletingServerId === server.id}
                      onToggle={() => toggleServer(server.id)}
                      onEdit={() => startEdit(server)}
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
          />
        ) : null}
      </aside>
    </>
  );
}

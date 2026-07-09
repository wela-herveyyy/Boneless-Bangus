"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuPackageSearch, LuPower, LuSearch, LuX } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  getCategoryLabel,
  MCP_CATEGORIES,
  useMcpMarketplace,
} from "./mcpMarketplace.hooks";

export function McpMarketplace() {
  const {
    filteredServers,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    enabledCount,
    toggleServer,
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
      if (event.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeSidebar, isOpen]);

  return (
    <>
      {/* Trigger — positioned just above the ThemeSidebar trigger (top-1/2) */}
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
        {enabledCount > 0 ? (
          <span className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-on-secondary shadow-bloom">
            {enabledCount}
          </span>
        ) : null}
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
              Model Context Protocol
            </p>
            <h2 className="font-display text-lg font-semibold text-primary">MCP Marketplace</h2>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="flex size-9 items-center justify-center bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label="Close MCP Marketplace"
          >
            <LuX className="size-5" />
          </button>
        </header>

        {/* Search */}
        <div className="border-b border-primary/10 px-4 py-3">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted pointer-events-none" aria-hidden />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search servers…"
              className="pl-9"
              aria-label="Search MCP servers"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-primary/10 px-4 py-3">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={[
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === "all"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high",
            ].join(" ")}
          >
            All
          </button>
          {MCP_CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setActiveCategory(category.value)}
              className={[
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeCategory === category.value
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high",
              ].join(" ")}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Server list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface-muted">
                <LuPackageSearch className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-on-surface">No servers found</p>
              <p className="mt-1 text-xs text-on-surface-muted">
                Try a different search or category.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredServers.map((server) => (
                <li
                  key={server.id}
                  className="rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-on-surface">{server.name}</p>
                        <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-medium text-on-surface-muted">
                          {getCategoryLabel(server.category)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">
                        {server.description}
                      </p>
                      <p className="mt-2 text-[10px] text-on-surface-muted">by {server.author}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleServer(server.id)}
                      aria-label={
                        server.enabled ? `Disable ${server.name}` : `Enable ${server.name}`
                      }
                      aria-pressed={server.enabled}
                      className={[
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                        server.enabled
                          ? "bg-tertiary/15 text-tertiary shadow-[0_0_24px_color-mix(in_srgb,var(--tertiary)_20%,transparent)]"
                          : "bg-surface-container-high text-on-surface-muted hover:bg-surface-container-highest hover:text-on-surface",
                      ].join(" ")}
                    >
                      <LuPower className="size-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — only visible when servers are enabled */}
        {enabledCount > 0 ? (
          <div className="border-t border-primary/10 px-5 py-4">
            <Button variant="primary" className="w-full gap-2 px-4 py-2 text-sm">
              <LuPower className="size-4" aria-hidden />
              {enabledCount} server{enabledCount !== 1 ? "s" : ""} enabled
            </Button>
          </div>
        ) : null}
      </aside>
    </>
  );
}

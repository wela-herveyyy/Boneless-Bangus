"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LuLayers2, LuSchool, LuX } from "react-icons/lu";
import { SiGithub, SiGoogle } from "react-icons/si";
import { RightToolsDockProvider } from "./rightToolsDock.context";

export type RightDockTool = {
  id: string;
  label: string;
  hint: string;
  icon: ReactNode;
};

/** Session / integration tools only — Theme, Skills, Settings live in Profile. */
export function buildRightDockTools(opts: {
  showGoogle: boolean;
  showGithub: boolean;
  showSchool: boolean;
  showLivro: boolean;
}): RightDockTool[] {
  const tools: RightDockTool[] = [];
  if (opts.showGoogle) {
    tools.push({
      id: "google_workspace",
      label: "Google",
      hint: "Gmail, Calendar, Meet",
      icon: <SiGoogle className="size-4" aria-hidden />,
    });
  }
  if (opts.showSchool) {
    tools.push({
      id: "school-erp",
      label: "School",
      hint: "School ERP session",
      icon: <LuSchool className="size-4" aria-hidden />,
    });
  }
  if (opts.showLivro) {
    tools.push({
      id: "tools",
      label: "Livro",
      hint: "Livro ERPNext",
      icon: <span className="text-[11px] font-bold leading-none">E</span>,
    });
  }
  if (opts.showGithub) {
    tools.push({
      id: "github_mcp",
      label: "GitHub",
      hint: "Repos & MCP",
      icon: <SiGithub className="size-4" aria-hidden />,
    });
  }
  return tools;
}

export function openRightTool(id: string) {
  window.dispatchEvent(
    new CustomEvent("bbai:open-right-sidebar", { detail: { sourceId: id } }),
  );
}

export function toggleRightTool(id: string) {
  window.dispatchEvent(
    new CustomEvent("bbai:toggle-right-sidebar", { detail: { sourceId: id } }),
  );
}

export function DockToolButtons({
  tools,
  activeId,
  onPick,
  compact = false,
}: {
  tools: RightDockTool[];
  activeId: string | null;
  onPick: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <>
      {tools.map((tool) => {
        const active = tool.id === activeId;
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onPick(tool.id)}
            title={`${tool.label} — ${tool.hint}`}
            aria-label={tool.label}
            aria-pressed={active}
            className={[
              "group flex flex-col items-center gap-0.5 rounded-xl transition-colors",
              compact ? "w-9 px-0.5 py-1.5" : "w-11 px-1 py-2",
              active
                ? "bg-primary text-on-primary"
                : "text-primary hover:bg-surface-container-high",
            ].join(" ")}
          >
            <span className="flex size-5 items-center justify-center">{tool.icon}</span>
            {!compact ? (
              <span
                className={[
                  "max-w-full truncate text-[9px] font-semibold leading-tight",
                  active ? "text-on-primary" : "text-on-surface-muted group-hover:text-on-surface",
                ].join(" ")}
              >
                {tool.label}
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}

/**
 * Tools dock + context for in-panel switcher.
 * Stays parked beside an open drawer so users can switch without closing.
 */
export function RightToolsDock({
  tools,
  children,
}: {
  tools: RightDockTool[];
  children?: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("bbai-unified-tools-dock");
    return () => document.body.classList.remove("bbai-unified-tools-dock");
  }, []);

  useEffect(() => {
    const onState = (event: Event) => {
      const detail = (event as CustomEvent<{ source: string; isOpen: boolean }>).detail;
      if (!detail?.source) return;
      if (detail.isOpen) {
        setActiveId(detail.source);
        setPanelOpen(true);
        setMenuOpen(false);
        return;
      }
      setActiveId((prev) => {
        if (prev !== detail.source) return prev;
        setPanelOpen(false);
        return null;
      });
    };
    window.addEventListener("bbai:right-sidebar-state", onState);
    return () => window.removeEventListener("bbai:right-sidebar-state", onState);
  }, []);

  const pick = (id: string) => {
    if (id === activeId) toggleRightTool(id);
    else openRightTool(id);
    setMenuOpen(false);
  };

  const ctx = useMemo(
    () => ({
      tools,
      activeId,
      openTool: openRightTool,
      toggleTool: toggleRightTool,
    }),
    [tools, activeId],
  );

  const shell =
    "rounded-2xl bg-surface-container-lowest p-1.5 shadow-bloom ghost-border";

  return (
    <RightToolsDockProvider value={ctx}>
      {/*
        One overlay root: panels + dock. Dock uses z-320; body CSS parks it left of the drawer
        when *.bbai-*-sidebar-open is set (avoids React panelOpen getting stuck).
      */}
      <div className="pointer-events-none fixed inset-0 z-300">
        {children}
        {tools.length > 0 && !panelOpen ? (
          <>
            {/* Closed only — when a drawer is open, use the in-panel header switcher */}
            <div
              className={[
                "right-tools-dock pointer-events-auto fixed top-1/2 right-3 z-320 hidden -translate-y-1/2 flex-col gap-1 md:flex",
                shell,
              ].join(" ")}
            >
              <DockToolButtons tools={tools} activeId={activeId} onPick={pick} />
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open tools"
              className="right-tools-fab pointer-events-auto fixed bottom-5 right-4 z-250 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-bloom md:hidden"
            >
              <LuLayers2 className="size-4" aria-hidden />
              Tools
            </button>
          </>
        ) : null}
      </div>

      {tools.length > 0 && menuOpen && !panelOpen ? (
        <div className="fixed inset-0 z-260 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/25 backdrop-blur-[2px]"
            aria-label="Dismiss tools menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[1.75rem] bg-surface-container-lowest px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-bloom">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-on-surface-muted/25" />
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  Tools
                </p>
                <p className="text-sm text-on-surface-muted">Pick a panel to open</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted"
                aria-label="Close"
              >
                <LuX className="size-4" />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2 pb-2">
              {tools.map((tool) => (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() => pick(tool.id)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-surface-container-low px-3 py-3 text-left transition-colors active:bg-surface-container-high"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest text-primary">
                      {tool.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-on-surface">
                        {tool.label}
                      </span>
                      <span className="block truncate text-[11px] text-on-surface-muted">
                        {tool.hint}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </RightToolsDockProvider>
  );
}

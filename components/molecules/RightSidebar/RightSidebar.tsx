"use client";

import React, { type ReactNode } from "react";
import type { UseRightSidebarReturn } from "./rightSidebar.hooks";
import { useRightToolsDock } from "@/components/organisms/RightSidebars/rightToolsDock.context";
import {
  openRightTool,
  toggleRightTool,
} from "@/components/organisms/RightSidebars/RightToolsDock";

export {
  useRightSidebar,
  type UseRightSidebarReturn,
  type UseRightSidebarOptions,
} from "./rightSidebar.hooks";

export interface RightSidebarTriggerProps {
  sidebar: UseRightSidebarReturn;
  icon: ReactNode;
  labelOpen: string;
  labelClosed: string;
  /** CSS `top` value, e.g. `"50%"` or `"calc(50% - 7rem)"`. Defaults to `"50%"`. */
  topOffset?: string;
  className?: string;
}

/**
 * Standardized right-sidebar trigger button that shifts left whenever any right sidebar is popped up,
 * maintaining clean vertical alignment and spring transitions without animating horizontally during instant sidebar switching.
 */
export function RightSidebarTrigger({
  sidebar,
  icon,
  labelOpen,
  labelClosed,
  topOffset = "50%",
  className = "",
}: RightSidebarTriggerProps) {
  const { isOpen, isSwitching, isAnyRightSidebarOpen, togglePinned } = sidebar;
  const centerVertically = topOffset === "50%" || topOffset.trim() === "50%";

  return (
    <button
      type="button"
      aria-label={isOpen ? labelOpen : labelClosed}
      aria-expanded={isOpen}
      onClick={togglePinned}
      style={{ top: topOffset }}
      className={[
        "right-sidebar-trigger pointer-events-auto fixed z-320 flex size-10 shrink-0 items-center justify-center md:size-12",
        "bg-surface-container-highest text-primary shadow-bloom ghost-border hover:bg-primary hover:text-on-primary",
        centerVertically ? "-translate-y-1/2" : "",
        isSwitching
          ? "transition-none duration-0"
          : "transition-[right,background-color,color] duration-380 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isAnyRightSidebarOpen ? "right-88" : "right-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon}
    </button>
  );
}

export interface RightSidebarBackdropProps {
  sidebar: UseRightSidebarReturn;
  className?: string;
}

/**
 * Dims chat under an open drawer. Tool switching uses the in-panel header switcher.
 */
export function RightSidebarBackdrop({ sidebar, className = "" }: RightSidebarBackdropProps) {
  const { isOpen, closeSidebar } = sidebar;

  return (
    <div
      className={[
        "fixed inset-0 z-300 bg-on-surface/25 backdrop-blur-[2px] transition-opacity duration-300 md:right-88",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={closeSidebar}
      inert={!isOpen ? true : undefined}
    />
  );
}

export interface RightSidebarPanelProps {
  sidebar: UseRightSidebarReturn;
  children: ReactNode;
  className?: string;
}

/**
 * Standardized right-sidebar drawer panel with dynamic z-index layering and switching transitions.
 * When switching directly between open sidebars (isSwitching=true), horizontal sliding animations are suppressed
 * for instant clean swaps without pull-out or overlap glitches.
 */
export function RightSidebarPanel({
  sidebar,
  children,
  className = "",
}: RightSidebarPanelProps) {
  const { isOpen, isSwitching } = sidebar;

  return (
    <aside
      inert={!isOpen ? true : undefined}
      className={[
        // Full-bleed on phone; 22rem on md+
        "right-sidebar-panel pointer-events-auto fixed top-0 right-0 flex h-full w-full flex-col md:w-88",
        "bg-surface-container-lowest shadow-bloom ghost-border",
        isSwitching
          ? "transition-none duration-0"
          : "transition-[transform,translate] duration-380 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isOpen ? "z-310 translate-x-0" : "z-305 translate-x-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </aside>
  );
}

export interface RightSidebarHeaderProps {
  sidebar: UseRightSidebarReturn;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
}

/**
 * Standardized right-sidebar header with title, optional subtitle/actions, and a uniform close button.
 */
export function RightSidebarHeader({
  sidebar,
  title,
  subtitle,
  actions,
  onClose,
  closeLabel = "Close sidebar",
  className = "",
}: RightSidebarHeaderProps) {
  const { closeSidebar, id } = sidebar;
  const handleClose = onClose ?? closeSidebar;
  const dock = useRightToolsDock();

  const pick = (toolId: string) => {
    if (toolId === id) toggleRightTool(toolId);
    else openRightTool(toolId);
  };

  return (
    <header
      className={[
        "flex flex-col gap-3 bg-surface-container-low p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {subtitle ? (
            <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted">
              {subtitle}
            </p>
          ) : null}
          <h2 className="font-display text-lg font-semibold text-primary">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={handleClose}
            className="flex size-9 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
            aria-label={closeLabel}
          >
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Switch Google / School / Livro without closing the drawer */}
      {dock && dock.tools.length > 1 ? (
        <div
          className="flex w-full gap-1 rounded-xl bg-surface-container-lowest p-1"
          role="toolbar"
          aria-label="Switch tool"
        >
          {dock.tools.map((tool) => {
            const active = tool.id === (dock.activeId || id);
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => pick(tool.id)}
                title={tool.hint}
                aria-pressed={active}
                className={[
                  "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-muted hover:bg-surface-container-high hover:text-on-surface",
                ].join(" ")}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">{tool.icon}</span>
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}

export interface RightSidebarContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Standardized scrollable right-sidebar body container with consistent padding and scrollbar styling.
 */
export function RightSidebarContent({
  children,
  className = "",
}: RightSidebarContentProps) {
  return (
    <div
      className={[
        "bbai-scroll min-h-0 flex flex-1 flex-col gap-5 overflow-y-auto p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

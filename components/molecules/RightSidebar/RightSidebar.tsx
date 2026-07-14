"use client";

import React, { type ReactNode } from "react";
import type { UseRightSidebarReturn } from "./rightSidebar.hooks";

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
  /**
   * Tailwind top position class. Defaults to "top-1/2".
   */
  topClass?: string;
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
  topClass = "top-1/2",
  className = "",
}: RightSidebarTriggerProps) {
  const { isOpen, isSwitching, isAnyRightSidebarOpen, togglePinned, openFromHover, scheduleClose } = sidebar;

  return (
    <button
      type="button"
      aria-label={isOpen ? labelOpen : labelClosed}
      aria-expanded={isOpen}
      onClick={togglePinned}
      onMouseEnter={openFromHover}
      onMouseLeave={scheduleClose}
      className={[
        "right-sidebar-trigger fixed z-[120] flex -translate-y-1/2 items-center justify-center",
        "bg-surface-container-highest text-primary shadow-bloom ghost-border size-12 hover:bg-primary hover:text-on-primary",
        topClass,
        isSwitching
          ? "transition-none duration-0"
          : "transition-[right,background-color,color] duration-380 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isAnyRightSidebarOpen ? "right-[min(100vw-3rem,22rem)]" : "right-0",
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
 * Standardized right-sidebar backdrop with fade-in/out transition.
 */
export function RightSidebarBackdrop({ sidebar, className = "" }: RightSidebarBackdropProps) {
  const { isOpen, closeSidebar } = sidebar;

  return (
    <div
      className={[
        "fixed inset-0 z-[110] bg-on-surface/20 backdrop-blur-[2px] transition-opacity duration-300",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={closeSidebar}
      aria-hidden={!isOpen}
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
  const { isOpen, isSwitching, openFromHover, scheduleClose } = sidebar;

  return (
    <aside
      onMouseEnter={openFromHover}
      onMouseLeave={scheduleClose}
      aria-hidden={!isOpen}
      className={[
        "right-sidebar-panel fixed top-0 right-0 flex h-full w-[min(100vw-3rem,22rem)] flex-col",
        "bg-surface-container-lowest shadow-bloom ghost-border",
        isSwitching
          ? "transition-none duration-0"
          : "transition-[transform,translate] duration-380 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isOpen ? "z-[118] translate-x-0" : "z-[115] translate-x-full",
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
  const { closeSidebar } = sidebar;
  const handleClose = onClose ?? closeSidebar;

  return (
    <header
      className={[
        "flex items-start justify-between gap-3 bg-surface-container-low p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        {subtitle ? (
          <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted">
            {subtitle}
          </p>
        ) : null}
        <h2 className="font-display text-lg font-semibold text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          onClick={handleClose}
          className="flex size-9 items-center justify-center bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
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

"use client";

import React, { type ReactNode } from "react";
import type { UseRightSidebarReturn } from "./rightSidebar.hooks";

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
 * Standardized right-sidebar trigger button that shifts left when any right sidebar opens,
 * maintaining clean vertical alignment and spring transition curve without hover pop-outs.
 */
export function RightSidebarTrigger({
  sidebar,
  icon,
  labelOpen,
  labelClosed,
  topClass = "top-1/2",
  className = "",
}: RightSidebarTriggerProps) {
  const { isOpen, isAnyRightSidebarOpen, togglePinned, openFromHover, scheduleClose } = sidebar;

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
 * Standardized right-sidebar drawer panel with dynamic z-index layering (z-[116] when open vs z-[115] when closed)
 * and spring transitions so sidebars cleanly cross over top of one another when switching.
 */
export function RightSidebarPanel({
  sidebar,
  children,
  className = "",
}: RightSidebarPanelProps) {
  const { isOpen, openFromHover, scheduleClose } = sidebar;

  return (
    <aside
      onMouseEnter={openFromHover}
      onMouseLeave={scheduleClose}
      aria-hidden={!isOpen}
      className={[
        "right-sidebar-panel fixed top-0 right-0 flex h-full w-[min(100vw-3rem,22rem)] flex-col",
        "bg-surface-container-lowest shadow-bloom ghost-border",
        "transition-all duration-380 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isOpen ? "z-[116] translate-x-0" : "z-[115] translate-x-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </aside>
  );
}

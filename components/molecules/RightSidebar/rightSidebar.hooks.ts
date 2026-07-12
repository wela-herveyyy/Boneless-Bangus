"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseRightSidebarOptions {
  /**
   * Optional CSS class to toggle on document.body while the sidebar is open.
   */
  bodyClass?: string;
  /**
   * Optional callback fired when the sidebar closes.
   */
  onClose?: () => void;
  /**
   * Optional callback fired when the Escape key is pressed.
   * Return `true` if the event was handled specifically (e.g. closing a sub-modal or sub-form)
   * and the sidebar itself should stay open.
   */
  onEscape?: () => boolean | void;
  /**
   * Hover close delay in milliseconds. Defaults to 180ms.
   */
  closeDelayMs?: number;
}

export interface UseRightSidebarReturn {
  id: string;
  isOpen: boolean;
  pinnedOpen: boolean;
  hoverOpen: boolean;
  isOtherRightSidebarOpen: boolean;
  isAnyRightSidebarOpen: boolean;
  openFromHover: () => void;
  scheduleClose: () => void;
  clearCloseTimer: () => void;
  togglePinned: () => void;
  closeSidebar: () => void;
}

/**
 * Reusable DRY hook for right-sidebar behavior, coordinating state synchronization,
 * hover opening with scheduled close timers, pinning, Escape key handling, and
 * cross-sidebar bbai event broadcasting.
 */
export function useRightSidebar(
  id: string,
  options?: UseRightSidebarOptions
): UseRightSidebarReturn {
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const [isOtherRightSidebarOpen, setIsOtherRightSidebarOpen] = useState(false);

  const isOpen = hoverOpen || pinnedOpen;
  const isAnyRightSidebarOpen = isOpen || isOtherRightSidebarOpen;
  const closeDelayMs = options?.closeDelayMs ?? 180;

  const clearCloseTimer = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const closeSidebar = useCallback(() => {
    clearCloseTimer();
    setPinnedOpen(false);
    setHoverOpen(false);
    options?.onClose?.();
  }, [clearCloseTimer, options]);

  const togglePinned = useCallback(() => {
    setPinnedOpen((prev) => {
      const next = !prev;
      if (!next) {
        setHoverOpen(false);
      }
      return next;
    });
  }, []);

  const openFromHover = useCallback(() => {
    clearCloseTimer();
    setHoverOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimeoutRef.current = window.setTimeout(() => {
      if (!pinnedOpen) {
        setHoverOpen(false);
      }
    }, closeDelayMs);
  }, [clearCloseTimer, pinnedOpen, closeDelayMs]);

  // Synchronize close and state changes across other right sidebars via CustomEvent
  useEffect(() => {
    const handleCloseOthers = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail !== id && isOpen) {
        closeSidebar();
      }
    };

    const handleStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ source: string; isOpen: boolean }>;
      if (customEvent.detail && customEvent.detail.source !== id) {
        setIsOtherRightSidebarOpen(customEvent.detail.isOpen);
      }
    };

    window.addEventListener("bbai:close-right-sidebar", handleCloseOthers);
    window.addEventListener("bbai:right-sidebar-state", handleStateChange);
    return () => {
      window.removeEventListener("bbai:close-right-sidebar", handleCloseOthers);
      window.removeEventListener("bbai:right-sidebar-state", handleStateChange);
    };
  }, [id, isOpen, closeSidebar]);

  // Broadcast state changes and toggle optional body class
  useEffect(() => {
    if (options?.bodyClass) {
      document.body.classList.toggle(options.bodyClass, isOpen);
    }
    if (isOpen) {
      window.dispatchEvent(new CustomEvent("bbai:close-right-sidebar", { detail: id }));
    }
    window.dispatchEvent(
      new CustomEvent("bbai:right-sidebar-state", {
        detail: { source: id, isOpen },
      })
    );
    return () => {
      if (options?.bodyClass) {
        document.body.classList.remove(options.bodyClass);
      }
    };
  }, [id, isOpen, options?.bodyClass]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const handled = options?.onEscape?.();
        if (handled !== true) {
          closeSidebar();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeSidebar, options]);

  return {
    id,
    isOpen,
    pinnedOpen,
    hoverOpen,
    isOtherRightSidebarOpen,
    isAnyRightSidebarOpen,
    openFromHover,
    scheduleClose,
    clearCloseTimer,
    togglePinned,
    closeSidebar,
  };
}

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
  isSwitching: boolean;
  isOtherRightSidebarOpen: boolean;
  isAnyRightSidebarOpen: boolean;
  openFromHover: () => void;
  scheduleClose: () => void;
  clearCloseTimer: () => void;
  togglePinned: () => void;
  closeSidebar: () => void;
}

const globalOpenSidebars: Record<string, boolean> = {};

/**
 * Reusable DRY hook for right-sidebar behavior, coordinating state synchronization,
 * hover opening with scheduled close timers, pinning, Escape key handling, and
 * cross-sidebar bbai event broadcasting with instant switching transitions when crossing sidebars.
 */
export function useRightSidebar(
  id: string,
  options?: UseRightSidebarOptions
): UseRightSidebarReturn {
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const [otherOpenSidebars, setOtherOpenSidebars] = useState<Record<string, boolean>>(() => ({
    ...globalOpenSidebars,
  }));

  const isOpen = hoverOpen || pinnedOpen;
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const isOtherRightSidebarOpen = Object.entries(otherOpenSidebars).some(
    ([sourceId, open]) => sourceId !== id && Boolean(open)
  );
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
    globalOpenSidebars[id] = false;
    window.dispatchEvent(
      new CustomEvent("bbai:right-sidebar-state", {
        detail: { source: id, isOpen: false },
      })
    );
    options?.onClose?.();
  }, [clearCloseTimer, id, options]);

  const togglePinned = useCallback(() => {
    const nextPinned = !pinnedOpen;
    if (nextPinned) {
      const switching = isOtherRightSidebarOpen;
      if (switching) {
        setIsSwitching(true);
      }
      window.dispatchEvent(
        new CustomEvent("bbai:close-right-sidebar", {
          detail: { sourceId: id, isSwitching: switching },
        })
      );
      setPinnedOpen(true);
      globalOpenSidebars[id] = true;
      window.dispatchEvent(
        new CustomEvent("bbai:right-sidebar-state", {
          detail: { source: id, isOpen: true },
        })
      );
    } else {
      setPinnedOpen(false);
      setHoverOpen(false);
      globalOpenSidebars[id] = false;
      window.dispatchEvent(
        new CustomEvent("bbai:right-sidebar-state", {
          detail: { source: id, isOpen: false },
        })
      );
    }
  }, [id, pinnedOpen, isOtherRightSidebarOpen]);

  const openFromHover = useCallback(() => {
    clearCloseTimer();
    if (!isOpen) {
      const switching = isOtherRightSidebarOpen;
      if (switching) {
        setIsSwitching(true);
      }
      window.dispatchEvent(
        new CustomEvent("bbai:close-right-sidebar", {
          detail: { sourceId: id, isSwitching: switching },
        })
      );
      globalOpenSidebars[id] = true;
      window.dispatchEvent(
        new CustomEvent("bbai:right-sidebar-state", {
          detail: { source: id, isOpen: true },
        })
      );
    }
    setHoverOpen(true);
  }, [clearCloseTimer, id, isOpen, isOtherRightSidebarOpen]);

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
      const customEvent = event as CustomEvent<{ sourceId: string; isSwitching?: boolean } | string>;
      const detail = customEvent.detail;
      const targetId = typeof detail === "string" ? detail : detail?.sourceId;
      const switching = typeof detail === "object" ? Boolean(detail?.isSwitching) : false;

      if (targetId && targetId !== id && isOpenRef.current) {
        if (switching) {
          setIsSwitching(true);
        }
        closeSidebar();
      }
    };

    const handleStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ source: string; isOpen: boolean }>;
      if (customEvent.detail && customEvent.detail.source !== id) {
        globalOpenSidebars[customEvent.detail.source] = customEvent.detail.isOpen;
        setOtherOpenSidebars({ ...globalOpenSidebars });
      }
    };

    window.addEventListener("bbai:close-right-sidebar", handleCloseOthers);
    window.addEventListener("bbai:right-sidebar-state", handleStateChange);
    return () => {
      window.removeEventListener("bbai:close-right-sidebar", handleCloseOthers);
      window.removeEventListener("bbai:right-sidebar-state", handleStateChange);
    };
  }, [id, closeSidebar]);

  // Reset switching flag after transition frame completes
  useEffect(() => {
    if (isSwitching) {
      const timer = window.setTimeout(() => {
        setIsSwitching(false);
      }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [isSwitching]);

  // Toggle optional body class
  useEffect(() => {
    if (options?.bodyClass) {
      document.body.classList.toggle(options.bodyClass, isOpen);
      return () => {
        document.body.classList.remove(options.bodyClass!);
      };
    }
  }, [isOpen, options?.bodyClass]);

  // Broadcast state changes across all right sidebars without re-running when other sidebars change
  useEffect(() => {
    globalOpenSidebars[id] = isOpen;
    window.dispatchEvent(
      new CustomEvent("bbai:right-sidebar-state", {
        detail: { source: id, isOpen },
      })
    );
  }, [id, isOpen]);

  // Broadcast closed state only upon actual component unmounting
  useEffect(() => {
    return () => {
      globalOpenSidebars[id] = false;
      window.dispatchEvent(
        new CustomEvent("bbai:right-sidebar-state", {
          detail: { source: id, isOpen: false },
        })
      );
    };
  }, [id]);

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
    isSwitching,
    isOtherRightSidebarOpen,
    isAnyRightSidebarOpen,
    openFromHover,
    scheduleClose,
    clearCloseTimer,
    togglePinned,
    closeSidebar,
  };
}

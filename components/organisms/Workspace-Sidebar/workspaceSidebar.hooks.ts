"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listConversationMessagesAction,
  listConversationsAction,
} from "@/lib/domain/actions/ai.actions";
import { listOutputCanvasesAction } from "@/lib/domain/actions/output_canvas.actions";
import { archiveChatLocallyService, isChatArchivedService } from "@/lib/domain/services/ai_storage.service";
import {
  FRAPPE_TOOL_MODE,
  type FrappeToolMode,
} from "@/lib/entities/frappe_output.type";
import type { OutputCanvasItem } from "@/lib/entities/output_canvas.type";

export type ChatHistoryItem = {
  id: string;
  title: string;
  updatedAt: string;
};

const FRAPPE_TOOL_KEY = "bbai_workspace_frappe_tool";

function parseFrappeTool(raw: string | null): FrappeToolMode {
  if (
    raw === FRAPPE_TOOL_MODE.WEBFORM ||
    raw === FRAPPE_TOOL_MODE.WEBPAGE ||
    raw === FRAPPE_TOOL_MODE.PRINT_FORMAT ||
    raw === FRAPPE_TOOL_MODE.DOCUMENT_EDITOR
  ) {
    return raw;
  }
  return FRAPPE_TOOL_MODE.OFF;
}

export function useWorkspaceSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [canvases, setCanvases] = useState<OutputCanvasItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [chatToArchiveId, setChatToArchiveId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileSection, setProfileSection] = useState<
    "account" | "theme" | "skills" | "tools"
  >("account");
  const [frappeTool, setFrappeToolState] = useState<FrappeToolMode>(FRAPPE_TOOL_MODE.OFF);
  /** When set, WorkspaceChat restores this canvas after the thread loads. */
  const [pendingCanvas, setPendingCanvas] = useState<OutputCanvasItem | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"chats" | "canvases">("chats");

  useEffect(() => {
    try {
      setFrappeToolState(parseFrappeTool(sessionStorage.getItem(FRAPPE_TOOL_KEY)));
    } catch {
      /* ignore */
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    const result = await listConversationsAction();
    if (result.ok) {
      const activeChats = result.data.filter((chat) => !isChatArchivedService(chat.id));

      setChatHistory(
        activeChats.map((item) => ({
          id: item.id,
          title: item.title,
          updatedAt: item.updatedAt,
        })),
      );
    }
    setLoadingHistory(false);
  }, []);

  const refreshCanvases = useCallback(async () => {
    const result = await listOutputCanvasesAction();
    if (result.ok) setCanvases(result.data);
  }, []);

  useEffect(() => {
    void refreshHistory();
    void refreshCanvases();
  }, [refreshHistory, refreshCanvases]);

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        window.dispatchEvent(
          new CustomEvent("bbai:close-right-sidebar", {
            detail: { sourceId: "left-sidebar" },
          }),
        );
      }
    }
    document.body.classList.toggle("left-sidebar-open", isOpen);
    return () => document.body.classList.remove("left-sidebar-open");
  }, [isOpen]);

  const setActiveChatId = useCallback((id: string | null) => {
    setActiveChatIdState(id);
  }, []);

  const startNewChat = useCallback(() => {
    setPendingCanvas(null);
    setActiveChatIdState(null);
  }, []);

  const promptArchive = useCallback((id: string) => {
    setChatToArchiveId(id);
  }, []);

  const cancelArchive = useCallback(() => {
    setChatToArchiveId(null);
  }, []);

  const confirmArchive = useCallback(() => {
    if (chatToArchiveId) {
      archiveChatLocallyService(chatToArchiveId);

      setChatHistory((prev) => prev.filter((chat) => chat.id !== chatToArchiveId));
      setCanvases((prev) => prev.filter((c) => c.conversationId !== chatToArchiveId));
      setActiveChatIdState((prev) => (prev === chatToArchiveId ? null : prev));
      setChatToArchiveId(null);
    }
  }, [chatToArchiveId]);

  const openProfile = useCallback(
    (section: "account" | "theme" | "skills" | "tools" = "account") => {
      const next =
        section === "account" ||
        section === "theme" ||
        section === "skills" ||
        section === "tools"
          ? section
          : "account";
      setProfileSection(next);
      setIsProfileOpen(true);
    },
    [],
  );
  const closeProfile = useCallback(() => {
    setIsProfileOpen(false);
    setProfileSection("account");
  }, []);

  useEffect(() => {
    const openTools = () => openProfile("tools");
    window.addEventListener("bbai:open-settings", openTools);
    window.addEventListener("bbai:open-settings-integrations", openTools);
    return () => {
      window.removeEventListener("bbai:open-settings", openTools);
      window.removeEventListener("bbai:open-settings-integrations", openTools);
    };
  }, [openProfile]);

  const setFrappeTool = useCallback((mode: FrappeToolMode) => {
    setFrappeToolState(mode);
    try {
      sessionStorage.setItem(FRAPPE_TOOL_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  /** Open a saved canvas: one convo ↔ one canvas. */
  const openCanvas = useCallback(
    (canvas: OutputCanvasItem) => {
      setFrappeTool(canvas.toolMode);
      setPendingCanvas(canvas);
      setActiveChatIdState(canvas.conversationId);
      setSidebarTab("canvases");
    },
    [setFrappeTool],
  );

  const clearPendingCanvas = useCallback(() => setPendingCanvas(null), []);

  return {
    isOpen,
    openSidebar: () => setIsOpen(true),
    closeSidebar: () => setIsOpen(false),
    toggleSidebar: () => setIsOpen((open) => !open),
    chatHistory,
    canvases,
    loadingHistory,
    activeChatId,
    setActiveChatId,
    startNewChat,
    refreshHistory,
    refreshCanvases,
    loadMessages: listConversationMessagesAction,
    chatToArchiveId,
    promptArchive,
    cancelArchive,
    confirmArchive,
    isProfileOpen,
    profileSection,
    openProfile,
    closeProfile,
    frappeTool,
    setFrappeTool,
    outputOpen: frappeTool !== FRAPPE_TOOL_MODE.OFF,
    pendingCanvas,
    openCanvas,
    clearPendingCanvas,
    sidebarTab,
    setSidebarTab,
  };
}

export function formatChatDate(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listConversationMessagesAction,
  listConversationsAction,
} from "@/lib/domain/actions/ai.actions";

export type ChatHistoryItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export function useWorkspaceSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [chatToArchiveId, setChatToArchiveId] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    const result = await listConversationsAction();
    if (result.ok) {
      let archivedIds: string[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("bbai_archived_chats");
          if (stored) archivedIds = JSON.parse(stored);
        } catch (e) {}
      }

      const activeChats = result.data.filter((chat) => !archivedIds.includes(chat.id));

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

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const setActiveChatId = useCallback((id: string | null) => {
    setActiveChatIdState(id);
  }, []);

  const startNewChat = useCallback(() => {
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
      if (typeof window !== "undefined") {
        let archivedIds: string[] = [];
        try {
          const stored = localStorage.getItem("bbai_archived_chats");
          if (stored) archivedIds = JSON.parse(stored);
        } catch (e) {}

        if (!archivedIds.includes(chatToArchiveId)) {
          archivedIds.push(chatToArchiveId);
          localStorage.setItem("bbai_archived_chats", JSON.stringify(archivedIds));
        }
      }

      setChatHistory((prev) => prev.filter((chat) => chat.id !== chatToArchiveId));
      if (activeChatId === chatToArchiveId) {
        setActiveChatIdState(null);
      }
      setChatToArchiveId(null);
    }
  }, [chatToArchiveId, activeChatId]);

  return {
    isOpen,
    openSidebar: () => setIsOpen(true),
    closeSidebar: () => setIsOpen(false),
    toggleSidebar: () => setIsOpen((open) => !open),
    chatHistory,
    loadingHistory,
    activeChatId,
    setActiveChatId,
    startNewChat,
    refreshHistory,
    loadMessages: listConversationMessagesAction,
    chatToArchiveId,
    promptArchive,
    cancelArchive,
    confirmArchive,
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

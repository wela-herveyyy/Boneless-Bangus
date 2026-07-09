"use client";

import { useState } from "react";

export type ChatHistoryItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export function useWorkspaceSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatHistory] = useState<ChatHistoryItem[]>([]);

  return {
    isOpen,
    openSidebar: () => setIsOpen(true),
    closeSidebar: () => setIsOpen(false),
    toggleSidebar: () => setIsOpen((open) => !open),
    chatHistory,
    activeChatId,
    setActiveChatId,
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

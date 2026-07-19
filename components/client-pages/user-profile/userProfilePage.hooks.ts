"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAdminUserConversationMessagesAction,
  getAdminUserConversationsAction,
} from "@/lib/domain/actions/users.actions";
import type { AiConversationListItem, AiMessageItem } from "@/lib/entities/ai.type";
import type { AdminUserDetail } from "@/lib/entities/users.type";

export function useUserProfilePage(userId: string, initialDetail: AdminUserDetail) {
  const [detail] = useState(initialDetail);
  const [conversations, setConversations] = useState<AiConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessageItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingConversations(true);
      const result = await getAdminUserConversationsAction(userId);
      if (cancelled) return;
      setLoadingConversations(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConversations(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const openConversation = useCallback(
    async (conversationId: string) => {
      setSelectedConversationId(conversationId);
      setLoadingMessages(true);
      setError(null);
      const result = await getAdminUserConversationMessagesAction(userId, conversationId, {
        limit: 40,
      });
      setLoadingMessages(false);
      if (!result.ok) {
        setError(result.error);
        setMessages([]);
        return;
      }
      setMessages(result.data.items);
    },
    [userId],
  );

  return {
    detail,
    conversations,
    selectedConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    error,
    openConversation,
  };
}

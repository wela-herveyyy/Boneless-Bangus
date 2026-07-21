"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTeamAction,
  listTeamsAction,
  updateTeamApiKeysAction,
} from "@/lib/domain/actions/team.actions";
import {
  getAdminUserConversationMessagesAction,
  getAdminUserConversationsAction,
  getAdminUserDetailAction,
  getUsersAction,
  updateUserRoleAction,
} from "@/lib/domain/actions/users.actions";
import type { AiConversationListItem, AiMessageItem } from "@/lib/entities/ai.type";
import type { TeamListItem } from "@/lib/entities/team.type";
import {
  USER_ROLE_OPTIONS,
  type AdminUserDetail,
  type UserRole,
  type UserSelect,
} from "@/lib/entities/users.type";

export type AdminTab = "users" | "teams";

export function useAdminPage(initialUsers: UserSelect[]) {
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState(initialUsers);
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamManagerId, setTeamManagerId] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [editingTeamKeysId, setEditingTeamKeysId] = useState<string | null>(null);
  const [teamCursorKey, setTeamCursorKey] = useState("");
  const [teamGeminiKey, setTeamGeminiKey] = useState("");
  const [savingTeamKeys, setSavingTeamKeys] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [conversations, setConversations] = useState<AiConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessageItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, query]);

  const refreshUsers = useCallback(async () => {
    const result = await getUsersAction();
    if (result.ok) setUsers(result.data);
    else setError(result.error);
  }, []);

  const refreshTeams = useCallback(async () => {
    setLoadingTeams(true);
    const result = await listTeamsAction();
    setLoadingTeams(false);
    if (result.ok) setTeams(result.data);
    else setError(result.error);
  }, []);

  useEffect(() => {
    void refreshTeams();
  }, [refreshTeams]);

  const changeRole = useCallback(
    async (userId: string, role: UserRole) => {
      setSavingRoleId(userId);
      setError(null);
      setNotice(null);
      const result = await updateUserRoleAction({ userId, role });
      setSavingRoleId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      if (detail?.user.id === userId) {
        setDetail({ ...detail, user: { ...detail.user, role } });
      }
      setNotice(`Updated role to ${role}.`);
    },
    [detail],
  );

  const createTeam = useCallback(async () => {
    setCreatingTeam(true);
    setError(null);
    setNotice(null);
    const result = await createTeamAction({
      name: teamName,
      description: teamDescription,
      managerId: teamManagerId || undefined,
    });
    setCreatingTeam(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTeamName("");
    setTeamDescription("");
    setTeamManagerId("");
    setNotice(`Team created. Join code: ${result.data.code}`);
    await refreshTeams();
  }, [teamName, teamDescription, teamManagerId, refreshTeams]);

  const startEditTeamKeys = useCallback((teamId: string) => {
    setEditingTeamKeysId(teamId);
    setTeamCursorKey("");
    setTeamGeminiKey("");
  }, []);

  const cancelEditTeamKeys = useCallback(() => {
    setEditingTeamKeysId(null);
    setTeamCursorKey("");
    setTeamGeminiKey("");
  }, []);

  const saveTeamKeys = useCallback(async () => {
    if (!editingTeamKeysId) return;
    if (!teamCursorKey.trim() && !teamGeminiKey.trim()) {
      setError("Enter at least one API key to update.");
      return;
    }
    setSavingTeamKeys(true);
    setError(null);
    setNotice(null);
    const formData = new FormData();
    formData.set("teamId", editingTeamKeysId);
    if (teamCursorKey.trim()) formData.set("cursorApiKey", teamCursorKey.trim());
    if (teamGeminiKey.trim()) formData.set("geminiApiKey", teamGeminiKey.trim());
    const result = await updateTeamApiKeysAction(null, formData);
    setSavingTeamKeys(false);
    if (!result?.ok) {
      setError(result?.error ?? "Failed to update team keys.");
      return;
    }
    setNotice("Team API keys updated.");
    cancelEditTeamKeys();
    await refreshTeams();
  }, [editingTeamKeysId, teamCursorKey, teamGeminiKey, cancelEditTeamKeys, refreshTeams]);

  const openUser = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setSelectedConversationId(null);
    setMessages([]);
    setLoadingDetail(true);
    setError(null);
    const [detailRes, convosRes] = await Promise.all([
      getAdminUserDetailAction(userId),
      getAdminUserConversationsAction(userId),
    ]);
    setLoadingDetail(false);
    if (!detailRes.ok) {
      setError(detailRes.error);
      setDetail(null);
      setConversations([]);
      return;
    }
    setDetail(detailRes.data);
    if (convosRes.ok) setConversations(convosRes.data);
    else {
      setConversations([]);
      setError(convosRes.error);
    }
  }, []);

  const openConversation = useCallback(
    async (conversationId: string) => {
      if (!selectedUserId) return;
      setSelectedConversationId(conversationId);
      setLoadingMessages(true);
      setError(null);
      const result = await getAdminUserConversationMessagesAction(selectedUserId, conversationId, {
        limit: 50,
      });
      setLoadingMessages(false);
      if (!result.ok) {
        setError(result.error);
        setMessages([]);
        return;
      }
      setMessages(result.data.items);
    },
    [selectedUserId],
  );

  const closeUser = useCallback(() => {
    setSelectedUserId(null);
    setDetail(null);
    setConversations([]);
    setSelectedConversationId(null);
    setMessages([]);
  }, []);

  return {
    tab,
    setTab,
    users,
    filteredUsers,
    teams,
    loadingTeams,
    error,
    notice,
    setNotice,
    query,
    setQuery,
    savingRoleId,
    roleOptions: USER_ROLE_OPTIONS,
    teamName,
    setTeamName,
    teamDescription,
    setTeamDescription,
    teamManagerId,
    setTeamManagerId,
    creatingTeam,
    editingTeamKeysId,
    teamCursorKey,
    setTeamCursorKey,
    teamGeminiKey,
    setTeamGeminiKey,
    savingTeamKeys,
    startEditTeamKeys,
    cancelEditTeamKeys,
    saveTeamKeys,
    selectedUserId,
    detail,
    conversations,
    selectedConversationId,
    messages,
    loadingDetail,
    loadingMessages,
    refreshUsers,
    refreshTeams,
    changeRole,
    createTeam,
    openUser,
    openConversation,
    closeUser,
  };
}

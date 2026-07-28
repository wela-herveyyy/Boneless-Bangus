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
import {
  createRoleAction,
  deleteRoleAction,
  getRolesAction,
  updateRoleAction,
} from "@/lib/domain/actions/roles.actions";
import type { AiConversationListItem, AiMessageItem } from "@/lib/entities/ai.type";
import type { TeamListItem } from "@/lib/entities/team.type";
import type { RoleSelect } from "@/lib/entities/roles.type";
import {
  USER_ROLE_OPTIONS,
  type AdminUserDetail,
  type UserRole,
  type UserSelect,
} from "@/lib/entities/users.type";

export type AdminTab = "users" | "teams" | "roles";

export type VerificationAction = {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "secondary" | "danger";
  titleColor?: string;
  onConfirm: () => void | Promise<void>;
} | null;

export function useAdminPage(initialUsers: UserSelect[]) {
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState(initialUsers);
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [roles, setRoles] = useState<RoleSelect[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  // Team states
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamManagerId, setTeamManagerId] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [editingTeamKeysId, setEditingTeamKeysId] = useState<string | null>(null);
  const [teamCursorKey, setTeamCursorKey] = useState("");
  const [teamGeminiKey, setTeamGeminiKey] = useState("");
  const [savingTeamKeys, setSavingTeamKeys] = useState(false);

  // Role CRUD states
  const [roleValue, setRoleValue] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [roleHint, setRoleHint] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState("");
  const [editRoleLabel, setEditRoleLabel] = useState("");
  const [editRoleHint, setEditRoleHint] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  // Verification modal state
  const [verificationAction, setVerificationAction] = useState<VerificationAction>(null);

  const executeWithVerification = useCallback(
    (config: Omit<NonNullable<VerificationAction>, "onConfirm">, action: () => void | Promise<void>) => {
      setVerificationAction({
        ...config,
        onConfirm: async () => {
          setVerificationAction(null);
          await action();
        },
      });
    },
    [],
  );

  const closeVerification = useCallback(() => {
    setVerificationAction(null);
  }, []);

  // User detail states
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

  const dynamicRoleOptions = useMemo(() => {
    if (roles.length > 0) {
      return roles.map((r) => ({ value: r.value, label: r.label }));
    }
    return USER_ROLE_OPTIONS;
  }, [roles]);

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

  const refreshRoles = useCallback(async () => {
    setLoadingRoles(true);
    const result = await getRolesAction();
    setLoadingRoles(false);
    if (result.ok) setRoles(result.data);
    else setError(result.error);
  }, []);

  useEffect(() => {
    void refreshTeams();
    void refreshRoles();
  }, [refreshTeams, refreshRoles]);

  const changeRole = useCallback(
    (userId: string, role: UserRole) => {
      executeWithVerification(
        {
          title: "Change User Role?",
          message: `Are you sure you want to change this user's assigned role to "${role}"?`,
          confirmLabel: "Change Role",
          confirmVariant: "primary",
        },
        async () => {
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
      );
    },
    [detail, executeWithVerification],
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

  // Role CRUD handlers
  const createRole = useCallback(async () => {
    if (!roleValue.trim() || !roleLabel.trim()) {
      setError("Role identifier and label are required.");
      return;
    }
    executeWithVerification(
      {
        title: "Create Role?",
        message: `Are you sure you want to create the role "${roleLabel.trim()}" (${roleValue.trim()})?`,
        confirmLabel: "Create",
        confirmVariant: "primary",
      },
      async () => {
        setCreatingRole(true);
        setError(null);
        setNotice(null);
        const result = await createRoleAction({
          value: roleValue,
          label: roleLabel,
          hint: roleHint,
          description: roleDescription,
        });
        setCreatingRole(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRoleValue("");
        setRoleLabel("");
        setRoleHint("");
        setRoleDescription("");
        setNotice(`Role "${result.data.label}" created successfully.`);
        await refreshRoles();
      },
    );
  }, [roleValue, roleLabel, roleHint, roleDescription, refreshRoles, executeWithVerification]);

  const startEditRole = useCallback((role: RoleSelect) => {
    setEditingRoleId(role.id);
    setEditRoleValue(role.value);
    setEditRoleLabel(role.label);
    setEditRoleHint(role.hint || "");
    setEditRoleDescription(role.description || "");
  }, []);

  const cancelEditRole = useCallback(() => {
    setEditingRoleId(null);
    setEditRoleValue("");
    setEditRoleLabel("");
    setEditRoleHint("");
    setEditRoleDescription("");
  }, []);

  const saveRole = useCallback(async () => {
    if (!editingRoleId) return;
    if (!editRoleValue.trim() || !editRoleLabel.trim()) {
      setError("Role identifier and label are required.");
      return;
    }
    executeWithVerification(
      {
        title: "Save Role Changes?",
        message: `Are you sure you want to save modifications to the role "${editRoleLabel.trim()}"?`,
        confirmLabel: "Save Changes",
        confirmVariant: "primary",
      },
      async () => {
        setUpdatingRole(true);
        setError(null);
        setNotice(null);
        const result = await updateRoleAction({
          id: editingRoleId,
          value: editRoleValue,
          label: editRoleLabel,
          hint: editRoleHint,
          description: editRoleDescription,
        });
        setUpdatingRole(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setNotice("Role updated successfully.");
        cancelEditRole();
        await refreshRoles();
        await refreshUsers();
      },
    );
  }, [editingRoleId, editRoleValue, editRoleLabel, editRoleHint, editRoleDescription, cancelEditRole, refreshRoles, refreshUsers, executeWithVerification]);

  const removeRole = useCallback((id: string, label: string) => {
    executeWithVerification(
      {
        title: "Delete Role?",
        message: `Are you sure you want to delete the role "${label}"? This action cannot be undone.`,
        confirmLabel: "Delete",
        confirmVariant: "danger",
        titleColor: "text-red-500",
      },
      async () => {
        setDeletingRoleId(id);
        setError(null);
        setNotice(null);
        const result = await deleteRoleAction({ id });
        setDeletingRoleId(null);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setNotice(`Role "${label}" deleted.`);
        await refreshRoles();
      },
    );
  }, [refreshRoles, executeWithVerification]);

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
    roles,
    loadingTeams,
    loadingRoles,
    error,
    notice,
    setNotice,
    query,
    setQuery,
    savingRoleId,
    roleOptions: dynamicRoleOptions,
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
    // Role CRUD exports
    roleValue,
    setRoleValue,
    roleLabel,
    setRoleLabel,
    roleHint,
    setRoleHint,
    roleDescription,
    setRoleDescription,
    creatingRole,
    editingRoleId,
    editRoleValue,
    setEditRoleValue,
    editRoleLabel,
    setEditRoleLabel,
    editRoleHint,
    setEditRoleHint,
    editRoleDescription,
    setEditRoleDescription,
    updatingRole,
    deletingRoleId,
    createRole,
    startEditRole,
    cancelEditRole,
    saveRole,
    removeRole,
    selectedUserId,
    detail,
    conversations,
    selectedConversationId,
    messages,
    loadingDetail,
    loadingMessages,
    refreshUsers,
    refreshTeams,
    refreshRoles,
    changeRole,
    createTeam,
    openUser,
    openConversation,
    closeUser,
    verificationAction,
    closeVerification,
  };
}

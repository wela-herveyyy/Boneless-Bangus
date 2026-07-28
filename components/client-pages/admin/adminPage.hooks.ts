"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createTeamAction, listTeamsAction } from "@/lib/domain/actions/team.actions";
import { getUsersAction, updateUserRoleAction } from "@/lib/domain/actions/users.actions";
import {
  createRoleAction,
  deleteRoleAction,
  getRolesAction,
  updateRoleAction,
} from "@/lib/domain/actions/roles.actions";
import type { TeamListItem } from "@/lib/entities/team.type";
import type { RoleSelect } from "@/lib/entities/roles.type";
import { USER_ROLE_OPTIONS, type UserRole, type UserSelect } from "@/lib/entities/users.type";

export type AdminTab = "users" | "teams" | "roles";

export type VerificationAction = {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "secondary" | "danger";
  titleColor?: string;
  onConfirm: () => void | Promise<void>;
} | null;

function parseAdminTab(value: string | null): AdminTab {
  if (value === "teams" || value === "roles" || value === "users") return value;
  return "users";
}

export function useAdminPage(initialUsers: UserSelect[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<AdminTab>(() => parseAdminTab(searchParams.get("tab")));
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
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamManagerId, setTeamManagerId] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Role CRUD states
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
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

  useEffect(() => {
    setTab(parseAdminTab(searchParams.get("tab")));
  }, [searchParams]);

  const navigateTab = useCallback(
    (next: AdminTab) => {
      setTab(next);
      router.replace(`/admin?tab=${next}`);
    },
    [router],
  );

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
          setNotice(`Updated role to ${role}.`);
        },
      );
    },
    [executeWithVerification],
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
    setCreateTeamOpen(false);
    setNotice(`Team created. Join code: ${result.data.code}`);
    await refreshTeams();
    router.push(`/team/${result.data.id}`);
  }, [teamName, teamDescription, teamManagerId, refreshTeams, router]);

  const closeCreateTeam = useCallback(() => {
    setCreateTeamOpen(false);
    setTeamName("");
    setTeamDescription("");
    setTeamManagerId("");
  }, []);

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
        setCreateRoleOpen(false);
        setNotice(`Role "${result.data.label}" created successfully.`);
        await refreshRoles();
      },
    );
  }, [roleValue, roleLabel, roleHint, roleDescription, refreshRoles, executeWithVerification]);

  const closeCreateRole = useCallback(() => {
    setCreateRoleOpen(false);
    setRoleValue("");
    setRoleLabel("");
    setRoleHint("");
    setRoleDescription("");
  }, []);

  const startEditRole = useCallback((role: RoleSelect) => {
    setCreateRoleOpen(false);
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

  return {
    tab,
    setTab,
    navigateTab,
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
    createTeamOpen,
    setCreateTeamOpen,
    closeCreateTeam,
    teamName,
    setTeamName,
    teamDescription,
    setTeamDescription,
    teamManagerId,
    setTeamManagerId,
    creatingTeam,
    // Role CRUD exports
    createRoleOpen,
    setCreateRoleOpen,
    closeCreateRole,
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
    refreshUsers,
    refreshTeams,
    refreshRoles,
    changeRole,
    createTeam,
    verificationAction,
    closeVerification,
  };
}

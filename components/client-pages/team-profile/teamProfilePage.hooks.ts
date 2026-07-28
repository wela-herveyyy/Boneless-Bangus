"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirmModal } from "@/components/molecules/ConfirmModal/confirmModal.hooks";
import {
  changeTeamLeaderAction,
  removeTeamMemberAction,
  updateTeamApiKeysAction,
} from "@/lib/domain/actions/team.actions";
import type { TeamDetail } from "@/lib/entities/team.type";
import type { UserSelect } from "@/lib/entities/users.type";

export function useTeamProfilePage(initialDetail: TeamDetail, candidateUsers: UserSelect[]) {
  const router = useRouter();
  const confirmModal = useConfirmModal();
  const askConfirm = confirmModal.ask;
  const [detail, setDetail] = useState(initialDetail);
  const [cursorKey, setCursorKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [editingKeys, setEditingKeys] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignUserId, setReassignUserId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const reassignCandidates = candidateUsers.filter((u) => u.id !== detail.managerId);

  const startEditKeys = useCallback(() => {
    setEditingKeys(true);
    setCursorKey("");
    setGeminiKey("");
    setError(null);
    setNotice(null);
  }, []);

  const cancelEditKeys = useCallback(() => {
    setEditingKeys(false);
    setCursorKey("");
    setGeminiKey("");
    setError(null);
  }, []);

  const saveKeys = useCallback(async () => {
    if (!cursorKey.trim() && !geminiKey.trim()) {
      setError("Enter at least one API key to update.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    const formData = new FormData();
    formData.set("teamId", detail.id);
    if (cursorKey.trim()) formData.set("cursorApiKey", cursorKey.trim());
    if (geminiKey.trim()) formData.set("geminiApiKey", geminiKey.trim());
    const result = await updateTeamApiKeysAction(null, formData);
    setSaving(false);
    if (!result?.ok) {
      setError(result?.error ?? "Failed to update team keys.");
      return;
    }
    setDetail((prev) => ({
      ...prev,
      hasCursorApiKey: cursorKey.trim() ? true : prev.hasCursorApiKey,
      hasGeminiApiKey: geminiKey.trim() ? true : prev.hasGeminiApiKey,
    }));
    setNotice("Team API keys updated.");
    setEditingKeys(false);
    setCursorKey("");
    setGeminiKey("");
    router.refresh();
  }, [cursorKey, geminiKey, detail.id, router]);

  const archiveMember = useCallback(
    (userId: string, memberName: string) => {
      askConfirm({
        title: "Archive team member?",
        message: `Archive ${memberName} from this team? Their membership is kept as archived=true; they can rejoin with the code.`,
        confirmLabel: "Archive",
        confirmVariant: "danger",
        tone: "danger",
        onConfirm: async () => {
          setBusyUserId(userId);
          setError(null);
          setNotice(null);
          const result = await removeTeamMemberAction(detail.id, userId);
          setBusyUserId(null);
          if (!result.ok) {
            setError(result.error);
            return false;
          }
          setDetail((prev) => ({
            ...prev,
            members: prev.members.filter((m) => m.userId !== userId),
          }));
          setNotice(`${memberName} was archived from the team.`);
          router.refresh();
        },
      });
    },
    [askConfirm, detail.id, router],
  );

  const makeLeader = useCallback(
    (userId: string, memberName: string) => {
      askConfirm({
        title: "Change team leader?",
        message: `Make ${memberName} the team leader? The current leader becomes a regular member.`,
        confirmLabel: "Make leader",
        onConfirm: async () => {
          setBusyUserId(userId);
          setError(null);
          setNotice(null);
          const result = await changeTeamLeaderAction(detail.id, userId);
          setBusyUserId(null);
          if (!result.ok) {
            setError(result.error);
            return false;
          }
          setDetail((prev) => {
            const nextManager = prev.members.find((m) => m.userId === userId);
            return {
              ...prev,
              managerId: userId,
              managerName: nextManager?.name ?? memberName,
              managerEmail: nextManager?.email ?? prev.managerEmail,
              members: prev.members.map((m) => ({
                ...m,
                isManager: m.userId === userId,
              })),
            };
          });
          setNotice(`${memberName} is now the team leader.`);
          router.refresh();
        },
      });
    },
    [askConfirm, detail.id, router],
  );

  const openReassign = useCallback(() => {
    setReassignUserId(reassignCandidates[0]?.id ?? "");
    setReassignOpen(true);
    setError(null);
  }, [reassignCandidates]);

  const closeReassign = useCallback(() => {
    if (reassigning) return;
    setReassignOpen(false);
    setReassignUserId("");
  }, [reassigning]);

  const submitReassign = useCallback(async () => {
    if (!reassignUserId) {
      setError("Pick a user to become the new leader.");
      return;
    }
    const picked = candidateUsers.find((u) => u.id === reassignUserId);
    const name = picked?.name ?? "Selected user";
    setReassigning(true);
    setError(null);
    setNotice(null);
    const result = await changeTeamLeaderAction(detail.id, reassignUserId);
    setReassigning(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDetail((prev) => {
      const alreadyMember = prev.members.some((m) => m.userId === reassignUserId);
      const members = alreadyMember
        ? prev.members.map((m) => ({ ...m, isManager: m.userId === reassignUserId }))
        : [
            ...prev.members.map((m) => ({ ...m, isManager: false })),
            {
              userId: reassignUserId,
              name,
              email: picked?.email ?? "",
              role: picked?.role ?? "",
              isManager: true,
              joinedAt: new Date().toISOString(),
            },
          ];
      return {
        ...prev,
        managerId: reassignUserId,
        managerName: name,
        managerEmail: picked?.email ?? prev.managerEmail,
        members,
      };
    });
    setNotice(`${name} is now the team leader. You can archive the previous leader if needed.`);
    setReassignOpen(false);
    setReassignUserId("");
    router.refresh();
  }, [candidateUsers, detail.id, reassignUserId, router]);

  return {
    detail,
    cursorKey,
    setCursorKey,
    geminiKey,
    setGeminiKey,
    editingKeys,
    saving,
    busyUserId,
    error,
    notice,
    startEditKeys,
    cancelEditKeys,
    saveKeys,
    archiveMember,
    makeLeader,
    confirmModal,
    reassignOpen,
    reassignUserId,
    setReassignUserId,
    reassignCandidates,
    reassigning,
    openReassign,
    closeReassign,
    submitReassign,
  };
}

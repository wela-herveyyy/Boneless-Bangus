"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTeamApiKeysAction } from "@/lib/domain/actions/team.actions";
import type { TeamDetail } from "@/lib/entities/team.type";

export function useTeamProfilePage(initialDetail: TeamDetail) {
  const router = useRouter();
  const [detail, setDetail] = useState(initialDetail);
  const [cursorKey, setCursorKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [editingKeys, setEditingKeys] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  return {
    detail,
    cursorKey,
    setCursorKey,
    geminiKey,
    setGeminiKey,
    editingKeys,
    saving,
    error,
    notice,
    startEditKeys,
    cancelEditKeys,
    saveKeys,
  };
}

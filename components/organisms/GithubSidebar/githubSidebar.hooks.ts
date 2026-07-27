"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGithubAuthStatusAction,
  getGithubProfileAction,
  saveGithubPatAction,
  disconnectGithubAuthAction,
} from "@/lib/domain/actions/github.actions";
import type {
  GithubAuthRecord,
  GithubProfileRecord,
} from "@/lib/entities/github.type";

export function clearGithubCache() {
  // Global cache removed to prevent cross-account stale state bugs
}

export function useGithubSidebar(isOpen: boolean) {
  const [authRecord, setAuthRecord] = useState<GithubAuthRecord | null>(null);
  const [profileRecord, setProfileRecord] = useState<GithubProfileRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoadingRepos(true);
    try {
      const profileRes = await getGithubProfileAction();
      if (profileRes.ok) {
        setProfileRecord(profileRes.data);
      } else {
        setProfileRecord(null);
        setError(profileRes.error || "Failed to load GitHub repositories.");
      }
    } catch (err) {
      setProfileRecord(null);
      setError(err instanceof Error ? err.message : "Failed to load GitHub repositories.");
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const fetchAuthStatus = useCallback(
    async (_force = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getGithubAuthStatusAction();
        if (res.ok) {
          setAuthRecord(res.data);

          if (res.data.isConnected) {
            await fetchProfile();
          } else {
            setProfileRecord(null);
          }
        } else {
          setError(res.error || "Failed to load GitHub status.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load GitHub status.");
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile],
  );

  const handleSavePat = async (pat: string) => {
    if (!pat.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await saveGithubPatAction(pat.trim());
      if (res.ok) {
        setNotification("GitHub PAT saved successfully.");
        await fetchAuthStatus(true);
      } else {
        setError(res.error || "Failed to save PAT.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save PAT.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    try {
      const res = await disconnectGithubAuthAction();
      if (res.ok) {
        setNotification("GitHub account disconnected.");
        setAuthRecord(null);
        setProfileRecord(null);
      } else {
        setError(res.error || "Failed to disconnect.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchAuthStatus();
    }
  }, [isOpen, fetchAuthStatus]);

  // Initial fetch even if not open so we know the role for conditional rendering
  useEffect(() => {
    void fetchAuthStatus(false);

    const handleProfileUpdate = () => {
      void fetchAuthStatus(true);
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [fetchAuthStatus]);

  return {
    authRecord,
    profileRecord,
    loading,
    loadingRepos,
    error,
    notification,
    isDisconnecting,
    isSaving,
    refreshRepos: fetchProfile,
    handleSavePat,
    handleDisconnect,
    clearNotification: () => setNotification(null),
    clearError: () => setError(null),
  };
}

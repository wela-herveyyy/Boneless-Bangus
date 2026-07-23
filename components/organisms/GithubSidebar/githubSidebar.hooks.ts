"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGithubAuthStatusAction,
  getGithubProfileAction,
  getGithubOrgReposAction,
  saveGithubPatAction,
  disconnectGithubAuthAction,
  type GithubAuthRecord,
  type GithubProfileRecord,
} from "@/lib/domain/actions/github.actions";

export function clearGithubCache() {
  // Global cache removed to prevent cross-account stale state bugs
}

export function useGithubSidebar(isOpen: boolean) {
  const [authRecord, setAuthRecord] = useState<GithubAuthRecord | null>(null);
  const [profileRecord, setProfileRecord] = useState<GithubProfileRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orgRepos, setOrgRepos] = useState<Record<string, any[]>>({});
  const [loadingOrgs, setLoadingOrgs] = useState<Record<string, boolean>>({});

  const fetchAuthStatus = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getGithubAuthStatusAction();
      if (res.ok && res.data) {
        setAuthRecord(res.data);

        // Fetch profile if connected
        if (res.data.isConnected) {
          const profileRes = await getGithubProfileAction();
          if (profileRes.ok && profileRes.data) {
            setProfileRecord(profileRes.data);
          }
        } else {
          setProfileRecord(null);
        }
      } else if (!res.ok) {
        setError(res.error || "Failed to load GitHub status.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load GitHub status.");
    } finally {
      setLoading(false);
    }
  }, []);

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
        setOrgRepos({});
      } else {
        setError(res.error || "Failed to disconnect.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const fetchOrgRepos = async (orgLogin: string) => {
    if (orgRepos[orgLogin] || loadingOrgs[orgLogin]) return; // Already fetched or fetching

    setLoadingOrgs((prev) => ({ ...prev, [orgLogin]: true }));
    try {
      const res = await getGithubOrgReposAction(orgLogin);
      if (res.ok && res.data) {
        setOrgRepos((prev) => ({ ...prev, [orgLogin]: res.data! }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrgs((prev) => ({ ...prev, [orgLogin]: false }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuthStatus();
    }
  }, [isOpen, fetchAuthStatus]);

  // Initial fetch even if not open so we know the role for conditional rendering
  useEffect(() => {
    fetchAuthStatus(false);
    
    // Listen for global profile updates (e.g. from onboarding) to re-evaluate role
    const handleProfileUpdate = () => {
      fetchAuthStatus(true);
    };
    
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [fetchAuthStatus]);

  return {
    authRecord,
    profileRecord,
    loading,
    error,
    notification,
    isDisconnecting,
    isSaving,
    orgRepos,
    loadingOrgs,
    fetchOrgRepos,
    handleSavePat,
    handleDisconnect,
    clearNotification: () => setNotification(null),
    clearError: () => setError(null),
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  disconnectGoogleWorkspaceAuthAction,
  getGoogleWorkspaceAuthStatusAction,
  toggleGoogleWorkspaceCapabilityAction,
} from "@/lib/domain/actions/google_workspace_auth.actions";
import type { GoogleWorkspaceAuthRecord, WorkspaceCapability } from "@/lib/entities/google_workspace_auth.type";

export type GoogleWorkspaceTab = "calendar" | "meet" | "email";

// Module-level in-memory cache so opening/closing the right sidebar returns instant data
let cachedAuthRecord: GoogleWorkspaceAuthRecord | null = null;
let lastAuthFetchTime = 0;

export function useGoogleWorkspaceSidebar(isOpen: boolean) {
  const [activeTab, setActiveTab] = useState<GoogleWorkspaceTab>("calendar");
  const [authRecord, setAuthRecord] = useState<GoogleWorkspaceAuthRecord | null>(cachedAuthRecord);
  const [loading, setLoading] = useState<boolean>(() => cachedAuthRecord === null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [togglingCapability, setTogglingCapability] = useState<WorkspaceCapability | null>(null);

  const fetchAuthStatus = useCallback(async (force = false) => {
    const now = Date.now();
    // If cached and less than 5m old without forced reload, return instantly
    if (cachedAuthRecord && !force && now - lastAuthFetchTime < 300000) {
      setAuthRecord(cachedAuthRecord);
      setLoading(false);
      return;
    }

    // Only show spinning loader on initial fetch when there is no cache or when explicitly forced
    if (cachedAuthRecord === null || force) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await getGoogleWorkspaceAuthStatusAction();
      if (res.ok) {
        cachedAuthRecord = res.data;
        lastAuthFetchTime = Date.now();
        setAuthRecord(res.data);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Google Workspace connection status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAuthStatus(false);
    }
  }, [isOpen, fetchAuthStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get("workspace_auth");
    const authError = params.get("workspace_auth_error");

    if (success === "success") {
      setNotification("Successfully connected Google Workspace account!");
      fetchAuthStatus(true);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (authError) {
      setError(`Google connection error: ${decodeURIComponent(authError)}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchAuthStatus]);

  const handleConnect = useCallback(() => {
    window.location.href = "/api/workspace/oauth/init";
  }, []);

  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    setError(null);
    try {
      const res = await disconnectGoogleWorkspaceAuthAction();
      if (res.ok) {
        cachedAuthRecord = null;
        lastAuthFetchTime = 0;
        setNotification("Disconnected Google Workspace account.");
        await fetchAuthStatus(true);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect account.");
    } finally {
      setIsDisconnecting(false);
    }
  }, [fetchAuthStatus]);

  const handleToggleCapability = useCallback(
    async (capability: WorkspaceCapability, enabled: boolean) => {
      setTogglingCapability(capability);
      setError(null);
      try {
        const res = await toggleGoogleWorkspaceCapabilityAction(capability, enabled);
        if (res.ok) {
          if (authRecord) {
            const propKey =
              capability === "calendar"
                ? "calendarEnabled"
                : capability === "meet"
                  ? "meetEnabled"
                  : "emailEnabled";
            const updated = {
              ...authRecord,
              [propKey]: enabled,
            };
            cachedAuthRecord = updated;
            setAuthRecord(updated);
          }
        } else {
          setError(res.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to toggle ${capability}.`);
      } finally {
        setTogglingCapability(null);
      }
    },
    [authRecord]
  );

  return {
    activeTab,
    setActiveTab,
    authRecord,
    loading,
    error,
    notification,
    isDisconnecting,
    togglingCapability,
    handleConnect,
    handleDisconnect,
    handleToggleCapability,
    clearNotification: () => setNotification(null),
    clearError: () => setError(null),
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  disconnectGoogleWorkspaceAuthAction,
  getGoogleWorkspaceAuthStatusAction,
  toggleGoogleWorkspaceCapabilityAction,
} from "@/lib/domain/actions/google_workspace_auth.actions";
import type { GoogleWorkspaceAuthRecord, WorkspaceCapability } from "@/lib/entities/google_workspace_auth.type";

export function useGoogleWorkspaceSidebar(isOpen: boolean) {
  const [authRecord, setAuthRecord] = useState<GoogleWorkspaceAuthRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [togglingCapability, setTogglingCapability] = useState<WorkspaceCapability | null>(null);

  const fetchAuthStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getGoogleWorkspaceAuthStatusAction();
      if (res.ok) {
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
      fetchAuthStatus();
    }
  }, [isOpen, fetchAuthStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get("workspace_auth");
    const authError = params.get("workspace_auth_error");

    if (success === "success") {
      setNotification("Successfully connected Google Workspace account!");
      fetchAuthStatus();
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
        setNotification("Disconnected Google Workspace account.");
        await fetchAuthStatus();
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
            setAuthRecord({
              ...authRecord,
              [capability === "calendar" ? "calendarEnabled" : "emailEnabled"]: enabled,
            });
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

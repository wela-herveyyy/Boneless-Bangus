"use client";

import React from "react";
import { SiGoogle } from "react-icons/si";
import { HiOutlineArrowPath } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { WorkspaceCapabilityCard } from "@/components/molecules/WorkspaceCapabilityCard/WorkspaceCapabilityCard";
import { useGoogleWorkspaceSidebar } from "@/components/organisms/GoogleWorkspaceSidebar/googleWorkspaceSidebar.hooks";

export function IntegrationsTab() {
  const {
    authRecord,
    loading,
    error,
    notification,
    isDisconnecting,
    togglingCapability,
    handleConnect,
    handleDisconnect,
    handleToggleCapability,
    clearNotification,
    clearError,
  } = useGoogleWorkspaceSidebar(true);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
        <HiOutlineArrowPath className="size-6 animate-spin text-primary" />
        <span className="text-xs">Loading API integration status...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Notifications / Errors */}
      {notification && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700">
          <span>{notification}</span>
          <button
            type="button"
            onClick={clearNotification}
            className="font-bold text-emerald-800 hover:text-emerald-950"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="font-bold text-red-800 hover:text-red-950"
          >
            ✕
          </button>
        </div>
      )}

      {/* Google Workspace Connection Status */}
      {!authRecord?.isConnected ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-primary/25 bg-surface-container-low/40 p-6 text-center shadow-inner">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
            <SiGoogle className="size-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm text-on-surface">Connect Google Workspace</h3>
            <p className="text-xs leading-relaxed text-on-surface-variant">
              Authenticate securely via 1-Click OAuth (`Calendar`, `Meet`, and `Gmail`) to enable direct API integration with your interactive workspace widgets and AI chat agent (via our internal tools, not official remote MCP).
            </p>
          </div>
          <Button
            type="button"
            onClick={handleConnect}
            variant="primary"
            className="flex w-full items-center justify-center gap-2.5 shadow-sm"
          >
            <SiGoogle className="size-4" />
            <span>Connect Google Account</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-surface-container/80 p-3.5 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <SiGoogle className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-on-surface">
                  {authRecord.email}
                </div>
                <div className="text-[10px] text-primary">Connected Account</div>
              </div>
            </div>
            <Button
              type="button"
              variant="danger"
              disabled={isDisconnecting}
              onClick={handleDisconnect}
              className="text-xs shrink-0 px-3 py-1.5"
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-0.5">
              Enabled Capabilities
            </h4>

            <WorkspaceCapabilityCard
              capability="calendar"
              title="Google Calendar"
              description="Enable direct OAuth API integration to view your schedule and create new agenda items directly from this calendar widget and your chat agent."
              enabled={authRecord.calendarEnabled}
              isConnected={authRecord.isConnected}
              isToggling={togglingCapability === "calendar"}
              onToggle={handleToggleCapability}
            />

            <WorkspaceCapabilityCard
              capability="meet"
              title="Google Meet"
              description="Enable direct OAuth API integration to instantly provision video meeting rooms and copy scheduled Google Meet links directly from this widget and your chat agent."
              enabled={authRecord.meetEnabled}
              isConnected={authRecord.isConnected}
              isToggling={togglingCapability === "meet"}
              onToggle={handleToggleCapability}
            />

            <WorkspaceCapabilityCard
              capability="email"
              title="Gmail API"
              description="Enable direct OAuth API integration to view recent messages and compose emails directly via Gmail API for your widget and chat agent."
              enabled={authRecord.emailEnabled}
              isConnected={authRecord.isConnected}
              isToggling={togglingCapability === "email"}
              onToggle={handleToggleCapability}
            />
          </div>
        </div>
      )}
    </div>
  );
}

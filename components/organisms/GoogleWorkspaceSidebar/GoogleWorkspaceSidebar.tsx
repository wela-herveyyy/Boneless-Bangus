"use client";

import React from "react";
import { SiGoogle } from "react-icons/si";
import { HiOutlineArrowPath, HiOutlineExclamationCircle, HiOutlineCheckCircle } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import {
  useRightSidebar,
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { useGoogleWorkspaceSidebar } from "./googleWorkspaceSidebar.hooks";
import { WorkspaceCapabilityCard } from "./WorkspaceCapabilityCard";
import { WorkspaceCalendarWidget } from "./WorkspaceCalendarWidget";
import { WorkspaceEmailsWidget } from "./WorkspaceEmailsWidget";
import { WorkspaceMeetWidget } from "./WorkspaceMeetWidget";

export function GoogleWorkspaceSidebar() {
  const sidebar = useRightSidebar("google_workspace", { bodyClass: "bbai-google-workspace-sidebar-open" });
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
  } = useGoogleWorkspaceSidebar(sidebar.isOpen);

  return (
    <>
      <RightSidebarTrigger
        sidebar={sidebar}
        icon={<SiGoogle className="size-5" aria-hidden />}
        labelOpen="Hide Workspace sidebar"
        labelClosed="Show Workspace sidebar"
        topClass="top-[calc(50%-7rem)]"
      />

      <RightSidebarBackdrop sidebar={sidebar} />

      <RightSidebarPanel sidebar={sidebar} className="google-workspace-sidebar-panel">
        <RightSidebarHeader
          sidebar={sidebar}
          subtitle="Google OAuth & APIs"
          title="Google Workspace"
          closeLabel="Close Workspace Sidebar"
        />

        <RightSidebarContent className="flex flex-col gap-6 p-5">
          {/* Notifications / Errors */}
          {error && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-error/30 bg-error/10 p-3.5 text-xs text-error shadow-sm">
              <div className="flex items-start gap-2.5">
                <HiOutlineExclamationCircle className="mt-0.5 size-4 shrink-0 text-error" />
                <span className="leading-relaxed">{error}</span>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="font-medium hover:underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {notification && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3.5 text-xs text-primary shadow-sm">
              <div className="flex items-start gap-2.5">
                <HiOutlineCheckCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="leading-relaxed">{notification}</span>
              </div>
              <button
                type="button"
                onClick={clearNotification}
                className="font-medium hover:underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
              <HiOutlineArrowPath className="size-6 animate-spin text-primary" />
              <span className="text-xs">Checking connection status...</span>
            </div>
          ) : !authRecord?.isConnected ? (
            /* Disconnected / 1-Click Connect Card */
            <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-border/60 bg-surface-container-low/40 p-6 text-center shadow-inner">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <SiGoogle className="size-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm text-on-surface">Connect Google Workspace</h3>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Authenticate securely via 1-Click OAuth (`Calendar` and `Gmail`) to grant your AI agent offline capabilities.
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
            /* Connected Account View */
            <div className="flex flex-col gap-6">
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

              {/* Capabilities List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-0.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Enabled Capabilities
                  </h3>
                  <span className="text-[10px] text-on-surface-variant/70">Toggle AI access per API</span>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <WorkspaceCapabilityCard
                      capability="calendar"
                      title="Google Calendar"
                      description="Allow AI agents to create, schedule, and organize meetings or reminders directly in your primary Google Calendar."
                      enabled={authRecord.calendarEnabled}
                      isConnected={authRecord.isConnected}
                      isToggling={togglingCapability === "calendar"}
                      onToggle={handleToggleCapability}
                    />
                    <WorkspaceCalendarWidget
                      enabled={authRecord.calendarEnabled}
                      isConnected={authRecord.isConnected}
                    />
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border/30">
                    <WorkspaceCapabilityCard
                      capability="meet"
                      title="Google Meet"
                      description="Allow AI agents to instantly provision video conference links and schedule meetings right in Google Meet."
                      enabled={authRecord.meetEnabled}
                      isConnected={authRecord.isConnected}
                      isToggling={togglingCapability === "meet"}
                      onToggle={handleToggleCapability}
                    />
                    <WorkspaceMeetWidget
                      enabled={authRecord.meetEnabled}
                      isConnected={authRecord.isConnected}
                    />
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border/30">
                    <WorkspaceCapabilityCard
                      capability="email"
                      title="Gmail API"
                      description="Allow AI agents to draft and send emails securely via Gmail on your behalf to contacts or project stakeholders."
                      enabled={authRecord.emailEnabled}
                      isConnected={authRecord.isConnected}
                      isToggling={togglingCapability === "email"}
                      onToggle={handleToggleCapability}
                    />
                    <WorkspaceEmailsWidget
                      enabled={authRecord.emailEnabled}
                      isConnected={authRecord.isConnected}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </RightSidebarContent>
      </RightSidebarPanel>
    </>
  );
}

"use client";

import React from "react";
import { SiGoogle } from "react-icons/si";
import {
  HiOutlineArrowPath,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineCalendar,
  HiOutlineVideoCamera,
  HiOutlineEnvelope,
} from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import {
  useRightSidebar,
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { useGoogleWorkspaceSidebar, type GoogleWorkspaceTab } from "./googleWorkspaceSidebar.hooks";
import { WorkspaceCalendarWidget } from "@/components/organisms/WorkspaceCalendarWidget/WorkspaceCalendarWidget";
import { WorkspaceEmailsWidget } from "@/components/organisms/WorkspaceEmailsWidget/WorkspaceEmailsWidget";
import { WorkspaceMeetWidget } from "@/components/organisms/WorkspaceMeetWidget/WorkspaceMeetWidget";

export function GoogleWorkspaceSidebar({ topOffset }: { topOffset?: string } = {}) {
  const sidebar = useRightSidebar("google_workspace", { bodyClass: "bbai-google-workspace-sidebar-open" });
  const {
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
        topOffset={topOffset}
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
            <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-primary/25 bg-surface-container-low/40 p-6 text-center shadow-inner">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <SiGoogle className="size-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm text-on-surface">Connect Google Workspace</h3>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Authenticate securely via 1-Click OAuth (`Calendar`, `Meet`, and `Gmail`) to enable direct API integration with your interactive workspace widgets.
                </p>
              </div>
              <div className="flex flex-col w-full gap-2">
                <Button
                  type="button"
                  onClick={handleConnect}
                  variant="primary"
                  className="flex w-full items-center justify-center gap-2.5 shadow-sm"
                >
                  <SiGoogle className="size-4" />
                  <span>Connect Google Account</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("bbai:open-settings-integrations"))}
                  variant="secondary"
                  className="flex w-full items-center justify-center gap-2 text-xs"
                >
                  <span>Open API Integrations Settings ⚙️</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Connected Account View */
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
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("bbai:open-settings-integrations"))}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/15"
                  title="Configure in API Integrations Settings"
                >
                  Configure ⚙️
                </button>
              </div>

              {/* Segmented Tab Bar for Capabilities (Horizontally Scrollable for future expansion) */}
              <div className="flex items-center gap-1.5 rounded-xl bg-surface-container-low p-1.5 border border-primary/25 shadow-xs overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => setActiveTab("calendar")}
                  className={`flex shrink-0 min-w-fit items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-medium transition-colors border ${
                    activeTab === "calendar"
                      ? "bg-surface text-primary shadow-xs border-primary/25"
                      : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface/50 hover:border-primary/10"
                  }`}
                >
                  <HiOutlineCalendar className="size-4 shrink-0" />
                  <span>Calendar</span>
                  <span
                    className={`size-2 rounded-full shrink-0 transition-colors ${
                      authRecord.calendarEnabled ? "bg-emerald-500 shadow-2xs" : "bg-on-surface-variant/30"
                    }`}
                    title={authRecord.calendarEnabled ? "Calendar Enabled" : "Calendar Disabled"}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("meet")}
                  className={`flex shrink-0 min-w-fit items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-medium transition-colors border ${
                    activeTab === "meet"
                      ? "bg-surface text-primary shadow-xs border-primary/25"
                      : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface/50 hover:border-primary/10"
                  }`}
                >
                  <HiOutlineVideoCamera className="size-4 shrink-0" />
                  <span>Meet</span>
                  <span
                    className={`size-2 rounded-full shrink-0 transition-colors ${
                      authRecord.meetEnabled ? "bg-emerald-500 shadow-2xs" : "bg-on-surface-variant/30"
                    }`}
                    title={authRecord.meetEnabled ? "Meet Enabled" : "Meet Disabled"}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("email")}
                  className={`flex shrink-0 min-w-fit items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-medium transition-colors border ${
                    activeTab === "email"
                      ? "bg-surface text-primary shadow-xs border-primary/25"
                      : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface/50 hover:border-primary/10"
                  }`}
                >
                  <HiOutlineEnvelope className="size-4 shrink-0" />
                  <span>Gmail</span>
                  <span
                    className={`size-2 rounded-full shrink-0 ${
                      authRecord.emailEnabled ? "bg-emerald-500 shadow-2xs" : "bg-on-surface-variant/30"
                    }`}
                    title={authRecord.emailEnabled ? "Gmail Enabled" : "Gmail Disabled"}
                  />
                </button>
              </div>

              {/* Active Tab Content */}
              <div className="flex flex-col gap-3">
                {activeTab === "calendar" && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    {authRecord.calendarEnabled ? (
                      <WorkspaceCalendarWidget
                        enabled={authRecord.calendarEnabled}
                        isConnected={authRecord.isConnected}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/25 bg-surface-container-low/40 p-6 text-center">
                        <HiOutlineCalendar className="size-8 text-on-surface-variant/60" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-on-surface">Google Calendar Disabled</h4>
                          <p className="text-xs leading-relaxed text-on-surface-variant">
                            Enable direct OAuth API integration for Google Calendar anytime in your API Integrations settings.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => window.dispatchEvent(new CustomEvent("bbai:open-settings-integrations"))}
                          className="text-xs mt-1"
                        >
                          Configure in Settings ⚙️
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "meet" && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    {authRecord.meetEnabled ? (
                      <WorkspaceMeetWidget
                        enabled={authRecord.meetEnabled}
                        isConnected={authRecord.isConnected}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/25 bg-surface-container-low/40 p-6 text-center">
                        <HiOutlineVideoCamera className="size-8 text-on-surface-variant/60" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-on-surface">Google Meet Disabled</h4>
                          <p className="text-xs leading-relaxed text-on-surface-variant">
                            Enable direct OAuth API integration for Google Meet anytime in your API Integrations settings.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => window.dispatchEvent(new CustomEvent("bbai:open-settings-integrations"))}
                          className="text-xs mt-1"
                        >
                          Configure in Settings ⚙️
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "email" && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    {authRecord.emailEnabled ? (
                      <WorkspaceEmailsWidget
                        enabled={authRecord.emailEnabled}
                        isConnected={authRecord.isConnected}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/25 bg-surface-container-low/40 p-6 text-center">
                        <HiOutlineEnvelope className="size-8 text-on-surface-variant/60" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-on-surface">Gmail API Disabled</h4>
                          <p className="text-xs leading-relaxed text-on-surface-variant">
                            Enable direct OAuth API integration for Gmail anytime in your API Integrations settings.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => window.dispatchEvent(new CustomEvent("bbai:open-settings-integrations"))}
                          className="text-xs mt-1"
                        >
                          Configure in Settings ⚙️
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </RightSidebarContent>
      </RightSidebarPanel>
    </>
  );
}

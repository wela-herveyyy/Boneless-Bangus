"use client";

import React, { useState } from "react";
import { SiGithub } from "react-icons/si";
import { LuLogOut, LuChevronDown, LuChevronRight, LuBuilding2 } from "react-icons/lu";
import {
  HiOutlineArrowPath,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  useRightSidebar,
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { useGithubSidebar } from "./githubSidebar.hooks";

const ALLOWED_ROLES = ["owner", "admin", "dev", "qa", "po", "pm"];

export function GithubSidebar({ topOffset }: { topOffset?: string } = {}) {
  const sidebar = useRightSidebar("github_mcp", { bodyClass: "bbai-github-sidebar-open" });
  const {
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
    clearNotification,
    clearError,
  } = useGithubSidebar(sidebar.isOpen);

  const [patInput, setPatInput] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  const toggleOrg = (orgLogin: string) => {
    if (expandedOrg === orgLogin) {
      setExpandedOrg(null);
    } else {
      setExpandedOrg(orgLogin);
      fetchOrgRepos(orgLogin);
    }
  };

  // Conditionally hide the sidebar entirely if the user does not have a valid role
  if (!loading && authRecord && !ALLOWED_ROLES.includes(authRecord.role)) {
    return null;
  }

  // Also hide if it's still loading initially (prevents flash of wrong state)
  if (loading && !authRecord) {
    return null;
  }

  return (
    <>
      <RightSidebarTrigger
        sidebar={sidebar}
        icon={<SiGithub className="size-5" aria-hidden />}
        labelOpen="Hide GitHub sidebar"
        labelClosed="Show GitHub sidebar"
        topOffset={topOffset}
      />

      <RightSidebarBackdrop sidebar={sidebar} />

      <RightSidebarPanel sidebar={sidebar} className="github-sidebar-panel">
        <RightSidebarHeader
          sidebar={sidebar}
          subtitle="GitHub API & MCP"
          title="GitHub Integration"
          closeLabel="Close GitHub Sidebar"
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
            /* Disconnected View */
            <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-primary/25 bg-surface-container-low/40 p-6 text-center shadow-inner">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <SiGithub className="size-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm text-on-surface">Connect GitHub</h3>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Provide a Personal Access Token (PAT) to enable the AI to interact with GitHub repositories, analyze progress, and manage tasks directly.
                </p>
              </div>
              <div className="flex flex-col w-full gap-2">
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  className="w-full text-sm"
                />
                <div className="text-left text-[10px] text-on-surface-muted px-1 pb-1">
                  You can generate a classic PAT in your <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">GitHub Developer Settings</a>. Be sure to check the <strong>repo</strong> scope.
                </div>
                <Button
                  type="button"
                  onClick={() => handleSavePat(patInput)}
                  disabled={isSaving || !patInput.trim()}
                  variant="primary"
                  className="flex w-full items-center justify-center gap-2.5 shadow-sm"
                >
                  <SiGithub className="size-4" />
                  <span>{isSaving ? "Saving..." : "Save PAT"}</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Connected Account View */
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-surface-container/80 p-3.5 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  {profileRecord?.avatarUrl ? (
                    <img src={profileRecord.avatarUrl} alt="GitHub Avatar" className="size-8 rounded-full shadow-sm" />
                  ) : (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <SiGithub className="size-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-on-surface flex items-center gap-2">
                      {profileRecord?.username ? `@${profileRecord.username}` : "GitHub PAT Active"}
                      {authRecord?.role && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-sm">
                          {authRecord.role}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-primary mt-0.5">Connected Account</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDisconnecting}
                  onClick={() => setShowDisconnectModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-highest px-2.5 py-1 text-[11px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <LuLogOut className="size-3" aria-hidden />
                  Disconnect
                </button>
              </div>

              {profileRecord && (
                <div className="space-y-3 mt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Recent Repositories</h4>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{profileRecord.repoCount} Total</span>
                  </div>
                  
                  {profileRecord.repos.length > 0 ? (
                    <ul className="space-y-2">
                      {profileRecord.repos.map((repo) => (
                        <li key={repo.name} className="flex items-center justify-between rounded-md border border-outline/10 bg-surface-container-low p-2">
                          <div className="flex flex-col min-w-0">
                            <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline truncate">
                              {repo.name}
                            </a>
                            <span className="text-[10px] text-on-surface-muted">
                              {repo.private ? "Private" : "Public"} • Updated {new Date(repo.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-on-surface-muted italic">No recent repositories found.</div>
                  )}
                </div>
              )}

              {profileRecord && profileRecord.orgs && profileRecord.orgs.length > 0 && (
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Organizations</h4>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{profileRecord.orgs.length} Total</span>
                  </div>
                  <ul className="space-y-2">
                    {profileRecord.orgs.map((org) => {
                      const isExpanded = expandedOrg === org.login;
                      const isLoading = loadingOrgs[org.login];
                      const repos = orgRepos[org.login] || [];
                      
                      return (
                        <li key={org.login} className="rounded-md border border-outline/10 bg-surface-container-low overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleOrg(org.login)}
                            className="flex w-full items-center justify-between p-2 hover:bg-surface-container-high/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {org.avatar_url ? (
                                <img src={org.avatar_url} alt={org.login} className="size-5 rounded-md shadow-sm" />
                              ) : (
                                <LuBuilding2 className="size-4 text-on-surface-muted" />
                              )}
                              <span className="text-xs font-medium text-on-surface truncate">{org.login}</span>
                            </div>
                            <div className="text-on-surface-muted">
                              {isLoading ? (
                                <HiOutlineArrowPath className="size-3 animate-spin" />
                              ) : isExpanded ? (
                                <LuChevronDown className="size-3.5" />
                              ) : (
                                <LuChevronRight className="size-3.5" />
                              )}
                            </div>
                          </button>
                          
                          {isExpanded && !isLoading && (
                            <div className="p-2 pt-0 bg-surface-container-low border-t border-outline/5">
                              {repos.length > 0 ? (
                                <ul className="space-y-1.5 mt-2 max-h-48 overflow-y-auto custom-scrollbar">
                                  {repos.map((repo) => (
                                    <li key={repo.name} className="flex flex-col min-w-0 pl-2 border-l-2 border-primary/20">
                                      <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline truncate" title={repo.name}>
                                        {repo.name}
                                      </a>
                                      <span className="text-[10px] text-on-surface-muted">
                                        {repo.private ? "Private" : "Public"} • Updated {new Date(repo.updated_at).toLocaleDateString()}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-[10px] text-on-surface-muted italic mt-2 pl-2">No repositories found.</div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="space-y-2 mt-2">
                <h4 className="text-sm font-semibold text-on-surface">Enabled Capabilities</h4>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Your chat agent now has full access to the GitHub MCP. You can ask it to:
                </p>
                <ul className="text-xs list-disc list-inside text-on-surface-variant ml-1 space-y-1">
                  <li>Search and list your repositories</li>
                  <li>Analyze commits and pull requests</li>
                  <li>Create and manage tasks for developers/QA</li>
                  <li>Read file contents</li>
                </ul>
              </div>
            </div>
          )}
        </RightSidebarContent>
      </RightSidebarPanel>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
          <div
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disconnect-github-title"
          >
            <h3 id="disconnect-github-title" className="font-display text-xl font-semibold text-red-500">
              Disconnect GitHub?
            </h3>
            <p className="text-sm text-on-surface">
              Are you sure you want to disconnect your GitHub account? Your Personal Access Token will be deleted from the database and the agent will lose access to GitHub.
            </p>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowDisconnectModal(false)} className="px-4 py-2 text-sm">
                Cancel
              </Button>
              <button 
                type="button"
                onClick={() => {
                  setShowDisconnectModal(false);
                  handleDisconnect();
                }} 
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white font-medium rounded-2xl transition-colors disabled:opacity-50"
                disabled={isDisconnecting}
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

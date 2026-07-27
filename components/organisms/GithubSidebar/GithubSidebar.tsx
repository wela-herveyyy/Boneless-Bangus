"use client";

import React, { useState } from "react";
import { SiGithub } from "react-icons/si";
import {
  LuLogOut,
  LuChevronDown,
  LuChevronRight,
  LuBuilding2,
  LuUser,
  LuUsers,
} from "react-icons/lu";
import {
  HiOutlineArrowPath,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Portal } from "@/components/atoms/Portal/Portal";
import {
  useRightSidebar,
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import type { GithubRepoSummary } from "@/lib/entities/github.type";
import { useGithubSidebar } from "./githubSidebar.hooks";

const ALLOWED_ROLES = ["owner", "admin", "dev", "qa", "po", "pm"];

function RepoList({
  repos,
  emptyLabel,
}: {
  repos: GithubRepoSummary[];
  emptyLabel: string;
}) {
  if (repos.length === 0) {
    return (
      <p className="px-1 py-2 text-[11px] italic text-on-surface-muted">{emptyLabel}</p>
    );
  }

  return (
    <ul className="max-h-52 space-y-1.5 overflow-y-auto custom-scrollbar">
      {repos.map((repo) => (
        <li
          key={repo.fullName}
          className="rounded-xl bg-surface-container-lowest px-3 py-2 shadow-bloom"
        >
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs font-medium text-primary hover:underline"
            title={repo.fullName}
          >
            {repo.fullName}
          </a>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-on-surface-muted">
            <span>{repo.private ? "Private" : "Public"}</span>
            {repo.language ? <span>• {repo.language}</span> : null}
            {repo.updatedAt ? (
              <span>• Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
            ) : null}
          </div>
          {repo.description ? (
            <p className="mt-1 line-clamp-2 text-[10px] text-on-surface-variant">
              {repo.description}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function GithubSidebar({ topOffset }: { topOffset?: string } = {}) {
  const sidebar = useRightSidebar("github_mcp", { bodyClass: "bbai-github-sidebar-open" });
  const {
    authRecord,
    profileRecord,
    loading,
    loadingRepos,
    error,
    notification,
    isDisconnecting,
    isSaving,
    refreshRepos,
    handleSavePat,
    handleDisconnect,
    clearNotification,
    clearError,
  } = useGithubSidebar(sidebar.isOpen);

  const [patInput, setPatInput] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [sectionOpen, setSectionOpen] = useState({
    personal: true,
    collaborator: true,
    organizations: true,
  });

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
          {error && (
            <div className="flex items-start justify-between gap-3 rounded-2xl bg-error/10 p-3.5 text-xs text-error shadow-bloom">
              <div className="flex items-start gap-2.5">
                <HiOutlineExclamationCircle className="mt-0.5 size-4 shrink-0 text-error" />
                <span className="leading-relaxed">{error}</span>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="shrink-0 font-medium hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {notification && (
            <div className="flex items-start justify-between gap-3 rounded-2xl bg-primary/10 p-3.5 text-xs text-primary shadow-bloom">
              <div className="flex items-start gap-2.5">
                <HiOutlineCheckCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="leading-relaxed">{notification}</span>
              </div>
              <button
                type="button"
                onClick={clearNotification}
                className="shrink-0 font-medium hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
              <HiOutlineArrowPath className="size-6 animate-spin text-primary" />
              <span className="text-xs">Checking connection status...</span>
            </div>
          ) : !authRecord?.isConnected ? (
            <div className="flex flex-col items-center justify-center gap-5 rounded-2xl bg-surface-container-low/40 p-6 text-center shadow-inner">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <SiGithub className="size-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-on-surface">Connect GitHub</h3>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Provide a Personal Access Token (PAT) to enable the AI to interact with GitHub
                  repositories, analyze progress, and manage tasks directly.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  className="w-full text-sm"
                />
                <div className="px-1 pb-1 text-left text-[10px] text-on-surface-muted">
                  Generate a classic PAT in{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    GitHub Developer Settings
                  </a>
                  . Include the <strong>repo</strong> and <strong>read:org</strong> scopes.
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
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-3.5 shadow-bloom">
                <div className="flex min-w-0 items-center gap-3">
                  {profileRecord?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileRecord.avatarUrl}
                      alt="GitHub Avatar"
                      className="size-8 rounded-full shadow-sm"
                    />
                  ) : (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <SiGithub className="size-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate text-xs font-semibold text-on-surface">
                      {profileRecord?.username
                        ? `@${profileRecord.username}`
                        : "GitHub PAT Active"}
                      {authRecord?.role && (
                        <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                          {authRecord.role}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] text-primary">Connected Account</div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDisconnecting}
                  onClick={() => setShowDisconnectModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-highest px-2.5 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <LuLogOut className="size-3" aria-hidden />
                  Disconnect
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface">Repositories</h4>
                    <p className="mt-0.5 text-[11px] text-on-surface-muted">
                      Personal, collaborator, and organization repos available to this PAT.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void refreshRepos()}
                    disabled={loadingRepos}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-high px-2.5 py-1.5 text-[11px] font-medium text-on-surface transition-colors hover:bg-surface-container-highest disabled:opacity-50"
                  >
                    <HiOutlineArrowPath
                      className={`size-3.5 ${loadingRepos ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                </div>

                {loadingRepos && !profileRecord ? (
                  <div className="flex items-center gap-2 py-6 text-xs text-on-surface-muted">
                    <HiOutlineArrowPath className="size-4 animate-spin text-primary" />
                    Loading repositories…
                  </div>
                ) : profileRecord ? (
                  <div className="space-y-3">
                    {/* Personal */}
                    <section className="rounded-2xl bg-surface-container-low p-3 shadow-bloom">
                      <button
                        type="button"
                        onClick={() =>
                          setSectionOpen((s) => ({ ...s, personal: !s.personal }))
                        }
                        className="flex w-full items-center justify-between gap-2"
                      >
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface">
                          <LuUser className="size-3.5 text-primary" />
                          Personal
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {profileRecord.totals.personal}
                          </span>
                        </span>
                        {sectionOpen.personal ? (
                          <LuChevronDown className="size-3.5 text-on-surface-muted" />
                        ) : (
                          <LuChevronRight className="size-3.5 text-on-surface-muted" />
                        )}
                      </button>
                      {sectionOpen.personal ? (
                        <div className="mt-2">
                          <RepoList
                            repos={profileRecord.personalRepos}
                            emptyLabel="No personal repositories found."
                          />
                        </div>
                      ) : null}
                    </section>

                    {/* Collaborator */}
                    <section className="rounded-2xl bg-surface-container-low p-3 shadow-bloom">
                      <button
                        type="button"
                        onClick={() =>
                          setSectionOpen((s) => ({
                            ...s,
                            collaborator: !s.collaborator,
                          }))
                        }
                        className="flex w-full items-center justify-between gap-2"
                      >
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface">
                          <LuUsers className="size-3.5 text-primary" />
                          Collaborator
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {profileRecord.totals.collaborator}
                          </span>
                        </span>
                        {sectionOpen.collaborator ? (
                          <LuChevronDown className="size-3.5 text-on-surface-muted" />
                        ) : (
                          <LuChevronRight className="size-3.5 text-on-surface-muted" />
                        )}
                      </button>
                      {sectionOpen.collaborator ? (
                        <div className="mt-2">
                          <RepoList
                            repos={profileRecord.collaboratorRepos}
                            emptyLabel="No collaborator repositories found."
                          />
                        </div>
                      ) : null}
                    </section>

                    {/* Organizations */}
                    <section className="rounded-2xl bg-surface-container-low p-3 shadow-bloom">
                      <button
                        type="button"
                        onClick={() =>
                          setSectionOpen((s) => ({
                            ...s,
                            organizations: !s.organizations,
                          }))
                        }
                        className="flex w-full items-center justify-between gap-2"
                      >
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface">
                          <LuBuilding2 className="size-3.5 text-primary" />
                          Organizations
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {profileRecord.organizations.length} orgs ·{" "}
                            {profileRecord.totals.organization} repos
                          </span>
                        </span>
                        {sectionOpen.organizations ? (
                          <LuChevronDown className="size-3.5 text-on-surface-muted" />
                        ) : (
                          <LuChevronRight className="size-3.5 text-on-surface-muted" />
                        )}
                      </button>

                      {sectionOpen.organizations ? (
                        <div className="mt-2 space-y-2">
                          {profileRecord.organizations.length === 0 ? (
                            <p className="px-1 py-2 text-[11px] italic text-on-surface-muted">
                              No organizations found. Ensure the PAT has{" "}
                              <strong>read:org</strong>.
                            </p>
                          ) : (
                            profileRecord.organizations.map((org) => {
                              const isExpanded = expandedOrg === org.login;
                              return (
                                <div
                                  key={org.login}
                                  className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-bloom"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedOrg(isExpanded ? null : org.login)
                                    }
                                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-surface-container-high/50"
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      {org.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={org.avatarUrl}
                                          alt={org.login}
                                          className="size-5 rounded-md shadow-sm"
                                        />
                                      ) : (
                                        <LuBuilding2 className="size-4 text-on-surface-muted" />
                                      )}
                                      <span className="truncate text-xs font-medium text-on-surface">
                                        {org.login}
                                      </span>
                                      <span className="text-[10px] text-on-surface-muted">
                                        {org.repos.length}
                                      </span>
                                    </span>
                                    {isExpanded ? (
                                      <LuChevronDown className="size-3.5 text-on-surface-muted" />
                                    ) : (
                                      <LuChevronRight className="size-3.5 text-on-surface-muted" />
                                    )}
                                  </button>
                                  {isExpanded ? (
                                    <div className="px-3 pb-3">
                                      <RepoList
                                        repos={org.repos}
                                        emptyLabel="No repositories found for this organization."
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })
                          )}
                        </div>
                      ) : null}
                    </section>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 shadow-bloom">
                    <p className="text-xs leading-relaxed text-on-surface-muted">
                      {error ||
                        "Could not load repositories. GitHub rejected the stored PAT."}
                    </p>
                    <p className="text-[11px] leading-relaxed text-on-surface-variant">
                      Recommended:{" "}
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo,read:org&description=BBAI"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        classic PAT
                      </a>{" "}
                      with <strong>repo</strong> + <strong>read:org</strong>. Fine-grained tokens
                      only cover one owner and often cannot list collaborator/org repos. Org SAML
                      requires authorizing the token for that org.
                    </p>
                    <Input
                      type="password"
                      placeholder="Paste a new ghp_… or github_pat_… token"
                      value={patInput}
                      onChange={(e) => setPatInput(e.target.value)}
                      className="w-full text-sm"
                    />
                    <Button
                      type="button"
                      onClick={() => handleSavePat(patInput)}
                      disabled={isSaving || !patInput.trim()}
                      variant="primary"
                      className="flex w-full items-center justify-center gap-2"
                    >
                      <SiGithub className="size-4" />
                      <span>{isSaving ? "Saving…" : "Update PAT"}</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-on-surface">Enabled Capabilities</h4>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Your chat agent now has full access to the GitHub MCP. You can ask it to:
                </p>
                <ul className="ml-1 list-inside list-disc space-y-1 text-xs text-on-surface-variant">
                  <li>List an overview of all your repositories (personal, collab, orgs)</li>
                  <li>Search repositories or drill into one repo’s commits and PRs</li>
                  <li>Analyze commits and pull requests</li>
                  <li>Create and manage tasks for developers/QA</li>
                  <li>Read file contents</li>
                </ul>
              </div>
            </div>
          )}
        </RightSidebarContent>
      </RightSidebarPanel>

      {showDisconnectModal ? (
        <Portal>
          <div className="fixed inset-0 z-140 flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
            <div
              className="ghost-border flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom"
              role="dialog"
              aria-modal="true"
              aria-labelledby="disconnect-github-title"
            >
              <h3
                id="disconnect-github-title"
                className="font-display text-xl font-semibold text-red-500"
              >
                Disconnect GitHub?
              </h3>
              <p className="text-sm text-on-surface">
                Are you sure you want to disconnect your GitHub account? Your Personal Access Token
                will be deleted from the database and the agent will lose access to GitHub.
              </p>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowDisconnectModal(false)}
                  className="px-4 py-2 text-sm"
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisconnectModal(false);
                    void handleDisconnect();
                  }}
                  className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      ) : null}
    </>
  );
}

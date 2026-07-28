"use client";

import Link from "next/link";
import {
  LuFishSymbol,
  LuKeyRound,
  LuMessageSquare,
  LuRefreshCw,
  LuShield,
  LuUsers,
  LuUsersRound,
} from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import type { UserRole, UserSelect } from "@/lib/entities/users.type";
import { FuturisticBackdrop } from "@/components/molecules/FuturisticBackdrop/FuturisticBackdrop";
import { VerificationModal } from "@/components/molecules/VerificationModal/VerificationModal";
import { useAdminPage } from "./adminPage.hooks";

type AdminPageProps = {
  initialUsers: UserSelect[];
  currentUserId: string;
  currentUserName?: string | null;
  currentUserRole?: UserRole | null;
};

function roleLabel(role: string) {
  if (!role) return "Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function initialsFromName(name: string | null | undefined) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "A";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "A";
}

function KeyStatus({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-muted">
      <span className={`size-1.5 rounded-full ${ok ? "bg-tertiary" : "bg-secondary"}`} />
      {label}
    </span>
  );
}

export function AdminPage({
  initialUsers,
  currentUserId,
  currentUserName = "Admin",
  currentUserRole = "admin",
}: AdminPageProps) {
  const admin = useAdminPage(initialUsers);
  const displayName = currentUserName?.trim() || "Admin";
  const displayRole = currentUserRole ?? "admin";

  const ownerCount = admin.users.filter((u) => u.role === "owner").length;
  const adminCount = admin.users.filter((u) => u.role === "admin").length;

  return (
    <div className="relative flex min-h-screen bg-surface">
      <FuturisticBackdrop />
      <VerificationModal
        isOpen={!!admin.verificationAction}
        title={admin.verificationAction?.title ?? ""}
        message={admin.verificationAction?.message ?? ""}
        confirmLabel={admin.verificationAction?.confirmLabel}
        confirmVariant={admin.verificationAction?.confirmVariant}
        titleColor={admin.verificationAction?.titleColor}
        onCancel={admin.closeVerification}
        onConfirm={admin.verificationAction?.onConfirm ?? (() => {})}
      />
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-surface-container-low/80 backdrop-blur-[20px] md:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-container text-on-primary shadow-bloom">
            <LuFishSymbol className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-on-surface">BBAI Control</p>
            <p className="text-xs text-on-surface-muted">Administration</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
            Manage
          </p>
          <button
            type="button"
            onClick={() => admin.setTab("users")}
            className={[
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors",
              admin.tab === "users"
                ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                : "text-on-surface-muted hover:bg-surface-container-high/70 hover:text-on-surface",
            ].join(" ")}
          >
            <LuUsers className="size-4 shrink-0" aria-hidden />
            Users
            <span className="ml-auto rounded-lg bg-surface-container-high px-2 py-0.5 text-[11px] tabular-nums text-on-surface-muted">
              {admin.users.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => admin.setTab("teams")}
            className={[
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors",
              admin.tab === "teams"
                ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                : "text-on-surface-muted hover:bg-surface-container-high/70 hover:text-on-surface",
            ].join(" ")}
          >
            <LuUsersRound className="size-4 shrink-0" aria-hidden />
            Teams
            <span className="ml-auto rounded-lg bg-surface-container-high px-2 py-0.5 text-[11px] tabular-nums text-on-surface-muted">
              {admin.teams.length || "—"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => admin.setTab("roles")}
            className={[
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors",
              admin.tab === "roles"
                ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                : "text-on-surface-muted hover:bg-surface-container-high/70 hover:text-on-surface",
            ].join(" ")}
          >
            <LuShield className="size-4 shrink-0" aria-hidden />
            Roles
            <span className="ml-auto rounded-lg bg-surface-container-high px-2 py-0.5 text-[11px] tabular-nums text-on-surface-muted">
              {admin.roles.length || "—"}
            </span>
          </button>

          <div className="mt-6 px-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
              Workspace
            </p>
            <Link
              href="/workspace"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-on-surface-muted transition-colors hover:bg-surface-container-high/70 hover:text-on-surface"
            >
              <LuMessageSquare className="size-4 shrink-0" aria-hidden />
              Back to chat
            </Link>
          </div>
        </nav>

        <div className="p-4">
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-bloom">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
                {initialsFromName(displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-on-surface">{displayName}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary">
                  <LuShield className="size-3" aria-hidden />
                  {roleLabel(displayRole)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => admin.setTab("users")}
            className={[
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              admin.tab === "users"
                ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                : "bg-surface-container-low text-on-surface-muted",
            ].join(" ")}
          >
            Users
          </button>
          <button
            type="button"
            onClick={() => admin.setTab("teams")}
            className={[
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              admin.tab === "teams"
                ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                : "bg-surface-container-low text-on-surface-muted",
            ].join(" ")}
          >
            Teams
          </button>
          <button
            type="button"
            onClick={() => admin.setTab("roles")}
            className={[
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              admin.tab === "roles"
                ? "bg-surface-container-lowest text-on-surface shadow-bloom"
                : "bg-surface-container-low text-on-surface-muted",
            ].join(" ")}
          >
            Roles
          </button>
          <Link
            href="/workspace"
            className="ml-auto rounded-xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-muted"
          >
            Chat
          </Link>
        </div>

        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {admin.tab === "users" ? "Access" : admin.tab === "teams" ? "Organization" : "Permissions & Onboarding"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            {admin.tab === "users"
              ? "People & access"
              : admin.tab === "teams"
                ? "Teams & shared keys"
                : "Role Management"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-on-surface-muted">
            {admin.tab === "users"
              ? "Change roles, open profiles, and review prompt history."
              : admin.tab === "teams"
                ? "Create teams, assign leaders, and set shared Cursor / Gemini keys."
                : "Create and manage system roles used during onboarding and user assignment."}
          </p>
        </header>

        <div className="mb-8 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Users</p>
            <p className="mt-2 font-display text-2xl font-semibold text-on-surface">
              {admin.users.length}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Owners / Admins</p>
            <p className="mt-2 font-display text-2xl font-semibold text-on-surface">
              {ownerCount + adminCount}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Teams</p>
            <p className="mt-2 font-display text-2xl font-semibold text-on-surface">
              {admin.loadingTeams && admin.teams.length === 0 ? "…" : admin.teams.length}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Roles</p>
            <p className="mt-2 font-display text-2xl font-semibold text-on-surface">
              {admin.loadingRoles && admin.roles.length === 0 ? "…" : admin.roles.length}
            </p>
          </div>
        </div>

        {admin.error ? (
          <p className="mb-4 rounded-2xl bg-secondary-container px-4 py-3 text-sm text-secondary">
            {admin.error}
          </p>
        ) : null}
        {admin.notice ? (
          <p className="mb-4 rounded-2xl bg-tertiary/10 px-4 py-3 text-sm text-tertiary">
            {admin.notice}
          </p>
        ) : null}

        {admin.tab === "users" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <section className="rounded-3xl bg-surface-container-low p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Input
                  value={admin.query}
                  onChange={(e) => admin.setQuery(e.target.value)}
                  placeholder="Search by name, email, or role…"
                  className="min-w-0 flex-1"
                />
                <Button type="button" variant="secondary" onClick={() => void admin.refreshUsers()}>
                  <LuRefreshCw className="size-4" />
                </Button>
              </div>

              <ul className="space-y-2">
                {admin.filteredUsers.map((user) => {
                  const active = admin.selectedUserId === user.id;
                  return (
                    <li
                      key={user.id}
                      className={[
                        "rounded-2xl bg-surface-container-lowest p-4 transition-all",
                        active ? "shadow-bloom ring-2 ring-primary/25" : "hover:bg-white",
                      ].join(" ")}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => void admin.openUser(user.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-on-surface">
                              {user.name}
                            </p>
                            {user.id === currentUserId ? (
                              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                You
                              </span>
                            ) : null}
                            {(user.role === "owner" || user.role === "admin") && (
                              <span className="rounded-md bg-tertiary/10 px-1.5 py-0.5 text-[10px] font-semibold text-tertiary">
                                {roleLabel(user.role)}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-on-surface-muted">{user.email}</p>
                        </button>
                        <select
                          value={user.role}
                          disabled={admin.savingRoleId === user.id}
                          onChange={(e) => void admin.changeRole(user.id, e.target.value as UserRole)}
                          className="rounded-xl bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          {admin.roleOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </li>
                  );
                })}
                {admin.filteredUsers.length === 0 ? (
                  <li className="rounded-2xl bg-surface-container-lowest px-4 py-10 text-center text-sm text-on-surface-muted">
                    No users match your search.
                  </li>
                ) : null}
              </ul>
            </section>

            <section className="rounded-3xl bg-surface-container-low p-5 sm:p-6">
              {!admin.selectedUserId ? (
                <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-container-lowest text-on-surface-muted shadow-bloom">
                    <LuUsers className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-on-surface">Select a user</p>
                  <p className="mt-1 max-w-xs text-xs text-on-surface-muted">
                    Choose someone on the left to inspect API key status, usage stats, and chat logs.
                  </p>
                </div>
              ) : admin.loadingDetail ? (
                <p className="text-sm text-on-surface-muted">Loading profile and chat list…</p>
              ) : admin.detail ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                          Profile view
                        </p>
                        <h2 className="mt-1 font-display text-xl font-bold text-on-surface">
                          {admin.detail.user.name}
                        </h2>
                        <p className="text-xs text-on-surface-muted">{admin.detail.user.email}</p>
                      </div>
                      <Button type="button" variant="secondary" onClick={admin.closeUser}>
                        Close
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <KeyStatus ok={admin.detail.hasPersonalCursorKey} label="Personal Cursor Key" />
                      <KeyStatus ok={admin.detail.hasPersonalGeminiKey} label="Personal Gemini Key" />
                      {admin.detail.team ? (
                        <span className="rounded-xl bg-surface-container-highest px-2.5 py-1 text-xs text-on-surface">
                          Team: {admin.detail.team.teamName} ({admin.detail.team.teamCode})
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-muted">No active team</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-surface-container-lowest p-4">
                    <p className="text-xs font-semibold text-on-surface">AI API Usage</p>
                    <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <dt className="text-[11px] text-on-surface-muted">Chats</dt>
                        <dd className="mt-0.5 font-display text-lg font-semibold text-on-surface">
                          {admin.detail.usage.conversationCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-on-surface-muted">Prompts</dt>
                        <dd className="mt-0.5 font-display text-lg font-semibold text-on-surface">
                          {admin.detail.usage.promptCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-on-surface-muted">Total Tokens</dt>
                        <dd className="mt-0.5 font-display text-lg font-semibold text-on-surface">
                          {admin.detail.usage.totalTokens.toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-on-surface-muted">Est. Cost</dt>
                        <dd className="mt-0.5 font-display text-lg font-semibold text-tertiary">
                          {admin.detail.usage.totalCost}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-2 font-display text-sm font-semibold text-on-surface">
                      Conversations
                    </h3>
                    {admin.conversations.length === 0 ? (
                      <p className="text-xs text-on-surface-muted">No chat history recorded yet.</p>
                    ) : (
                      <ul className="mb-3 max-h-48 space-y-1.5 overflow-y-auto">
                        {admin.conversations.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => void admin.openConversation(c.id)}
                              className={[
                                "w-full rounded-2xl px-3 py-2.5 text-left transition-colors",
                                admin.selectedConversationId === c.id
                                  ? "bg-surface-container-highest text-on-surface"
                                  : "bg-surface-container-lowest text-on-surface-muted hover:text-on-surface",
                              ].join(" ")}
                            >
                              <span className="block truncate text-sm font-medium">{c.title}</span>
                              <span className="text-[11px] text-on-surface-muted">
                                {new Date(c.updatedAt).toLocaleString()}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {admin.selectedConversationId ? (
                      <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-surface-container-lowest p-4">
                        {admin.loadingMessages ? (
                          <p className="text-xs text-on-surface-muted">Loading messages…</p>
                        ) : admin.messages.length === 0 ? (
                          <p className="text-xs text-on-surface-muted">No messages in this chat.</p>
                        ) : (
                          admin.messages.map((m) => (
                            <div key={m.id} className="space-y-2">
                              <div className="rounded-xl bg-primary/10 px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  User
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-xs text-on-surface">
                                  {m.content}
                                </p>
                              </div>
                              {m.aiFeedback ? (
                                <div className="rounded-xl bg-surface-container-high px-3 py-2.5">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-muted">
                                    Assistant
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap text-xs text-on-surface">
                                    {m.aiFeedback}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-muted">Unable to load user.</p>
              )}
            </section>
          </div>
        ) : admin.tab === "teams" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="rounded-3xl bg-surface-container-low p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-on-surface">Create team</h2>
              <p className="mt-1 mb-5 text-xs text-on-surface-muted">
                The manager becomes team leader and cannot leave the team.
              </p>
              <div className="space-y-3">
                <Input
                  value={admin.teamName}
                  onChange={(e) => admin.setTeamName(e.target.value)}
                  placeholder="Team name"
                />
                <Input
                  value={admin.teamDescription}
                  onChange={(e) => admin.setTeamDescription(e.target.value)}
                  placeholder="Description (optional)"
                />
                <select
                  value={admin.teamManagerId}
                  onChange={(e) => admin.setTeamManagerId(e.target.value)}
                  className="w-full rounded-xl bg-surface-container-lowest px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Team leader: you (default)</option>
                  {admin.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  disabled={admin.creatingTeam || !admin.teamName.trim()}
                  onClick={() => void admin.createTeam()}
                  className="w-full"
                >
                  {admin.creatingTeam ? "Creating…" : "Create team"}
                </Button>
              </div>
            </section>

            <section className="rounded-3xl bg-surface-container-low p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-on-surface">All teams</h2>
                  <p className="text-xs text-on-surface-muted">Join codes and shared API keys</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => void admin.refreshTeams()}>
                  <LuRefreshCw className="size-4" />
                </Button>
              </div>
              {admin.loadingTeams ? (
                <p className="text-sm text-on-surface-muted">Loading teams…</p>
              ) : admin.teams.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-surface-container-lowest px-4 text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-muted">
                    <LuUsersRound className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-on-surface">No teams yet</p>
                  <p className="mt-1 text-xs text-on-surface-muted">
                    Create one to share a join code with members.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {admin.teams.map((team) => (
                    <li key={team.id} className="rounded-2xl bg-surface-container-lowest p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-on-surface">{team.name}</p>
                          <p className="mt-1 text-xs text-on-surface-muted">
                            Leader {team.managerName} · {team.memberCount} members
                          </p>
                          {team.description ? (
                            <p className="mt-1 text-xs text-on-surface-muted">{team.description}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-3">
                            <KeyStatus ok={team.hasCursorApiKey} label="Cursor" />
                            <KeyStatus ok={team.hasGeminiApiKey} label="Gemini" />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-xl bg-primary/10 px-3 py-1.5 font-mono text-xs font-semibold tracking-wider text-primary">
                            {team.code}
                          </span>
                          {admin.editingTeamKeysId === team.id ? null : (
                            <Button
                              type="button"
                              variant="secondary"
                              className="gap-1.5 text-xs"
                              onClick={() => admin.startEditTeamKeys(team.id)}
                            >
                              <LuKeyRound className="size-3.5" />
                              API keys
                            </Button>
                          )}
                        </div>
                      </div>
                      {admin.editingTeamKeysId === team.id ? (
                        <div className="mt-4 space-y-2 rounded-2xl bg-surface-container-low p-3">
                          <Input
                            type="password"
                            value={admin.teamGeminiKey}
                            onChange={(e) => admin.setTeamGeminiKey(e.target.value)}
                            placeholder="Gemini API key (leave blank to keep)"
                          />
                          <Input
                            type="password"
                            value={admin.teamCursorKey}
                            onChange={(e) => admin.setTeamCursorKey(e.target.value)}
                            placeholder="Cursor API key (leave blank to keep)"
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="secondary" onClick={admin.cancelEditTeamKeys}>
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              disabled={admin.savingTeamKeys}
                              onClick={() => void admin.saveTeamKeys()}
                            >
                              {admin.savingTeamKeys ? "Saving…" : "Save keys"}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="rounded-3xl bg-surface-container-low p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-on-surface">
                {admin.editingRoleId ? "Edit role" : "Create role"}
              </h2>
              <p className="mt-1 mb-5 text-xs text-on-surface-muted">
                {admin.editingRoleId
                  ? "Modify existing role details and descriptions."
                  : "Define a new dynamic role for users and onboarding selection."}
              </p>
              <div className="space-y-3">
                <Input
                  value={admin.editingRoleId ? admin.editRoleValue : admin.roleValue}
                  onChange={(e) =>
                    admin.editingRoleId ? admin.setEditRoleValue(e.target.value) : admin.setRoleValue(e.target.value)
                  }
                  disabled={Boolean(
                    admin.editingRoleId &&
                    (admin.editRoleValue === "owner" || admin.editRoleValue === "admin"),
                  )}
                  placeholder="Role identifier (e.g. tech, sales, data-eng)"
                />
                <Input
                  value={admin.editingRoleId ? admin.editRoleLabel : admin.roleLabel}
                  onChange={(e) =>
                    admin.editingRoleId ? admin.setEditRoleLabel(e.target.value) : admin.setRoleLabel(e.target.value)
                  }
                  placeholder="Display label (e.g. Tech Infrastructure)"
                />
                <Input
                  value={admin.editingRoleId ? admin.editRoleHint : admin.roleHint}
                  onChange={(e) =>
                    admin.editingRoleId ? admin.setEditRoleHint(e.target.value) : admin.setRoleHint(e.target.value)
                  }
                  placeholder="Short hint for onboarding (optional)"
                />
                <Input
                  value={admin.editingRoleId ? admin.editRoleDescription : admin.roleDescription}
                  onChange={(e) =>
                    admin.editingRoleId
                      ? admin.setEditRoleDescription(e.target.value)
                      : admin.setRoleDescription(e.target.value)
                  }
                  placeholder="Description & responsibilities (optional)"
                />
                {admin.editingRoleId ? (
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="secondary" onClick={admin.cancelEditRole} className="w-1/2">
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={admin.updatingRole || !admin.editRoleValue.trim() || !admin.editRoleLabel.trim()}
                      onClick={() => void admin.saveRole()}
                      className="w-1/2"
                    >
                      {admin.updatingRole ? "Saving…" : "Update role"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    disabled={admin.creatingRole || !admin.roleValue.trim() || !admin.roleLabel.trim()}
                    onClick={() => void admin.createRole()}
                    className="w-full"
                  >
                    {admin.creatingRole ? "Creating…" : "Create role"}
                  </Button>
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-surface-container-low p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-on-surface">Roles</h2>
                  <p className="text-xs text-on-surface-muted">Dynamic records managed by Admin and Owner accounts</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => void admin.refreshRoles()}>
                  <LuRefreshCw className="size-4" />
                </Button>
              </div>
              {admin.loadingRoles ? (
                <p className="text-sm text-on-surface-muted">Loading roles…</p>
              ) : admin.roles.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-surface-container-lowest px-4 text-center">
                  <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-muted">
                    <LuShield className="size-5" />
                  </span>
                  <p className="text-sm font-medium text-on-surface">No roles yet</p>
                  <p className="mt-1 text-xs text-on-surface-muted">
                    Create your first system role record using the form on the left.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {admin.roles.map((role) => {
                    const isProtected = role.value === "owner" || role.value === "admin";
                    return (
                      <li key={role.id} className="rounded-2xl bg-surface-container-lowest p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-on-surface">{role.label}</p>
                              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                                {role.value}
                              </span>
                              {isProtected ? (
                                <span className="rounded-md bg-tertiary/10 px-2 py-0.5 text-[10px] font-semibold text-tertiary">
                                  System Protected
                                </span>
                              ) : null}
                            </div>
                            {role.hint ? (
                              <p className="mt-1.5 text-xs font-medium text-on-surface-muted">
                                Onboarding Hint: {role.hint}
                              </p>
                            ) : null}
                            {role.description ? (
                              <p className="mt-1 text-xs text-on-surface-muted">{role.description}</p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              className="text-xs"
                              onClick={() => admin.startEditRole(role)}
                            >
                              Edit
                            </Button>
                            {!isProtected ? (
                              <Button
                                type="button"
                                variant="secondary"
                                className="text-xs text-secondary hover:bg-secondary-container/50"
                                disabled={admin.deletingRoleId === role.id}
                                onClick={() => void admin.removeRole(role.id, role.label)}
                              >
                                {admin.deletingRoleId === role.id ? "…" : "Delete"}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

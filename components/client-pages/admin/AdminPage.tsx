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
          <Link
            href="/workspace"
            className="ml-auto rounded-xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-muted"
          >
            Chat
          </Link>
        </div>

        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {admin.tab === "users" ? "Access" : "Organization"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            {admin.tab === "users" ? "People & access" : "Teams & shared keys"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-on-surface-muted">
            {admin.tab === "users"
              ? "Change roles, open profiles, and review prompt history."
              : "Create teams, assign leaders, and set shared Cursor / Gemini keys."}
          </p>
        </header>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
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
                    Open a profile to audit keys, team membership, and prompt history.
                  </p>
                </div>
              ) : admin.loadingDetail ? (
                <p className="text-sm text-on-surface-muted">Loading user…</p>
              ) : admin.detail ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-on-surface">
                        {admin.detail.user.name}
                      </h2>
                      <p className="text-sm text-on-surface-muted">{admin.detail.user.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link href={`/user/${admin.detail.user.id}`}>
                        <Button type="button" variant="primary">
                          Full profile
                        </Button>
                      </Link>
                      <Button type="button" variant="secondary" onClick={admin.closeUser}>
                        Close
                      </Button>
                    </div>
                  </div>

                  {admin.detail.usage ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-surface-container-lowest p-3">
                        <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">
                          Conversations
                        </p>
                        <p className="mt-1 text-sm font-semibold text-on-surface">
                          {admin.detail.usage.conversationCount}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-surface-container-lowest p-3">
                        <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">
                          Tokens
                        </p>
                        <p className="mt-1 text-sm font-semibold text-on-surface">
                          {admin.detail.usage.totalTokens.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-surface-container-lowest p-3">
                        <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">
                          Cost
                        </p>
                        <p className="mt-1 text-sm font-semibold text-on-surface">
                          ${admin.detail.usage.totalCost}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-surface-container-lowest p-4">
                      <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Role</p>
                      <p className="mt-1 text-sm font-medium text-on-surface">
                        {roleLabel(admin.detail.user.role)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-lowest p-4">
                      <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Team</p>
                      <p className="mt-1 text-sm font-medium text-on-surface">
                        {admin.detail.team
                          ? `${admin.detail.team.teamName} · ${admin.detail.team.teamCode}`
                          : "No team"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-lowest p-4">
                      <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">
                        Cursor key
                      </p>
                      <p className="mt-1 text-sm font-medium text-on-surface">
                        {admin.detail.hasPersonalCursorKey ? "Set" : "Not set"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-lowest p-4">
                      <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">
                        Gemini key
                      </p>
                      <p className="mt-1 text-sm font-medium text-on-surface">
                        {admin.detail.hasPersonalGeminiKey ? "Set" : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-on-surface">Prompt history</h3>
                    {admin.conversations.length === 0 ? (
                      <p className="rounded-2xl bg-surface-container-lowest px-4 py-8 text-center text-xs text-on-surface-muted">
                        No conversations for this user.
                      </p>
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
        ) : (
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
        )}
      </main>
    </div>
  );
}

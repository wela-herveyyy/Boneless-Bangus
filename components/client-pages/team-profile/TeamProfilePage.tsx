"use client";

import Link from "next/link";
import { LuArrowLeft, LuKeyRound, LuUsersRound } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { AdminShell } from "@/components/molecules/AdminShell/AdminShell";
import type { TeamDetail } from "@/lib/entities/team.type";
import type { UserRole } from "@/lib/entities/users.type";
import { useTeamProfilePage } from "./teamProfilePage.hooks";

type TeamProfilePageProps = {
  initialDetail: TeamDetail;
  currentUserName?: string | null;
  currentUserRole?: UserRole | string | null;
};

function roleLabel(role: string) {
  if (!role) return "—";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function KeyStatus({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-on-surface-muted">
      <span className={`size-2 rounded-full ${ok ? "bg-tertiary" : "bg-secondary"}`} />
      {label}: {ok ? "Configured" : "Not set"}
    </span>
  );
}

function formatTokens(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-on-surface">{value}</p>
      {hint ? <p className="mt-1 text-xs text-on-surface-muted">{hint}</p> : null}
    </div>
  );
}

export function TeamProfilePage({
  initialDetail,
  currentUserName = "Admin",
  currentUserRole = "admin",
}: TeamProfilePageProps) {
  const team = useTeamProfilePage(initialDetail);
  const { detail } = team;
  const { usage } = detail;

  return (
    <AdminShell
      active="team"
      currentUserName={currentUserName?.trim() || "Admin"}
      currentUserRole={currentUserRole}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/admin?tab=teams"
            className="inline-flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-primary"
          >
            <LuArrowLeft className="size-4" />
            Back to teams
          </Link>
        </div>

        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Team profile</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              {detail.name}
            </h1>
            <p className="mt-1 text-sm text-on-surface-muted">
              Leader {detail.managerName} · {detail.members.length} members
            </p>
            {detail.description ? (
              <p className="mt-2 max-w-2xl text-sm text-on-surface-muted">{detail.description}</p>
            ) : null}
          </div>
          <span className="rounded-xl bg-primary/10 px-4 py-2 font-mono text-sm font-semibold tracking-wider text-primary">
            {detail.code}
          </span>
        </header>

        {team.error ? (
          <p className="mb-4 rounded-2xl bg-secondary-container px-4 py-3 text-sm text-secondary">
            {team.error}
          </p>
        ) : null}
        {team.notice ? (
          <p className="mb-4 rounded-2xl bg-tertiary/10 px-4 py-3 text-sm text-tertiary">{team.notice}</p>
        ) : null}

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-on-surface">Team API usage</h2>
          <p className="mb-3 text-xs text-on-surface-muted">
            Aggregated from all active members&apos; chats (personal, team, and system keys).
          </p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Conversations" value={String(usage.conversationCount)} />
            <StatCard label="Prompts" value={String(usage.promptCount)} />
            <StatCard label="Total tokens" value={formatTokens(usage.totalTokens)} />
            <StatCard label="Est. cost" value={`$${usage.totalCost}`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["personal", "Personal key"],
                ["team", "Team key"],
                ["system", "System key"],
                ["unknown", "Unknown / legacy"],
              ] as const
            ).map(([key, label]) => {
              const bucket = usage.byKeySource[key];
              return (
                <div key={key} className="rounded-2xl bg-surface-container-lowest p-4 shadow-bloom">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-muted">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-on-surface">
                    {formatTokens(bucket.totalTokens)} tokens
                  </p>
                  <p className="mt-1 text-xs text-on-surface-muted">
                    {bucket.promptCount} prompts · ${bucket.totalCost}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8 rounded-3xl bg-surface-container-lowest p-5 shadow-bloom sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-on-surface">Shared API keys</h2>
              <p className="text-xs text-on-surface-muted">
                Members without a personal key use these team keys.
              </p>
            </div>
            {!team.editingKeys ? (
              <Button type="button" variant="secondary" className="gap-1.5" onClick={team.startEditKeys}>
                <LuKeyRound className="size-4" />
                Edit keys
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-4">
            <KeyStatus ok={detail.hasCursorApiKey} label="Cursor" />
            <KeyStatus ok={detail.hasGeminiApiKey} label="Gemini" />
          </div>

          {team.editingKeys ? (
            <div className="mt-4 space-y-3 rounded-2xl bg-surface-container-low p-4">
              <Input
                type="password"
                value={team.geminiKey}
                onChange={(e) => team.setGeminiKey(e.target.value)}
                placeholder="Gemini API key (leave blank to keep)"
              />
              <Input
                type="password"
                value={team.cursorKey}
                onChange={(e) => team.setCursorKey(e.target.value)}
                placeholder="Cursor API key (leave blank to keep)"
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="secondary" onClick={team.cancelEditKeys}>
                  Cancel
                </Button>
                <Button type="button" disabled={team.saving} onClick={() => void team.saveKeys()}>
                  {team.saving ? "Saving…" : "Save keys"}
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl bg-surface-container-low p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-surface-container-lowest text-on-surface-muted shadow-bloom">
              <LuUsersRound className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-on-surface">Members</h2>
              <p className="text-xs text-on-surface-muted">Active team roster</p>
            </div>
          </div>

          {detail.members.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-lowest px-4 py-10 text-center">
              <p className="text-sm font-medium text-on-surface">No active members</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {detail.members.map((member) => (
                <li key={member.userId}>
                  <Link
                    href={`/user/${member.userId}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3 transition-colors hover:bg-white"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-on-surface">{member.name}</p>
                        {member.isManager ? (
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            Leader
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-on-surface-muted">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-on-surface">{roleLabel(member.role)}</p>
                      <p className="text-[11px] text-on-surface-muted">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

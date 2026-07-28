"use client";

import Link from "next/link";
import { LuArrowLeft, LuArchive, LuCrown, LuKeyRound, LuUsersRound } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { AdminShell } from "@/components/molecules/AdminShell/AdminShell";
import { ConfirmModal } from "@/components/molecules/ConfirmModal/ConfirmModal";
import { Modal } from "@/components/molecules/Modal/Modal";
import type { TeamDetail } from "@/lib/entities/team.type";
import type { UserRole, UserSelect } from "@/lib/entities/users.type";
import { useTeamProfilePage } from "./teamProfilePage.hooks";

type TeamProfilePageProps = {
  initialDetail: TeamDetail;
  candidateUsers?: UserSelect[];
  currentUserName?: string | null;
  currentUserRole?: UserRole | string | null;
  currentUserId?: string | null;
  canChangeLeader?: boolean;
  canManageRoster?: boolean;
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
  candidateUsers = [],
  currentUserName = "Admin",
  currentUserRole = "admin",
  currentUserId = null,
  canChangeLeader = false,
  canManageRoster = false,
}: TeamProfilePageProps) {
  const team = useTeamProfilePage(initialDetail, candidateUsers);
  const { detail } = team;
  const { usage } = detail;
  const backHref = canChangeLeader ? "/admin?tab=teams" : "/workspace";
  const backLabel = canChangeLeader ? "Back to teams" : "Back to workspace";

  return (
    <AdminShell
      active="team"
      currentUserName={currentUserName?.trim() || "Admin"}
      currentUserRole={currentUserRole}
      navMode={canChangeLeader ? "full" : "teamLeader"}
    >
      <ConfirmModal
        isOpen={team.confirmModal.isOpen}
        title={team.confirmModal.request?.title ?? ""}
        message={team.confirmModal.request?.message ?? ""}
        confirmLabel={team.confirmModal.request?.confirmLabel}
        cancelLabel={team.confirmModal.request?.cancelLabel}
        confirmVariant={team.confirmModal.request?.confirmVariant}
        tone={team.confirmModal.request?.tone}
        busy={team.confirmModal.busy}
        onCancel={team.confirmModal.cancel}
        onConfirm={() => void team.confirmModal.confirm()}
      />

      <Modal
        isOpen={team.reassignOpen}
        onClose={team.closeReassign}
        title="Reassign team leader"
        description="Pick any user. They’ll join this team if needed; the current leader stays as a member until you archive them."
        footer={
          <>
            <Button type="button" variant="secondary" disabled={team.reassigning} onClick={team.closeReassign}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={team.reassigning || !team.reassignUserId}
              onClick={() => void team.submitReassign()}
            >
              {team.reassigning ? "Reassigning…" : "Reassign leader"}
            </Button>
          </>
        }
      >
        {team.reassignCandidates.length === 0 ? (
          <p className="text-sm text-on-surface-muted">No other users available to become leader.</p>
        ) : (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-on-surface">New leader</span>
            <select
              value={team.reassignUserId}
              onChange={(e) => team.setReassignUserId(e.target.value)}
              className="w-full rounded-xl bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:shadow-[0_0_0_2px_var(--color-primary)]"
            >
              {team.reassignCandidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </label>
        )}
      </Modal>

      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-primary"
          >
            <LuArrowLeft className="size-4" />
            {backLabel}
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
            Usage after each member joined this team (pre-join history is excluded).
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
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-surface-container-lowest text-on-surface-muted shadow-bloom">
                <LuUsersRound className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-on-surface">Members</h2>
                <p className="text-xs text-on-surface-muted">
                  {canManageRoster
                    ? "Archive members or reassign the leader from the roster."
                    : "Active team roster"}
                </p>
              </div>
            </div>
            {canChangeLeader ? (
              <Button type="button" variant="secondary" className="gap-1.5" onClick={team.openReassign}>
                <LuCrown className="size-4" />
                Reassign leader
              </Button>
            ) : null}
          </div>

          {detail.members.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-lowest px-4 py-10 text-center">
              <p className="text-sm font-medium text-on-surface">No active members</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {detail.members.map((member) => {
                const busy = team.busyUserId === member.userId;
                const canArchive = canManageRoster && !member.isManager;
                const canPromote = canChangeLeader && !member.isManager;

                return (
                  <li
                    key={member.userId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3"
                  >
                    <Link
                      href={`/user/${member.userId}`}
                      className="min-w-0 flex-1 transition-colors hover:text-primary"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-on-surface">{member.name}</p>
                        {member.isManager ? (
                          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            Leader
                          </span>
                        ) : null}
                        {currentUserId === member.userId ? (
                          <span className="rounded-md bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold text-on-surface-muted">
                            You
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-on-surface-muted">{member.email}</p>
                      <p className="mt-1 text-[11px] text-on-surface-muted">
                        {roleLabel(member.role)} · Joined{" "}
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </Link>

                    {canArchive || canPromote || (canChangeLeader && member.isManager) ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {canChangeLeader && member.isManager ? (
                          <Button
                            type="button"
                            variant="secondary"
                            className="gap-1.5 px-3 py-2 text-xs"
                            disabled={Boolean(team.busyUserId) || team.reassigning}
                            onClick={team.openReassign}
                          >
                            <LuCrown className="size-3.5" />
                            Reassign
                          </Button>
                        ) : null}
                        {canPromote ? (
                          <Button
                            type="button"
                            variant="secondary"
                            className="gap-1.5 px-3 py-2 text-xs"
                            disabled={busy || Boolean(team.busyUserId)}
                            onClick={() => team.makeLeader(member.userId, member.name)}
                          >
                            <LuCrown className="size-3.5" />
                            {busy ? "Updating…" : "Make leader"}
                          </Button>
                        ) : null}
                        {canArchive ? (
                          <Button
                            type="button"
                            variant="danger"
                            className="gap-1.5 px-3 py-2 text-xs"
                            disabled={busy || Boolean(team.busyUserId)}
                            onClick={() => team.archiveMember(member.userId, member.name)}
                          >
                            <LuArchive className="size-3.5" />
                            {busy ? "Archiving…" : "Archive"}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

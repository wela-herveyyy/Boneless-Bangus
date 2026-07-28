"use client";

import Link from "next/link";
import { LuArrowLeft, LuCoins, LuMessageSquare, LuSparkles } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { AdminShell } from "@/components/molecules/AdminShell/AdminShell";
import { labelApiKeySource, type AiKeySource } from "@/lib/entities/ai.type";
import type { AdminUserDetail, UserRole } from "@/lib/entities/users.type";
import { useUserProfilePage } from "./userProfilePage.hooks";

type UserProfilePageProps = {
  userId: string;
  initialDetail: AdminUserDetail;
  viewerIsAdmin: boolean;
  isSelf: boolean;
  currentUserName?: string | null;
  currentUserRole?: UserRole | string | null;
};

function roleLabel(role: string) {
  if (!role) return "—";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatTokens(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function keySourcesLabel(sources: AiKeySource[]): string {
  if (sources.length === 0) return "Unknown key";
  if (sources.length === 1) return labelApiKeySource(sources[0]);
  return "Mixed keys";
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-bloom">
      <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-on-surface">{value}</p>
      {hint ? <p className="mt-1 text-xs text-on-surface-muted">{hint}</p> : null}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-4">
      <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-on-surface">{value}</p>
    </div>
  );
}

export function UserProfilePage({
  userId,
  initialDetail,
  viewerIsAdmin,
  isSelf,
  currentUserName = "Admin",
  currentUserRole = "admin",
}: UserProfilePageProps) {
  const profile = useUserProfilePage(userId, initialDetail);
  const { detail } = profile;
  const { usage } = detail;

  const content = (
      <div className={viewerIsAdmin ? "mx-auto max-w-5xl" : "mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10"}>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            href={viewerIsAdmin ? "/admin?tab=users" : "/workspace"}
            className="inline-flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-primary"
          >
            <LuArrowLeft className="size-4" />
            {viewerIsAdmin ? "Back to users" : "Back to workspace"}
          </Link>
          {isSelf ? (
            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              Your profile
            </span>
          ) : null}
        </div>

        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">User profile</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              {detail.user.name}
            </h1>
            <p className="mt-1 text-sm text-on-surface-muted">{detail.user.email}</p>
          </div>
          {viewerIsAdmin ? (
            <Link href="/admin?tab=users">
              <Button type="button" variant="secondary">
                Close
              </Button>
            </Link>
          ) : null}
        </header>

        {profile.error ? (
          <p className="mb-4 rounded-2xl bg-secondary-container px-4 py-3 text-sm text-secondary">
            {profile.error}
          </p>
        ) : null}

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-on-surface">Overview</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Conversations"
              value={String(usage.conversationCount)}
              hint="Prompt archives"
            />
            <StatCard
              label="Prompts"
              value={String(usage.promptCount)}
              hint="User turns saved"
            />
            <StatCard
              label="Total tokens"
              value={formatTokens(usage.totalTokens)}
              hint="Input + output"
            />
            <StatCard
              label="Est. cost"
              value={`$${usage.totalCost}`}
              hint="Tracked API spend"
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-on-surface">Profile info</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Role" value={roleLabel(detail.user.role)} />
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <p className="text-[11px] uppercase tracking-wide text-on-surface-muted">Team</p>
              {detail.team && viewerIsAdmin ? (
                <Link
                  href={`/team/${detail.team.teamId}`}
                  className="mt-1 block text-sm font-medium text-primary hover:underline"
                >
                  {detail.team.teamName} · {detail.team.teamCode}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-medium text-on-surface">
                  {detail.team
                    ? `${detail.team.teamName} · ${detail.team.teamCode}`
                    : "No team"}
                </p>
              )}
            </div>
            <InfoCard
              label="Cursor key"
              value={detail.hasPersonalCursorKey ? "Set" : "Not set"}
            />
            <InfoCard
              label="Gemini key"
              value={detail.hasPersonalGeminiKey ? "Set" : "Not set"}
            />
          </div>
          <p className="mt-2 text-xs text-on-surface-muted">
            API key values are hidden. Only presence is shown.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-on-surface">API usage</h2>
          <div className="grid gap-3 rounded-3xl bg-surface-container-low p-5 sm:grid-cols-3">
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <LuSparkles className="size-4" />
                <p className="text-[11px] font-semibold uppercase tracking-wide">Input tokens</p>
              </div>
              <p className="font-display text-xl font-semibold text-on-surface">
                {formatTokens(usage.inputTokens)}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <LuMessageSquare className="size-4" />
                <p className="text-[11px] font-semibold uppercase tracking-wide">Output tokens</p>
              </div>
              <p className="font-display text-xl font-semibold text-on-surface">
                {formatTokens(usage.outputTokens)}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <LuCoins className="size-4" />
                <p className="text-[11px] font-semibold uppercase tracking-wide">Cost</p>
              </div>
              <p className="font-display text-xl font-semibold text-on-surface">
                ${usage.totalCost}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-surface-container-low p-5 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold text-on-surface">
            Prompt history archives
          </h2>
          <p className="mb-5 text-xs text-on-surface-muted">
            Select a conversation to review the full transcript.
          </p>

          {profile.loadingConversations ? (
            <p className="text-sm text-on-surface-muted">Loading archives…</p>
          ) : profile.conversations.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-lowest px-4 py-10 text-center">
              <p className="text-sm font-medium text-on-surface">No prompt history yet</p>
              <p className="mt-1 text-xs text-on-surface-muted">
                Chats from the workspace will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <ul className="max-h-112 space-y-1.5 overflow-y-auto">
                {profile.conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => void profile.openConversation(c.id)}
                      className={[
                        "w-full rounded-2xl px-3 py-2.5 text-left transition-colors",
                        profile.selectedConversationId === c.id
                          ? "bg-surface-container-highest text-on-surface"
                          : "bg-surface-container-lowest text-on-surface-muted hover:text-on-surface",
                      ].join(" ")}
                    >
                      <span className="block truncate text-sm font-medium">{c.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-on-surface-muted">
                        <span>{new Date(c.updatedAt).toLocaleString()}</span>
                        <span aria-hidden>·</span>
                        <span>{formatTokens(c.totalTokens)} tokens</span>
                        <span aria-hidden>·</span>
                        <span>${c.cost}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {c.promptCount} prompt{c.promptCount === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[10px] text-on-surface-muted/80">
                        in {formatTokens(c.inputTokens)} · out {formatTokens(c.outputTokens)} ·{" "}
                        {keySourcesLabel(c.keySources)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="max-h-112 space-y-3 overflow-y-auto rounded-2xl bg-surface-container-lowest p-4">
                {!profile.selectedConversationId ? (
                  <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                    <p className="text-sm font-medium text-on-surface">Select a prompt</p>
                    <p className="mt-1 text-xs text-on-surface-muted">
                      Transcript and token usage per turn will show here.
                    </p>
                  </div>
                ) : profile.loadingMessages ? (
                  <p className="text-xs text-on-surface-muted">Loading messages…</p>
                ) : profile.messages.length === 0 ? (
                  <p className="text-xs text-on-surface-muted">No messages in this chat.</p>
                ) : (
                  profile.messages.map((m) => (
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
                          <p className="mt-2 text-[10px] text-on-surface-muted">
                            {formatTokens(m.inputTokens + m.outputTokens)} tokens · ${m.cost} ·{" "}
                            {labelApiKeySource(m.keySource)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </div>
  );

  if (viewerIsAdmin) {
    return (
      <AdminShell
        active="user"
        currentUserName={currentUserName?.trim() || "Admin"}
        currentUserRole={currentUserRole}
      >
        {content}
      </AdminShell>
    );
  }

  return <div className="min-h-screen bg-surface">{content}</div>;
}

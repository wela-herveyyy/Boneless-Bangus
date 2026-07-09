"use client";

import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import type { OnboardingProfile } from "@/components/organisms/OnboardingPanel/onboardingPanel.hooks";
import { getFocusLabel, getTeamLabel } from "./workspaceChat.hooks";

type WorkspaceChatProps = {
  userEmail: string;
  displayName: string;
  profile: OnboardingProfile | null;
  loading: boolean;
  sidebarOpen: boolean;
};

export function WorkspaceChat({
  userEmail,
  displayName,
  profile,
  loading,
  sidebarOpen,
}: WorkspaceChatProps) {
  const firstName = displayName.split(" ")[0];

  return (
    <div
      className={[
        "relative z-10 flex min-h-screen items-center justify-center px-6 py-12 transition-[margin] duration-300 ease-out",
        sidebarOpen ? "ml-72" : "ml-0",
      ].join(" ")}
    >
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-secondary">
            Livro Systems Inc.
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl">
            {loading ? "Hi…" : `Hi, ${firstName}.`}
          </h1>
          <p className="text-base leading-relaxed text-on-surface-muted">
            Ask about tasks, bugs, or school setup — BBAI answers from {userEmail} and your
            permissions.
          </p>
          {profile ? (
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-surface-container-low px-4 py-2 text-sm text-on-surface">
                {getTeamLabel(profile.team)}
              </span>
              <span className="rounded-full bg-surface-container-low px-4 py-2 text-sm text-on-surface">
                {getFocusLabel(profile.focus)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-bloom sm:p-8">
          <label className="block space-y-3">
            <span className="text-sm font-medium text-on-surface">Ask BBAI</span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="text"
                placeholder="e.g. What tasks are overdue?"
                aria-label="Ask BBAI"
                className="sm:flex-1"
              />
              <Button type="button" disabled className="sm:shrink-0">
                Send
              </Button>
            </div>
          </label>
          <p className="mt-3 text-xs text-on-surface-muted">
            Chat is coming soon — use the prompts below to explore what BBAI will handle.
          </p>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceChatFallback({ sidebarOpen = true }: { sidebarOpen?: boolean }) {
  return (
    <div
      className={[
        "relative z-10 flex min-h-screen items-center justify-center px-6 py-12",
        sidebarOpen ? "ml-72" : "ml-0",
      ].join(" ")}
    >
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-4">
          <div className="h-4 w-40 animate-pulse rounded bg-surface-container-low" />
          <div className="h-12 w-48 animate-pulse rounded-lg bg-surface-container-low" />
          <div className="h-5 w-full animate-pulse rounded bg-surface-container-low" />
        </div>
        <div className="h-36 animate-pulse rounded-2xl bg-surface-container-low" />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import type { OnboardingProfile } from "@/components/organisms/OnboardingPanel/onboardingPanel.hooks";
import { getFocusLabel, getTeamLabel, useWorkspaceChat } from "./workspaceChat.hooks";

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
  const chat = useWorkspaceChat({
    name: profile?.name || displayName,
    email: userEmail,
  });
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.turns, chat.sending]);

  const composer = (
    <form onSubmit={chat.send} className="rounded-2xl bg-surface-container-lowest p-4 shadow-bloom sm:p-5">
      <label className="block space-y-3">
        <span className="sr-only">Ask BBAI</span>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            placeholder="e.g. What tasks are overdue?"
            aria-label="Ask BBAI"
            className="sm:flex-1"
            value={chat.message}
            onChange={(event) => chat.setMessage(event.target.value)}
            disabled={chat.sending}
          />
          <Button
            type="submit"
            disabled={chat.sending || !chat.message.trim()}
            className="sm:shrink-0"
          >
            {chat.sending ? "Thinking…" : "Send"}
          </Button>
        </div>
      </label>
      {chat.error ? (
        <p className="mt-3 text-sm text-secondary" role="alert">
          {chat.error}
        </p>
      ) : null}
    </form>
  );

  if (chat.hasChat) {
    return (
      <div
        className={[
          "relative z-10 flex h-screen flex-col px-6 py-6 transition-[margin] duration-300 ease-out chat-layout-in",
          sidebarOpen ? "ml-72" : "ml-0",
        ].join(" ")}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
          <p className="mb-4 shrink-0 text-xs font-medium uppercase tracking-[0.25em] text-secondary">
            BBAI · {firstName}
          </p>

          <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
            {chat.turns.map((turn) => (
              <div
                key={turn.id}
                className={[
                  "flex",
                  turn.role === "user"
                    ? "chat-bubble-user justify-end"
                    : "chat-bubble-assistant justify-start",
                ].join(" ")}
              >
                <div
                  className={[
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    turn.role === "user"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface shadow-bloom",
                  ].join(" ")}
                >
                  {turn.text}
                </div>
              </div>
            ))}

            {chat.sending ? (
              <div className="chat-bubble-assistant flex justify-start">
                <div className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-muted shadow-bloom">
                  <span className="inline-flex gap-1.5">
                    <span className="chat-dot">●</span>
                    <span className="chat-dot">●</span>
                    <span className="chat-dot">●</span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="chat-composer-in shrink-0 pt-2">{composer}</div>
        </div>
      </div>
    );
  }

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

        {composer}
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

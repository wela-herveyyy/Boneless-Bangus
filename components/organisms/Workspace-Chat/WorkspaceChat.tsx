"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { ChatMarkdown } from "@/components/atoms/ChatMarkdown/ChatMarkdown";
import { Input } from "@/components/atoms/Input/Input";
import type { OnboardingProfile } from "@/components/organisms/OnboardingPanel/onboardingPanel.hooks";
import {
  getFocusLabel,
  getTeamLabel,
  AI_ROUTE_OPTIONS,
  useWorkspaceChat,
  type AiRouteId,
} from "./workspaceChat.hooks";

function AiRouteMenu({
  value,
  onChange,
  disabled,
}: {
  value: AiRouteId;
  onChange: (id: AiRouteId) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = AI_ROUTE_OPTIONS.find((option) => option.id === value) ?? AI_ROUTE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="AI model"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-2.5 text-left transition-colors hover:bg-surface-container-high disabled:opacity-60"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-on-surface">{selected.label}</span>
          <span className="block truncate text-xs text-on-surface-muted">{selected.hint}</span>
        </span>
        <span
          aria-hidden
          className={[
            "text-on-surface-muted transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          ▾
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="AI model"
          className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl bg-surface-container-lowest py-1 shadow-bloom"
        >
          {AI_ROUTE_OPTIONS.map((option) => {
            const active = option.id === value;
            return (
              <li key={option.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={[
                    "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors",
                    active
                      ? "bg-surface-container-low text-on-surface"
                      : "text-on-surface hover:bg-surface-container-low",
                  ].join(" ")}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-on-surface-muted">{option.hint}</span>
                  </span>
                  {active ? (
                    <span className="text-xs font-medium text-primary" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

type WorkspaceChatProps = {
  userEmail: string;
  displayName: string;
  profile: OnboardingProfile | null;
  loading: boolean;
  sidebarOpen: boolean;
  activeChatId?: string | null;
  onConversationSaved?: (dbConversationId: string) => void;
};

export function WorkspaceChat({
  userEmail,
  displayName,
  profile,
  loading,
  sidebarOpen,
  activeChatId = null,
  onConversationSaved,
}: WorkspaceChatProps) {
  const firstName = displayName.split(" ")[0];
  const chat = useWorkspaceChat(
    {
      name: profile?.name || displayName,
      email: userEmail,
    },
    { activeChatId, onConversationSaved },
  );
  const threadRef = useRef<HTMLDivElement>(null);
  const routeLabel =
    AI_ROUTE_OPTIONS.find((option) => option.id === chat.routeId)?.label ?? "AI";

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.historyEpoch]);

  useEffect(() => {
    if (!chat.sending && !chat.streamingAssistantId && !chat.thinkingText) return;
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.turns, chat.sending, chat.streamingAssistantId, chat.thinkingText]);

  const composer = (
    <form onSubmit={chat.send} className="rounded-2xl bg-surface-container-lowest p-4 shadow-bloom sm:p-5">
      <div className="mb-3">
        <AiRouteMenu value={chat.routeId} onChange={chat.setRoute} disabled={chat.sending} />
      </div>
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
            BBAI · {firstName} · {routeLabel}
          </p>

          <div
            ref={threadRef}
            className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden pb-4"
            onScroll={(event) => {
              if (event.currentTarget.scrollTop > 48) return;
              void chat.loadOlder(event.currentTarget);
            }}
          >
            {chat.loadingOlder ? (
              <p className="text-center text-xs text-on-surface-muted">Loading earlier…</p>
            ) : null}
            {chat.turns.map((turn) => (
              <Fragment key={turn.id}>
                {turn.id === chat.streamingAssistantId && chat.thinkingText ? (
                  <div className="chat-bubble-assistant flex justify-start">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-surface-container px-4 py-3 text-xs leading-relaxed text-on-surface-muted">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em]">
                        Thinking
                      </p>
                      {chat.thinkingText}
                    </div>
                  </div>
                ) : null}
                <div
                  className={[
                    "flex",
                    turn.role === "user"
                      ? "chat-bubble-user justify-end"
                      : "chat-bubble-assistant justify-start",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      turn.role === "user"
                        ? "whitespace-pre-wrap bg-primary text-on-primary"
                        : "bg-surface-container-lowest text-on-surface shadow-bloom",
                    ].join(" ")}
                  >
                    {turn.text ? (
                      turn.role === "assistant" ? (
                        <ChatMarkdown content={turn.text} />
                      ) : (
                        turn.text
                      )
                    ) : turn.id === chat.streamingAssistantId ? (
                      <span className="inline-flex gap-1.5 text-on-surface-muted">
                        <span className="chat-dot">●</span>
                        <span className="chat-dot">●</span>
                        <span className="chat-dot">●</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </Fragment>
            ))}

            {chat.sending && !chat.streamingAssistantId && !chat.thinkingText ? (
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

"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { LuMoveVertical, LuPanelRightClose } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { ChatMarkdown } from "@/components/atoms/ChatMarkdown/ChatMarkdown";
import { Input } from "@/components/atoms/Input/Input";
import { AddSkillModal } from "@/components/molecules/AddSkillModal/AddSkillModal";
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
  const [showRightTriggers, setShowRightTriggers] = useState(false);
  const [executingConfirmations, setExecutingConfirmations] = useState(false);
  
  const routeLabel =
    AI_ROUTE_OPTIONS.find((option) => option.id === chat.routeId)?.label ?? "AI";

  useEffect(() => {
    const hideTriggers = !showRightTriggers;
    document.body.classList.toggle("hide-right-triggers", hideTriggers);
    return () => {
      document.body.classList.remove("hide-right-triggers");
    };
  }, [chat.hasChat, showRightTriggers]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [chat.historyEpoch]);

  useEffect(() => {
    if (!chat.sending && !chat.streamingAssistantId && !chat.thinkingText) return;
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.turns, chat.sending, chat.streamingAssistantId, chat.thinkingText]);

  const composer = (
    <form onSubmit={chat.send} className="rounded-2xl bg-surface-container-lowest p-4 shadow-bloom sm:p-5">
      <div className="mb-3">
        <AiRouteMenu value={chat.routeId} onChange={chat.setRoute} disabled={chat.sending || chat.loadingThread} />
      </div>
      <label className="block space-y-3">
        <span className="sr-only">Ask BBAI</span>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:flex-1">
            {chat.showCommandMenu && chat.filteredCommands.length > 0 && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-xl bg-surface-container-lowest py-2 shadow-bloom border border-surface-container-high/50 max-h-60 overflow-y-auto bbai-scroll">
                {chat.filteredCommands.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => chat.handleCommandSelect(cmd)}
                    className={[
                      "w-full text-left px-4 py-2 hover:bg-surface-container-low transition-colors flex items-center justify-between group",
                      i === chat.selectedCommandIndex ? "bg-surface-container-low" : ""
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">{cmd.id}</span>
                      <span className="text-xs text-on-surface-muted truncate">{cmd.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="relative flex w-full items-center gap-2 rounded-xl bg-surface-container-low px-2 py-1 transition-colors input-glow focus-within:bg-surface-container-lowest">
              {chat.activeCommand && (
                <span className="shrink-0 flex items-center gap-1.5 rounded bg-primary/20 px-2 py-1 text-xs font-semibold text-primary">
                  {chat.activeCommand.id}
                  <button 
                    type="button" 
                    onClick={() => chat.setActiveCommand(null)} 
                    className="flex size-4 items-center justify-center rounded-full hover:bg-primary/20 hover:text-primary-variant transition-colors"
                    aria-label="Remove command"
                  >
                    &times;
                  </button>
                </span>
              )}
              <input
                type="text"
                placeholder={chat.activeCommand ? "Add additional context..." : "e.g. What tasks are overdue?"}
                aria-label="Ask BBAI"
                className="w-full bg-transparent px-2 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-muted"
                value={chat.message}
                onChange={(event) => chat.setMessage(event.target.value)}
                onKeyDown={chat.handleCommandKeyDown}
                disabled={chat.sending || chat.loadingThread}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={chat.sending || chat.loadingThread || (!chat.message.trim() && !chat.activeCommand)}
            className="sm:shrink-0"
          >
            {chat.sending ? "Thinking…" : chat.loadingThread ? "Loading…" : "Send"}
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

  const rightSidebarToggles = (
    <>
      <button
        type="button"
        onClick={() => setShowRightTriggers(true)}
        className={[
          "fixed right-4 top-1/2 -translate-y-1/2 z-40 flex size-10 items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface-muted shadow-bloom hover:text-primary",
          showRightTriggers
            ? "pointer-events-none opacity-0 translate-x-4 transition-all duration-200"
            : "pointer-events-auto opacity-100 translate-x-0 transition-all duration-300 delay-150"
        ].join(" ")}
        aria-label="Show tools"
      >
        <LuMoveVertical className="size-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => setShowRightTriggers(false)}
        className={[
          "right-sidebar-trigger fixed right-0 z-120 flex size-10 -translate-y-1/2 items-center justify-center",
          "bg-surface-container-highest text-primary shadow-bloom ghost-border hover:bg-primary hover:text-on-primary",
          "transition-[right,top,background-color,color] duration-380 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "md:hidden!"
        ].join(" ")}
        aria-label="Hide tools"
        style={{ top: "calc(50% + 12.25rem)" }}
      >
        <LuPanelRightClose className="size-5" aria-hidden />
      </button>
    </>
  );

  if (chat.hasChat) {
    return (
      <div
        className={[
          "relative z-10 flex h-screen flex-col overflow-hidden px-6 py-6 transition-[margin] duration-300 ease-out",
          sidebarOpen ? "md:ml-72 ml-0" : "ml-0",
        ].join(" ")}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
          <p className="mb-4 shrink-0 text-xs font-medium uppercase tracking-[0.25em] text-secondary">
            BBAI · {firstName} · {routeLabel}
          </p>

          <div
            key={activeChatId ?? chat.dbConversationId ?? "thread"}
            ref={threadRef}
            className="bbai-scroll chat-thread-in min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden pb-4 pt-12"
            onScroll={(event) => {
              if (event.currentTarget.scrollTop > 48) return;
              void chat.loadOlder(event.currentTarget);
            }}
          >
            {chat.loadingThread && chat.turns.length === 0 ? (
              <div className="space-y-4" aria-busy="true" aria-label="Loading chat">
                <div className="flex justify-end">
                  <div className="h-10 w-2/5 animate-pulse rounded-2xl bg-surface-container-low" />
                </div>
                <div className="flex justify-start">
                  <div className="h-24 w-3/4 animate-pulse rounded-2xl bg-surface-container-low" />
                </div>
                <div className="flex justify-end">
                  <div className="h-10 w-1/3 animate-pulse rounded-2xl bg-surface-container-low" />
                </div>
                <div className="flex justify-start">
                  <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-surface-container-low" />
                </div>
              </div>
            ) : null}

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
        {rightSidebarToggles}

        {(() => {
          const draftSkillConf = chat.pendingConfirmations.find(c => c.slug === "skills" && c.toolName === "create_skill");
          const otherConfs = chat.pendingConfirmations.filter(c => c !== draftSkillConf);
          
          return (
            <>
              {draftSkillConf && (
                <AddSkillModal
                  isOpen={true}
                  onClose={() => {
                    chat.setPendingConfirmations(otherConfs);
                    chat.setTurns((prev) => [
                      ...prev,
                      { id: `sys-${Date.now()}`, role: "assistant", text: "> ❌ Action cancelled by user." },
                    ]);
                  }}
                  newSkillForm={{
                    name: draftSkillConf.args?.name || "",
                    description: draftSkillConf.args?.description || "",
                    instructions: draftSkillConf.args?.instructions || "",
                    category: draftSkillConf.args?.categoryName || "Agent Skills",
                    isGlobal: draftSkillConf.args?.isGlobal ?? false,
                  }}
                  setNewSkillForm={(form) => {
                    const updated = [...chat.pendingConfirmations];
                    const idx = updated.indexOf(draftSkillConf);
                    updated[idx] = { 
                      ...draftSkillConf, 
                      args: {
                        name: form.name,
                        description: form.description,
                        instructions: form.instructions,
                        category: form.category,
                        isGlobal: form.isGlobal
                      }
                    };
                    chat.setPendingConfirmations(updated);
                  }}
                  disabled={executingConfirmations}
                  onSubmit={async () => {
                    setExecutingConfirmations(true);
                    let allOk = true;
                    try {
                      const res = await fetch("/api/ai/execute", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ toolName: draftSkillConf.toolName, args: draftSkillConf.args }),
                      });
                      const data = await res.json();
                      if (!data.ok) allOk = false;
                    } catch {
                      allOk = false;
                    }
                    setExecutingConfirmations(false);
                    chat.setPendingConfirmations(otherConfs);
                    chat.setTurns((prev) => [
                      ...prev,
                      {
                        id: `sys-${Date.now()}`,
                        role: "assistant",
                        text: allOk ? "> ✅ Skill created successfully!" : "> ⚠️ Failed to create skill.",
                      },
                    ]);
                  }}
                />
              )}

              {otherConfs.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-bloom">
              <h3 className="mb-2 text-lg font-semibold text-on-surface">Confirm Actions</h3>
              <p className="mb-4 text-sm text-on-surface-muted">
                The AI wants to perform the following actions on your Google Workspace account:
              </p>
              <div className="mb-6 max-h-60 overflow-y-auto rounded-xl bg-surface-container-low p-3 text-sm text-on-surface bbai-scroll">
                {chat.pendingConfirmations.map((conf, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <strong className="text-primary">{conf.toolName}</strong>
                    <pre className="mt-1 overflow-x-auto text-[11px] text-on-surface-muted">
                      {JSON.stringify(conf.args, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  disabled={executingConfirmations}
                  onClick={() => {
                    chat.setPendingConfirmations([]);
                    chat.setTurns((prev) => [
                      ...prev,
                      { id: `sys-${Date.now()}`, role: "assistant", text: "> ❌ Action cancelled by user." },
                    ]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={executingConfirmations}
                  onClick={async () => {
                    setExecutingConfirmations(true);
                    let allOk = true;
                    for (const conf of chat.pendingConfirmations) {
                      try {
                        const res = await fetch("/api/ai/execute", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ toolName: conf.toolName, args: conf.args }),
                        });
                        const data = await res.json();
                        if (!data.ok) allOk = false;
                      } catch {
                        allOk = false;
                      }
                    }
                    setExecutingConfirmations(false);
                    chat.setPendingConfirmations([]);
                    chat.setTurns((prev) => [
                      ...prev,
                      {
                        id: `sys-${Date.now()}`,
                        role: "assistant",
                        text: allOk ? "> ✅ All actions executed successfully." : "> ⚠️ Some actions failed.",
                      },
                    ]);
                  }}
                >
                  {executingConfirmations ? "Executing..." : "Confirm & Execute"}
                </Button>
              </div>
            </div>
          </div>
        )}
        </>
      );
    })()}
      </div>
    );
  }

  return (
    <div
      className={[
        "relative z-10 flex min-h-screen items-center justify-center px-6 py-12 transition-[margin] duration-300 ease-out",
        sidebarOpen ? "md:ml-72 ml-0" : "ml-0",
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

      {rightSidebarToggles}
    </div>
  );
}

export function WorkspaceChatFallback({ sidebarOpen = true }: { sidebarOpen?: boolean }) {
  return (
    <div
      className={[
        "relative z-10 flex min-h-screen items-center justify-center px-6 py-12",
        sidebarOpen ? "md:ml-72 ml-0" : "ml-0",
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

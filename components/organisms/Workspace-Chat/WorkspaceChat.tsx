"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  LuArrowUp,
  LuCheck,
  LuChevronDown,
  LuKeyRound,
  LuLayers2,
  LuLoaderCircle,
  LuPaperclip,
  LuX,
} from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { ChatMarkdown } from "@/components/atoms/ChatMarkdown/ChatMarkdown";
import { AddSkillModal } from "@/components/molecules/AddSkillModal/AddSkillModal";
import type { OnboardingProfile } from "@/components/organisms/OnboardingPanel/onboardingPanel.hooks";
import { OutputInteractive } from "@/components/organisms/OutputInteractive/OutputInteractive";
import {
  clearPendingOutputTarget,
  dispatchOutputTarget,
} from "@/components/organisms/OutputInteractive/outputInteractive.hooks";
import type { AiKeySource } from "@/lib/entities/ai.type";
import {
  getOutputCanvasByConversationAction,
  upsertOutputCanvasAction,
} from "@/lib/domain/actions/output_canvas.actions";
import {
  FRAPPE_TOOL_MODE,
  FRAPPE_TOOL_OPTIONS,
  parseOutputMarker,
  type FrappeOutputTarget,
  type FrappeToolMode,
} from "@/lib/entities/frappe_output.type";
import {
  frappeToolModeFromKind,
  type OutputCanvasItem,
} from "@/lib/entities/output_canvas.type";
import { notifySkillsChanged } from "@/lib/utils/skills-events";
import {
  getFocusLabel,
  getRoleLabel,
  AI_ROUTE_OPTIONS,
  isKeySourceAvailable,
  useWorkspaceChat,
  type AiRouteId,
  type WorkspaceChatApiKeys,
} from "./workspaceChat.hooks";

function stripOutputMarker(text: string): string {
  return text.replace(/<!--\s*bbai:output[\s\S]*?-->/g, "").trim();
}

const KEY_SOURCE_OPTIONS: {
  id: AiKeySource;
  label: string;
  hint: string;
}[] = [
  { id: "personal", label: "Personal", hint: "Your own API key" },
  { id: "team", label: "Team", hint: "Shared team key" },
  { id: "system", label: "System", hint: "Platform default" },
];

function useMenuDismiss(
  open: boolean,
  setOpen: (open: boolean) => void,
  rootRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
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
  }, [open, setOpen, rootRef]);
}

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
  useMenuDismiss(open, setOpen, rootRef);

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="AI model"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "group inline-flex max-w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left",
          "bg-surface-container-low/80 transition-colors duration-200",
          "hover:bg-surface-container-high disabled:opacity-50",
          open ? "bg-surface-container-high" : "",
        ].join(" ")}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[11px] font-semibold tracking-wide text-primary">
          {selected.label.slice(0, 1)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold leading-tight text-on-surface">
            {selected.label}
          </span>
          <span className="block truncate text-[11px] leading-tight text-on-surface-muted">
            {selected.hint}
          </span>
        </span>
        <LuChevronDown
          aria-hidden
          className={[
            "size-4 shrink-0 text-on-surface-muted transition-transform duration-200 group-hover:text-on-surface",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="AI model"
          className="absolute bottom-full left-0 z-50 mb-2 min-w-56 overflow-hidden rounded-2xl bg-surface-container-lowest py-1.5 shadow-bloom ghost-border"
        >
          {AI_ROUTE_OPTIONS.map((option) => {
            const active = option.id === value;
            return (
              <li key={option.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    active ? "bg-primary/8" : "hover:bg-surface-container-low",
                  ].join(" ")}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <span
                    className={[
                      "flex size-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold",
                      active
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-primary",
                    ].join(" ")}
                  >
                    {option.label.slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-on-surface">{option.label}</span>
                    <span className="block text-xs text-on-surface-muted">{option.hint}</span>
                  </span>
                  {active ? <LuCheck className="size-4 shrink-0 text-primary" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function ToolsPanelMenu({
  value,
  onChange,
  disabled,
}: {
  value: FrappeToolMode;
  onChange: (id: FrappeToolMode) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    FRAPPE_TOOL_OPTIONS.find((option) => option.id === value) ?? FRAPPE_TOOL_OPTIONS[0];
  const toolActive = value !== FRAPPE_TOOL_MODE.OFF;
  useMenuDismiss(open, setOpen, rootRef);

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Frappe tools"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "inline-flex items-center gap-1.5 rounded-2xl px-3 py-2",
          "bg-surface-container-low/80 text-xs font-medium text-on-surface",
          "transition-colors duration-200 hover:bg-surface-container-high disabled:opacity-50",
          open || toolActive ? "bg-surface-container-high" : "",
        ].join(" ")}
      >
        <LuLayers2
          className={[
            "size-3.5 shrink-0",
            toolActive ? "text-primary" : "text-on-surface-muted",
          ].join(" ")}
          aria-hidden
        />
        <span>{toolActive ? selected.label : "Tools"}</span>
        <LuChevronDown
          aria-hidden
          className={[
            "size-3.5 shrink-0 text-on-surface-muted transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Frappe tools"
          className="absolute bottom-full left-0 z-50 mb-2 min-w-56 overflow-hidden rounded-2xl bg-surface-container-lowest py-1.5 shadow-bloom ghost-border"
        >
          {FRAPPE_TOOL_OPTIONS.map((option) => {
            const active = option.id === value;
            return (
              <li key={option.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    active ? "bg-primary/8" : "hover:bg-surface-container-low",
                  ].join(" ")}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-on-surface">{option.label}</span>
                    <span className="block text-xs text-on-surface-muted">{option.hint}</span>
                  </span>
                  {active ? <LuCheck className="size-4 shrink-0 text-primary" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function KeySourceMenu({
  value,
  onChange,
  provider,
  apiKeys,
  disabled,
}: {
  value: AiKeySource;
  onChange: (source: AiKeySource) => void;
  provider: ReturnType<typeof useWorkspaceChat>["provider"];
  apiKeys?: WorkspaceChatApiKeys;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = KEY_SOURCE_OPTIONS.find((option) => option.id === value) ?? KEY_SOURCE_OPTIONS[2];
  useMenuDismiss(open, setOpen, rootRef);

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="API key source"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "inline-flex items-center gap-1.5 rounded-2xl px-3 py-2",
          "bg-surface-container-low/80 text-xs font-medium text-on-surface",
          "transition-colors duration-200 hover:bg-surface-container-high disabled:opacity-50",
          open ? "bg-surface-container-high" : "",
        ].join(" ")}
      >
        <LuKeyRound className="size-3.5 shrink-0 text-primary" aria-hidden />
        <span>{selected.label}</span>
        <LuChevronDown
          aria-hidden
          className={[
            "size-3.5 shrink-0 text-on-surface-muted transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="API key source"
          className="absolute bottom-full left-0 z-50 mb-2 min-w-52 overflow-hidden rounded-2xl bg-surface-container-lowest py-1.5 shadow-bloom ghost-border"
        >
          {KEY_SOURCE_OPTIONS.map((option) => {
            const available = isKeySourceAvailable(option.id, provider, apiKeys);
            const active = option.id === value;
            return (
              <li
                key={option.id}
                role="option"
                aria-selected={active}
                aria-disabled={!available}
              >
                <button
                  type="button"
                  disabled={!available}
                  className={[
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    active ? "bg-primary/8" : "hover:bg-surface-container-low",
                    !available ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
                  ].join(" ")}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-on-surface">{option.label}</span>
                    <span className="block text-xs text-on-surface-muted">
                      {available ? option.hint : "Not configured"}
                    </span>
                  </span>
                  {active ? <LuCheck className="size-4 shrink-0 text-primary" aria-hidden /> : null}
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
  apiKeys?: WorkspaceChatApiKeys;
  /** Frappe Tools mode — chat generates; Output only displays. */
  frappeTool?: FrappeToolMode;
  onFrappeToolChange?: (mode: FrappeToolMode) => void;
  onStartNewChat?: () => void;
  pendingCanvas?: OutputCanvasItem | null;
  onPendingCanvasConsumed?: () => void;
  onCanvasSaved?: () => void;
};

export function WorkspaceChat({
  userEmail,
  displayName,
  profile,
  loading,
  sidebarOpen,
  activeChatId = null,
  onConversationSaved,
  apiKeys,
  frappeTool = FRAPPE_TOOL_MODE.OFF,
  onFrappeToolChange,
  onStartNewChat,
  pendingCanvas = null,
  onPendingCanvasConsumed,
  onCanvasSaved,
}: WorkspaceChatProps) {
  const firstName = displayName.split(" ")[0];
  const outputOpen = frappeTool !== FRAPPE_TOOL_MODE.OFF;
  const toolLabel =
    FRAPPE_TOOL_OPTIONS.find((o) => o.id === frappeTool)?.label ?? "Output";
  const chat = useWorkspaceChat(
    {
      name: profile?.name || displayName,
      email: userEmail,
    },
    { activeChatId, onConversationSaved, apiKeys, frappeTool },
  );
  const threadRef = useRef<HTMLDivElement>(null);
  const [executingConfirmations, setExecutingConfirmations] = useState(false);
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const lastTargetRef = useRef<FrappeOutputTarget | null>(null);
  const lastUpsertKeyRef = useRef<string>("");

  const routeLabel =
    AI_ROUTE_OPTIONS.find((option) => option.id === chat.routeId)?.label ?? "AI";

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [chat.historyEpoch]);

  useEffect(() => {
    if (!chat.sending && !chat.streamingAssistantId && !chat.thinkingText) return;
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.turns, chat.sending, chat.streamingAssistantId, chat.thinkingText]);

  const persistCanvas = useCallback(
    async (conversationId: string, target: FrappeOutputTarget) => {
      const toolMode = frappeTool !== FRAPPE_TOOL_MODE.OFF
        ? frappeTool
        : frappeToolModeFromKind(target.kind);
      if (toolMode === FRAPPE_TOOL_MODE.OFF) return;

      const key = `${conversationId}|${JSON.stringify(target)}`;
      if (key === lastUpsertKeyRef.current) return;
      lastUpsertKeyRef.current = key;

      const result = await upsertOutputCanvasAction({
        conversationId,
        toolMode,
        target,
      });
      if (result.ok) {
        setCanvasId(result.data.id);
        onCanvasSaved?.();
      }
    },
    [frappeTool, onCanvasSaved],
  );

  // Stream Frappe outputs from assistant markers into Output + bind 1 canvas / convo
  useEffect(() => {
    if (!outputOpen) return;
    const lastAssistant = [...chat.turns].reverse().find((t) => t.role === "assistant" && t.text);
    if (!lastAssistant?.text) return;
    const target = parseOutputMarker(lastAssistant.text);
    if (!target) return;
    lastTargetRef.current = target;
    dispatchOutputTarget(target);
    const conversationId = chat.dbConversationId || activeChatId;
    if (conversationId) void persistCanvas(conversationId, target);
  }, [chat.turns, outputOpen, chat.dbConversationId, activeChatId, persistCanvas]);

  // Conversation just saved — attach pending target to the new canvas id
  useEffect(() => {
    const conversationId = chat.dbConversationId;
    const target = lastTargetRef.current;
    if (!conversationId || !target || !outputOpen) return;
    void persistCanvas(conversationId, target);
  }, [chat.dbConversationId, outputOpen, persistCanvas]);

  // Open canvas from sidebar list (pinpoint)
  useEffect(() => {
    if (!pendingCanvas) return;
    if (activeChatId !== pendingCanvas.conversationId) return;
    if (chat.loadingThread) return;
    lastTargetRef.current = pendingCanvas.target;
    setCanvasId(pendingCanvas.id);
    dispatchOutputTarget(pendingCanvas.target);
    onPendingCanvasConsumed?.();
  }, [
    pendingCanvas,
    activeChatId,
    chat.loadingThread,
    chat.historyEpoch,
    onPendingCanvasConsumed,
  ]);

  // Load canvas id for the active chat; restore Output only if that tool is already on
  useEffect(() => {
    if (!activeChatId || pendingCanvas) return;
    let cancelled = false;
    void (async () => {
      const result = await getOutputCanvasByConversationAction(activeChatId);
      if (cancelled) return;
      if (!result.ok || !result.data) {
        setCanvasId(null);
        return;
      }
      setCanvasId(result.data.id);
      lastTargetRef.current = result.data.target;
      if (frappeTool === result.data.toolMode) {
        dispatchOutputTarget(result.data.target);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeChatId, pendingCanvas, frappeTool]);

  const handleFrappeToolChange = (next: FrappeToolMode) => {
    if (next === frappeTool) return;
    // Changing Tools always starts a fresh conversation (1 canvas per convo).
    if (chat.hasChat || activeChatId) {
      onStartNewChat?.();
      chat.resetConversation();
    }
    clearPendingOutputTarget();
    lastTargetRef.current = null;
    lastUpsertKeyRef.current = "";
    setCanvasId(null);
    onFrappeToolChange?.(next);
  };

  const canSend =
    !chat.sending &&
    !chat.loadingThread &&
    Boolean(chat.message.trim() || chat.activeCommand || (chat.attachments && chat.attachments.length > 0));

  const composerBusy = chat.sending || chat.loadingThread;

  const composer = (
    <form
      onSubmit={chat.send}
      className="rounded-[1.75rem] bg-surface-container-lowest p-2 shadow-bloom ghost-border sm:p-2.5"
    >
      {chat.attachments && chat.attachments.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2 px-1.5 pt-1">
          {chat.attachments.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-1.5 rounded-xl bg-surface-container-low px-2.5 py-1.5 text-xs text-on-surface"
            >
              <LuPaperclip className="size-3 shrink-0 text-on-surface-muted" aria-hidden />
              <span className="max-w-40 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => chat.setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                className="rounded-md p-0.5 text-on-surface-muted transition-colors hover:bg-surface-container-lowest hover:text-secondary"
                aria-label="Remove attachment"
              >
                <LuX className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="relative">
        {chat.showCommandMenu && chat.filteredCommands.length > 0 ? (
          <div className="absolute bottom-full left-0 z-50 mb-2 max-h-60 w-full overflow-y-auto rounded-2xl bg-surface-container-lowest py-1.5 shadow-bloom ghost-border bbai-scroll">
            {chat.filteredCommands.map((cmd, i) => (
              <button
                key={cmd.id}
                type="button"
                onClick={() => chat.handleCommandSelect(cmd)}
                className={[
                  "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
                  i === chat.selectedCommandIndex
                    ? "bg-primary/8"
                    : "hover:bg-surface-container-low",
                ].join(" ")}
              >
                <span className="whitespace-nowrap font-display text-sm font-semibold text-primary">
                  {cmd.id}
                </span>
                <span className="truncate text-xs text-on-surface-muted">{cmd.description}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="input-glow flex items-end gap-1.5 rounded-[1.35rem] bg-surface-container-low px-1.5 py-1.5 transition-[background-color,box-shadow] duration-200 focus-within:bg-surface-container-lowest">
          <label className="mb-0.5 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-on-surface-muted transition-colors hover:bg-surface-container-lowest hover:text-primary">
            <LuPaperclip className="size-4" />
            <span className="sr-only">Attach files</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  const filesArray = Array.from(e.target.files);
                  chat.setAttachments((prev) => [...prev, ...filesArray]);
                }
                e.target.value = "";
              }}
              disabled={composerBusy}
            />
          </label>

          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2 py-1">
            {chat.activeCommand ? (
              <span className="mb-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">
                {chat.activeCommand.id}
                <button
                  type="button"
                  onClick={() => chat.setActiveCommand(null)}
                  className="flex size-4 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
                  aria-label="Remove command"
                >
                  <LuX className="size-3" />
                </button>
              </span>
            ) : null}
            <textarea
              rows={1}
              placeholder={
                chat.activeCommand ? "Add additional context…" : "e.g. What tasks are overdue?"
              }
              aria-label="Ask BBAI"
              className="max-h-32 min-h-10 min-w-48 flex-1 resize-none bg-transparent py-2 text-[15px] leading-5 text-on-surface outline-none placeholder:text-on-surface-muted/80"
              value={chat.message}
              onChange={(event) => {
                chat.setMessage(event.target.value);
                const el = event.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.shiftKey) return;
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  chat.send(event as unknown as React.FormEvent);
                  return;
                }
                chat.handleCommandKeyDown(
                  event as unknown as React.KeyboardEvent<HTMLInputElement>,
                );
              }}
              disabled={composerBusy}
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className={[
              "btn-primary-gradient mb-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-2xl text-on-primary",
              "shadow-bloom transition-[transform,opacity] duration-150",
              "enabled:active:scale-[0.98] disabled:opacity-35",
            ].join(" ")}
            aria-label={chat.sending ? "Thinking" : chat.loadingThread ? "Loading" : "Send"}
          >
            {chat.sending ? (
              <LuLoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <LuArrowUp className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <AiRouteMenu
            value={chat.routeId}
            onChange={chat.setRoute}
            disabled={composerBusy}
          />
          <KeySourceMenu
            value={chat.keySource}
            onChange={chat.setKeySource}
            provider={chat.provider}
            apiKeys={apiKeys}
            disabled={composerBusy}
          />
          <ToolsPanelMenu
            value={frappeTool}
            onChange={handleFrappeToolChange}
            disabled={composerBusy}
          />
        </div>
        <p className="hidden px-1 text-[11px] text-on-surface-muted sm:block">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      {chat.error ? (
        <p className="mt-2 px-1.5 text-sm text-secondary" role="alert">
          {chat.error}
        </p>
      ) : null}
    </form>
  );

  if (chat.hasChat) {
    return (
      <div
        className={[
          "relative z-10 flex h-screen overflow-hidden transition-[margin] duration-300 ease-out",
          sidebarOpen ? "md:ml-72 ml-0" : "ml-0",
        ].join(" ")}
      >
        {/* Chat — full width when Tools closed, left column when open */}
        <section
          className={[
            "flex h-full min-h-0 flex-col px-4 py-5 md:px-5",
            outputOpen ? "w-full md:w-[42%] md:max-w-xl" : "mx-auto w-full max-w-2xl",
          ].join(" ")}
        >
          <p className="mb-3 shrink-0 text-xs font-medium uppercase tracking-[0.25em] text-secondary">
            BBAI · {firstName} · {routeLabel}
          </p>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Chat
          </p>

          <div
            key={activeChatId ?? chat.dbConversationId ?? "thread"}
            ref={threadRef}
            className="bbai-scroll chat-thread-in min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden pb-4"
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
              </div>
            ) : null}

            {chat.loadingOlder ? (
              <p className="text-center text-xs text-on-surface-muted">Loading earlier…</p>
            ) : null}

            {chat.turns.map((turn) => {
              const displayText =
                turn.role === "assistant" ? stripOutputMarker(turn.text) : turn.text;
              return (
              <Fragment key={turn.id}>
                {turn.id === chat.streamingAssistantId && chat.thinkingText ? (
                  <div className="chat-bubble-assistant flex justify-start">
                    <div className="max-w-[95%] whitespace-pre-wrap rounded-2xl bg-surface-container px-4 py-3 text-xs leading-relaxed text-on-surface-muted">
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
                      "max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      turn.role === "user"
                        ? "whitespace-pre-wrap bg-primary text-on-primary"
                        : "bg-surface-container-lowest text-on-surface shadow-bloom",
                    ].join(" ")}
                  >
                    {displayText ? (
                      turn.role === "assistant" ? (
                        <ChatMarkdown content={displayText} />
                      ) : (
                        displayText
                      )
                    ) : turn.id === chat.streamingAssistantId ? (
                      <span className="inline-flex gap-1.5 text-on-surface-muted">
                        <span className="chat-dot">●</span>
                        <span className="chat-dot">●</span>
                        <span className="chat-dot">●</span>
                      </span>
                    ) : turn.role === "assistant" ? (
                      <span className="text-on-surface-muted">Opened in Output.</span>
                    ) : null}
                  </div>
                </div>
              </Fragment>
              );
            })}

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

          {/* Composer + model/key select stay under Chat */}
          <div className="chat-composer-in shrink-0 pt-2">{composer}</div>
        </section>

        {/* Output — only when Tools is on */}
        {outputOpen ? (
          <aside className="hidden min-h-0 flex-1 overflow-hidden md:block">
            <div className="h-full overflow-hidden rounded-l-[1.75rem] bg-surface-container-low">
              <OutputInteractive
                key={`${frappeTool}-${activeChatId ?? "new"}`}
                toolLabel={toolLabel}
                canvasId={canvasId}
                onClose={() => handleFrappeToolChange(FRAPPE_TOOL_MODE.OFF)}
              />
            </div>
          </aside>
        ) : null}

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
                        categoryName: form.category,
                        isGlobal: form.isGlobal,
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
                    if (allOk) notifySkillsChanged();
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
                <div className="fixed inset-0 z-140 flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
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
                          const createdSkill = chat.pendingConfirmations.some(
                            (c) => c.toolName === "create_skill",
                          );
                          chat.setPendingConfirmations([]);
                          if (allOk && createdSkill) notifySkillsChanged();
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
        "relative z-10 flex h-screen overflow-hidden transition-[margin] duration-300 ease-out",
        sidebarOpen ? "md:ml-72 ml-0" : "ml-0",
      ].join(" ")}
    >
      <section
        className={[
          "flex h-full min-h-0 flex-col justify-center px-4 py-8 md:px-5",
          outputOpen ? "w-full md:w-[42%] md:max-w-xl" : "mx-auto w-full max-w-2xl",
        ].join(" ")}
      >
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          Chat
        </p>
        <div className="mb-8 space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-secondary">
            Livro Systems Inc.
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl">
            {loading ? "Hi…" : `Hi, ${firstName}.`}
          </h1>
          <p className="text-base leading-relaxed text-on-surface-muted">
            {outputOpen
              ? `Generate a Frappe ${toolLabel.toLowerCase()} here — live preview streams in Output.`
              : "Ask about tasks, bugs, or school setup."}
          </p>
          {profile ? (
            <div className="flex flex-wrap gap-3">
              {profile.role ? (
                <span className="rounded-full bg-surface-container-low px-4 py-2 text-sm text-on-surface">
                  {getRoleLabel(profile.role)}
                </span>
              ) : null}
              <span className="rounded-full bg-surface-container-low px-4 py-2 text-sm text-on-surface">
                {getFocusLabel(profile.focus)}
              </span>
            </div>
          ) : null}
        </div>

        {composer}
      </section>

      {outputOpen ? (
        <aside className="hidden min-h-0 flex-1 overflow-hidden md:block">
          <div className="h-full overflow-hidden rounded-l-[1.75rem] bg-surface-container-low">
            <OutputInteractive
              key={`${frappeTool}-${activeChatId ?? "new"}`}
              toolLabel={toolLabel}
              canvasId={canvasId}
              onClose={() => handleFrappeToolChange(FRAPPE_TOOL_MODE.OFF)}
            />
          </div>
        </aside>
      ) : null}
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

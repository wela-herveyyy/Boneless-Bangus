"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  getFocusLabel,
  getTeamLabel,
  ONBOARDING_STORAGE_KEY,
  type OnboardingProfile,
} from "@/components/organisms/OnboardingPanel/onboardingPanel.hooks";
import { promptAiAction, listConversationMessagesAction } from "@/lib/domain/actions/ai.actions";
import { listLocalRecordsAction } from "@/lib/domain/actions/storage.actions";
import { AI_PROVIDER, type AiProvider } from "@/lib/entities/ai.type";
import {
  CURSOR_MCP_STORAGE_KEY,
  CURSOR_SKILLS_STORAGE_KEY,
  type CursorMcpServerConfig,
  type CursorSkill,
} from "@/lib/entities/cursor.type";
import {
  GOOGLE_AI_DEFAULT_MODEL,
  GOOGLE_AI_MODEL,
  GOOGLE_AI_MODEL_OPTIONS,
  type GoogleAiModel,
} from "@/lib/entities/google_ai.type";
import { loadUserAiConfigFromIdb } from "@/lib/utils/mcp-idb";
import { buildErpMcpConfig, ERP_MCP_SERVER_KEY } from "@/lib/entities/erpnext.type";
import { AVAILABLE_COMMANDS, type CommandDefinition } from "./workspaceChat.commands";

const PROVIDER_STORAGE_KEY = "bbai_ai_provider";
const GOOGLE_MODEL_STORAGE_KEY = "bbai_google_model";
export const AI_PROVIDER_OPTIONS: { value: AiProvider; label: string }[] = [
  { value: AI_PROVIDER.CURSOR, label: "Cursor" },
  { value: AI_PROVIDER.GOOGLE_AI, label: "Google" },
];

export { GOOGLE_AI_MODEL_OPTIONS };

/** Flat picker options — one choice sets provider + google model. */
export type AiRouteId = "cursor" | "gemma_4" | "antigravity";

export const AI_ROUTE_OPTIONS: {
  id: AiRouteId;
  label: string;
  hint: string;
  provider: AiProvider;
  googleModel?: GoogleAiModel;
}[] = [
  {
    id: "cursor",
    label: "Cursor",
    hint: "Agent SDK",
    provider: AI_PROVIDER.CURSOR,
  },
  {
    id: "gemma_4",
    label: "Gemma 4",
    hint: "Google",
    provider: AI_PROVIDER.GOOGLE_AI,
    googleModel: GOOGLE_AI_MODEL.GEMMA_4_31B,
  },
  {
    id: "antigravity",
    label: "Antigravity",
    hint: "Google agent",
    provider: AI_PROVIDER.GOOGLE_AI,
    googleModel: GOOGLE_AI_MODEL.ANTIGRAVITY,
  },
];

export function routeIdFromSelection(
  provider: AiProvider,
  googleModel: GoogleAiModel,
): AiRouteId {
  if (provider === AI_PROVIDER.CURSOR) return "cursor";
  if (googleModel === GOOGLE_AI_MODEL.ANTIGRAVITY) return "antigravity";
  return "gemma_4";
}

function parseProfile(value: string): OnboardingProfile | null {
  try {
    const parsed = JSON.parse(value) as OnboardingProfile;
    if (!parsed.name || !parsed.team || !parsed.focus || !parsed.completedAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseMcpServers(value: string): Record<string, CursorMcpServerConfig> | undefined {
  try {
    const parsed = JSON.parse(value) as
      | Record<string, CursorMcpServerConfig>
      | { mcpServers?: Record<string, CursorMcpServerConfig> };
    const servers = "mcpServers" in parsed && parsed.mcpServers ? parsed.mcpServers : parsed;
    if (!servers || typeof servers !== "object" || Array.isArray(servers)) return undefined;
    return servers as Record<string, CursorMcpServerConfig>;
  } catch {
    return undefined;
  }
}

function parseSkills(value: string): CursorSkill[] | undefined {
  try {
    const parsed = JSON.parse(value) as CursorSkill[] | { skills?: CursorSkill[] };
    const skills = Array.isArray(parsed) ? parsed : parsed.skills;
    if (!Array.isArray(skills)) return undefined;
    return skills.filter(
      (s): s is CursorSkill =>
        !!s && typeof s.name === "string" && typeof s.content === "string",
    );
  } catch {
    return undefined;
  }
}

function readStoredProvider(): AiProvider {
  if (typeof window === "undefined") return AI_PROVIDER.GOOGLE_AI;
  const raw = window.localStorage.getItem(PROVIDER_STORAGE_KEY);
  if (raw === AI_PROVIDER.CURSOR || raw === AI_PROVIDER.GOOGLE_AI) return raw;
  return AI_PROVIDER.GOOGLE_AI;
}

function readStoredGoogleModel(): GoogleAiModel {
  if (typeof window === "undefined") return GOOGLE_AI_DEFAULT_MODEL;
  const raw = window.localStorage.getItem(GOOGLE_MODEL_STORAGE_KEY);
  if (raw === GOOGLE_AI_MODEL.GEMMA_4_31B || raw === GOOGLE_AI_MODEL.ANTIGRAVITY) {
    return raw;
  }
  return GOOGLE_AI_DEFAULT_MODEL;
}

export function useWorkspaceProfile() {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const result = await listLocalRecordsAction();

    if (result.ok) {
      const record = result.data.find((item) => item.key === ONBOARDING_STORAGE_KEY);
      if (record) {
        setProfile(parseProfile(record.value));
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  return { profile, loading };
}

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const HISTORY_PAGE = 20;

type ThreadCacheEntry = {
  turns: ChatTurn[];
  hasMoreHistory: boolean;
  nextBefore: number | null;
};

/** Session cache — switching chats restores instantly. */
const threadCache = new Map<string, ThreadCacheEntry>();

function turnsFromMessages(
  items: { id: string; content: string; aiFeedback: string | null }[],
): ChatTurn[] {
  return items.flatMap((item) => {
    const next: ChatTurn[] = [{ id: `${item.id}-u`, role: "user", text: item.content }];
    if (item.aiFeedback) {
      next.push({ id: `${item.id}-a`, role: "assistant", text: item.aiFeedback });
    }
    return next;
  });
}

function writeThreadCache(id: string, entry: ThreadCacheEntry) {
  threadCache.set(id, {
    turns: entry.turns,
    hasMoreHistory: entry.hasMoreHistory,
    nextBefore: entry.nextBefore,
  });
}

export function useWorkspaceChat(
  user?: { name?: string; email?: string },
  options?: {
    activeChatId?: string | null;
    onConversationSaved?: (dbConversationId: string) => void;
  },
) {
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [provider, setProviderState] = useState<AiProvider>(AI_PROVIDER.GOOGLE_AI);
  const [googleModel, setGoogleModelState] = useState<GoogleAiModel>(GOOGLE_AI_DEFAULT_MODEL);
  const [providerConversationId, setProviderConversationId] = useState<string | undefined>();
  const [dbConversationId, setDbConversationId] = useState<string | undefined>();
  const [thinkingText, setThinkingText] = useState("");
  const [streamingAssistantId, setStreamingAssistantId] = useState<string | null>(null);
  const [mcpServers, setMcpServers] = useState<Record<string, CursorMcpServerConfig>>();
  const [skills, setSkills] = useState<CursorSkill[]>();
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [historyEpoch, setHistoryEpoch] = useState(0);

  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const threadStateRef = useRef({
    turns,
    dbConversationId,
    hasMoreHistory,
    nextBefore,
  });
  threadStateRef.current = { turns, dbConversationId, hasMoreHistory, nextBefore };

  useEffect(() => {
    setProviderState(readStoredProvider());
    setGoogleModelState(readStoredGoogleModel());
  }, []);

  useEffect(() => {
    void (async () => {
      const [localRecordsResult, idbConfig] = await Promise.all([
        listLocalRecordsAction(),
        loadUserAiConfigFromIdb().catch(() => null),
      ]);

      let serversFromRecords: Record<string, CursorMcpServerConfig> | undefined;
      if (localRecordsResult.ok) {
        const mcp = localRecordsResult.data.find((item) => item.key === CURSOR_MCP_STORAGE_KEY);
        const sk = localRecordsResult.data.find((item) => item.key === CURSOR_SKILLS_STORAGE_KEY);
        if (mcp) serversFromRecords = parseMcpServers(mcp.value);
        if (sk) setSkills(parseSkills(sk.value));
      }

      // IDB configs may contain richer auth shapes (credentialRef) not in CursorMcpServerConfig
      const serversFromIdb = idbConfig?.mcpServers as Record<string, unknown> | undefined;

      const erpSid = localStorage.getItem("bbai_erp_sid");
      const erpMcp = buildErpMcpConfig(erpSid);

      const mergedServers: Record<string, CursorMcpServerConfig> = {
        ...(erpMcp ? { [ERP_MCP_SERVER_KEY]: erpMcp } : {}),
        ...(serversFromRecords ?? {}),
        ...(serversFromIdb ?? {}),
      };

      if (Object.keys(mergedServers).length > 0) {
        setMcpServers(mergedServers);
      }
    })();
  }, []);

  useEffect(() => {
    const activeId = options?.activeChatId ?? null;

    if (!activeId) {
      setTurns([]);
      setDbConversationId(undefined);
      setProviderConversationId(undefined);
      setThinkingText("");
      setStreamingAssistantId(null);
      setHasMoreHistory(false);
      setNextBefore(null);
      setError(null);
      setLoadingThread(false);
      return;
    }

    const cached = threadCache.get(activeId);
    const live = threadStateRef.current;
    if (cached) {
      setDbConversationId(activeId);
      setProviderConversationId(undefined);
      setTurns(cached.turns);
      setHasMoreHistory(cached.hasMoreHistory);
      setNextBefore(cached.nextBefore);
      setLoadingThread(false);
      setHistoryEpoch((n) => n + 1);
      setError(null);
      return;
    }

    if (live.dbConversationId === activeId && live.turns.length > 0) {
      writeThreadCache(activeId, {
        turns: live.turns,
        hasMoreHistory: live.hasMoreHistory,
        nextBefore: live.nextBefore,
      });
      setLoadingThread(false);
      return;
    }

    setTurns([]);
    setDbConversationId(activeId);
    setProviderConversationId(undefined);
    setThinkingText("");
    setStreamingAssistantId(null);
    setHasMoreHistory(false);
    setNextBefore(null);
    setLoadingThread(true);
    setError(null);

    let cancelled = false;
    void (async () => {
      const result = await listConversationMessagesAction(activeId, { limit: HISTORY_PAGE });
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setLoadingThread(false);
        return;
      }

      const nextTurns = turnsFromMessages(result.data.items);
      setDbConversationId(activeId);
      setProviderConversationId(undefined);
      setTurns(nextTurns);
      setHasMoreHistory(result.data.hasMore);
      setNextBefore(result.data.nextBefore);
      writeThreadCache(activeId, {
        turns: nextTurns,
        hasMoreHistory: result.data.hasMore,
        nextBefore: result.data.nextBefore,
      });
      setHistoryEpoch((n) => n + 1);
      setError(null);
      setLoadingThread(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [options?.activeChatId]);

  useEffect(() => {
    if (!dbConversationId || loadingThread) return;
    writeThreadCache(dbConversationId, { turns, hasMoreHistory, nextBefore });
  }, [dbConversationId, turns, hasMoreHistory, nextBefore, loadingThread]);

  const loadOlder = useCallback(
    async (el?: HTMLElement | null) => {
      if (!dbConversationId || !hasMoreHistory || loadingOlder || nextBefore == null) return;

      setLoadingOlder(true);
      const prevHeight = el?.scrollHeight ?? 0;
      const result = await listConversationMessagesAction(dbConversationId, {
        limit: HISTORY_PAGE,
        before: nextBefore,
      });

      if (result.ok) {
        setTurns((prev) => [...turnsFromMessages(result.data.items), ...prev]);
        setHasMoreHistory(result.data.hasMore);
        setNextBefore(result.data.nextBefore);
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - prevHeight;
        });
      }

      setLoadingOlder(false);
    },
    [dbConversationId, hasMoreHistory, loadingOlder, nextBefore],
  );

  const setProvider = useCallback((next: AiProvider) => {
    setProviderState(next);
    setProviderConversationId(undefined);
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, next);
  }, []);

  const setGoogleModel = useCallback((next: GoogleAiModel) => {
    setGoogleModelState(next);
    setProviderConversationId(undefined);
    window.localStorage.setItem(GOOGLE_MODEL_STORAGE_KEY, next);
  }, []);

  const setRoute = useCallback((id: AiRouteId) => {
    const route = AI_ROUTE_OPTIONS.find((option) => option.id === id);
    if (!route) return;
    setProviderState(route.provider);
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, route.provider);
    if (route.googleModel) {
      setGoogleModelState(route.googleModel);
      window.localStorage.setItem(GOOGLE_MODEL_STORAGE_KEY, route.googleModel);
    }
    setProviderConversationId(undefined);
  }, []);

  const sendGoogleStream = useCallback(
    async (text: string) => {
      const assistantId = `a-${Date.now()}`;
      setThinkingText("");
      setStreamingAssistantId(assistantId);
      setTurns((prev) => [...prev, { id: assistantId, role: "assistant", text: "" }]);

      const shouldDropChainAndRetry = (message: string) =>
        /404|requested entity was not found|internal error/i.test(message);

      const runStream = async (previousInteractionId?: string) => {
        const serializedMcpServers = mcpServers
          ? Object.entries(mcpServers).map(([slug, config]) => ({ slug, config }))
          : [];

        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            model: googleModel,
            previousInteractionId,
            dbConversationId,
            name: user?.name,
            email: user?.email,
            mcpServers: serializedMcpServers,
          }),
        });

        if (!response.ok || !response.body) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? `Stream failed (${response.status}).`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sawDone = false;

        const applyEvent = (raw: string) => {
          const line = raw.trim();
          if (!line.startsWith("data:")) return;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") return;

          const event = JSON.parse(payload) as {
            type: string;
            text?: string;
            error?: string;
            conversationId?: string;
            dbConversationId?: string;
            messageId?: string;
            slug?: string;
            toolName?: string;
            reason?: string;
            ok?: boolean;
          };

          if (event.type === "tool_warning") {
            setThinkingText((prev) => prev + `\n*[MCP Warning: ${event.slug ?? ""} - ${event.reason ?? ""}]*\n`);
            return;
          }
          if (event.type === "tool_call") {
            setThinkingText((prev) => prev + `\n> **Calling tool:** \`${event.slug ?? ""}__${event.toolName ?? ""}\`...\n`);
            return;
          }
          if (event.type === "tool_result") {
            setThinkingText((prev) => prev + `> **Tool \`${event.slug ?? ""}__${event.toolName ?? ""}\`** ${event.ok ? "completed successfully" : "failed"}.\n\n`);
            return;
          }

          if (event.type === "thinking" && event.text) {
            setThinkingText((prev) => prev + event.text);
            return;
          }
          if (event.type === "text" && event.text) {
            setThinkingText("");
            setTurns((prev) =>
              prev.map((turn) =>
                turn.id === assistantId ? { ...turn, text: turn.text + event.text } : turn,
              ),
            );
            return;
          }
          if (event.type === "created" && event.conversationId) {
            setProviderConversationId(event.conversationId);
            return;
          }
          if (event.type === "done") {
            sawDone = true;
            if (event.conversationId) setProviderConversationId(event.conversationId);
            if (event.dbConversationId) {
              setDbConversationId(event.dbConversationId);
              options?.onConversationSaved?.(event.dbConversationId);
            }
            setTurns((prev) =>
              prev.map((turn) =>
                turn.id === assistantId
                  ? {
                      ...turn,
                      id: event.messageId ?? turn.id,
                      text: event.text ?? turn.text,
                    }
                  : turn,
              ),
            );
            setThinkingText("");
            setStreamingAssistantId(null);
            return;
          }
          if (event.type === "error") {
            throw new Error(event.error ?? "Stream error.");
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) applyEvent(part);
        }
        if (buffer.trim()) applyEvent(buffer);

        if (!sawDone) {
          throw new Error("Stream ended before completion.");
        }
      };

      try {
        try {
          await runStream(providerConversationId);
        } catch (err) {
          const errMessage = err instanceof Error ? err.message : "";
          if (shouldDropChainAndRetry(errMessage)) {
            setProviderConversationId(undefined);
            setThinkingText("");
            setTurns((prev) =>
              prev.map((turn) => (turn.id === assistantId ? { ...turn, text: "" } : turn)),
            );
            await runStream(undefined);
          } else {
            throw err;
          }
        }
      } catch (err) {
        setProviderConversationId(undefined);
        setThinkingText("");
        setStreamingAssistantId(null);
        setTurns((prev) =>
          prev.filter((turn) => turn.id !== assistantId || turn.text.trim().length > 0),
        );
        throw err;
      }
    },
    [googleModel, providerConversationId, dbConversationId, user?.name, user?.email, mcpServers, options],
  );

  const send = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const text = message.trim();
      if (!text || sending) return;

      setSending(true);
      setError(null);
      setMessage("");
      setTurns((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);

      try {
        if (provider === AI_PROVIDER.GOOGLE_AI) {
          await sendGoogleStream(text);
        } else {
          const result = await promptAiAction({
            provider,
            message: text,
            name: user?.name,
            email: user?.email,
            mcpServers,
            skills,
            dbConversationId,
          });

          if (result.ok) {
            setProviderConversationId(result.data.conversationId);
            if (result.data.dbConversationId) {
              setDbConversationId(result.data.dbConversationId);
              options?.onConversationSaved?.(result.data.dbConversationId);
            }
            setTurns((prev) => [
              ...prev,
              {
                id: result.data.messageId ?? `a-${Date.now()}`,
                role: "assistant",
                text: result.data.text,
              },
            ]);
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed.");
      }

      setSending(false);
    },
    [
      message,
      sending,
      user?.name,
      user?.email,
      provider,
      mcpServers,
      skills,
      dbConversationId,
      options,
      sendGoogleStream,
    ],
  );

  const filteredCommands = showCommandMenu
    ? AVAILABLE_COMMANDS.filter((cmd) => cmd.id.toLowerCase().includes(commandSearch.toLowerCase()))
    : [];

  const handleMessageChange = useCallback((value: string) => {
    setMessage(value);
    
    // Check for slash command trigger at the beginning or after a space
    const match = value.match(/(?:^|\s)(\/\S*)$/);
    if (match) {
      setShowCommandMenu(true);
      setCommandSearch(match[1]);
      setSelectedCommandIndex(0);
    } else {
      setShowCommandMenu(false);
    }
  }, []);

  const handleCommandSelect = useCallback((cmd: typeof AVAILABLE_COMMANDS[0]) => {
    setMessage((prev) => {
      const regex = new RegExp(`(?:^|\\s)(${commandSearch})$`);
      return prev.replace(regex, ` ${cmd.promptText}`).trimStart();
    });
    setShowCommandMenu(false);
  }, [commandSearch]);

  const handleCommandKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCommandMenu || filteredCommands.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedCommandIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedCommandIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = filteredCommands[selectedCommandIndex];
      if (selected) {
        handleCommandSelect(selected);
      }
    } else if (event.key === "Escape") {
      setShowCommandMenu(false);
    }
  }, [showCommandMenu, filteredCommands, selectedCommandIndex, handleCommandSelect]);

  return {
    message,
    setMessage: handleMessageChange,
    handleCommandKeyDown,
    handleCommandSelect,
    showCommandMenu,
    filteredCommands,
    selectedCommandIndex,
    setShowCommandMenu,
    turns,
    error,
    sending,
    send,
    thinkingText,
    streamingAssistantId,
    hasChat: turns.length > 0 || loadingThread || Boolean(dbConversationId),
    loadingThread,
    provider,
    setProvider,
    googleModel,
    setGoogleModel,
    routeId: routeIdFromSelection(provider, googleModel),
    setRoute,
    dbConversationId,
    hasMoreHistory,
    loadingOlder,
    loadOlder,
    historyEpoch,
  };
}

export function getDisplayName(profile: OnboardingProfile | null, fallbackName: string) {
  return fallbackName.trim() || profile?.name.trim() || "there";
}

export { getFocusLabel, getTeamLabel };

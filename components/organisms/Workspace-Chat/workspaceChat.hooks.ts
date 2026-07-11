"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  getFocusLabel,
  getTeamLabel,
  ONBOARDING_STORAGE_KEY,
  type OnboardingProfile,
} from "@/components/organisms/OnboardingPanel/onboardingPanel.hooks";
import { promptAiAction } from "@/lib/domain/actions/ai.actions";
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

export function useWorkspaceChat(user?: { name?: string; email?: string }) {
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [provider, setProviderState] = useState<AiProvider>(AI_PROVIDER.GOOGLE_AI);
  const [googleModel, setGoogleModelState] = useState<GoogleAiModel>(GOOGLE_AI_DEFAULT_MODEL);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [mcpServers, setMcpServers] = useState<Record<string, CursorMcpServerConfig>>();
  const [skills, setSkills] = useState<CursorSkill[]>();

  useEffect(() => {
    setProviderState(readStoredProvider());
    setGoogleModelState(readStoredGoogleModel());
  }, []);

  useEffect(() => {
    void (async () => {
      const result = await listLocalRecordsAction();
      if (!result.ok) return;

      const mcp = result.data.find((item) => item.key === CURSOR_MCP_STORAGE_KEY);
      const sk = result.data.find((item) => item.key === CURSOR_SKILLS_STORAGE_KEY);
      if (mcp) setMcpServers(parseMcpServers(mcp.value));
      if (sk) setSkills(parseSkills(sk.value));
    })();
  }, []);

  const setProvider = useCallback((next: AiProvider) => {
    setProviderState(next);
    setConversationId(undefined);
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, next);
  }, []);

  const setGoogleModel = useCallback((next: GoogleAiModel) => {
    setGoogleModelState(next);
    setConversationId(undefined);
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
    setConversationId(undefined);
  }, []);

  const send = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const text = message.trim();
      if (!text || sending) return;

      setSending(true);
      setError(null);
      setMessage("");
      setTurns((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);

      const result = await promptAiAction({
        provider,
        message: text,
        name: user?.name,
        email: user?.email,
        mcpServers: provider === AI_PROVIDER.CURSOR ? mcpServers : undefined,
        skills: provider === AI_PROVIDER.CURSOR ? skills : undefined,
        model: provider === AI_PROVIDER.GOOGLE_AI ? googleModel : undefined,
        previousInteractionId:
          provider === AI_PROVIDER.GOOGLE_AI ? conversationId : undefined,
      });

      if (result.ok) {
        setConversationId(result.data.conversationId);
        setTurns((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: result.data.text,
          },
        ]);
      } else {
        setError(result.error);
      }

      setSending(false);
    },
    [
      message,
      sending,
      user?.name,
      user?.email,
      provider,
      googleModel,
      mcpServers,
      skills,
      conversationId,
    ],
  );

  return {
    message,
    setMessage,
    turns,
    error,
    sending,
    send,
    hasChat: turns.length > 0,
    provider,
    setProvider,
    googleModel,
    setGoogleModel,
    routeId: routeIdFromSelection(provider, googleModel),
    setRoute,
  };
}

export function getDisplayName(profile: OnboardingProfile | null, fallbackName: string) {
  return profile?.name.trim() || fallbackName.trim() || "there";
}

export { getFocusLabel, getTeamLabel };

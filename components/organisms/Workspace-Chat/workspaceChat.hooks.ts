"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  getFocusLabel,
  getTeamLabel,
  ONBOARDING_STORAGE_KEY,
  type OnboardingProfile,
} from "@/components/organisms/OnboardingPanel/onboardingPanel.hooks";
import { promptAgentAction } from "@/lib/domain/actions/cursor.actions";
import { listLocalRecordsAction } from "@/lib/domain/actions/storage.actions";
import {
  CURSOR_MCP_STORAGE_KEY,
  CURSOR_SKILLS_STORAGE_KEY,
  type CursorMcpServerConfig,
  type CursorSkill,
} from "@/lib/entities/cursor.type";

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
  const [mcpServers, setMcpServers] = useState<Record<string, CursorMcpServerConfig>>();
  const [skills, setSkills] = useState<CursorSkill[]>();

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

  const send = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const text = message.trim();
      if (!text || sending) return;

      setSending(true);
      setError(null);
      setMessage("");
      setTurns((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);

      const result = await promptAgentAction({
        message: text,
        name: user?.name,
        email: user?.email,
        mcpServers,
        skills,
      });

      if (result.ok) {
        setTurns((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: result.data.result?.trim() || "(No response)",
          },
        ]);
      } else {
        setError(result.error);
      }

      setSending(false);
    },
    [message, sending, user?.name, user?.email, mcpServers, skills],
  );

  return { message, setMessage, turns, error, sending, send, hasChat: turns.length > 0 };
}

export function getDisplayName(profile: OnboardingProfile | null, fallbackName: string) {
  return profile?.name.trim() || fallbackName.trim() || "there";
}

export { getFocusLabel, getTeamLabel };

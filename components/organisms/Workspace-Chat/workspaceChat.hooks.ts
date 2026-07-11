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
    [message, sending, user?.name, user?.email],
  );

  return { message, setMessage, turns, error, sending, send, hasChat: turns.length > 0 };
}

export function getDisplayName(profile: OnboardingProfile | null, fallbackName: string) {
  return profile?.name.trim() || fallbackName.trim() || "there";
}

export { getFocusLabel, getTeamLabel };

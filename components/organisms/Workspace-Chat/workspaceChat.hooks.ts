"use client";

import { useCallback, useEffect, useState } from "react";
import { listLocalRecordsAction } from "@/lib/domain/actions/storage.actions";
import {
  getFocusLabel,
  getTeamLabel,
  ONBOARDING_STORAGE_KEY,
  type OnboardingProfile,
} from "@/components/organisms/OnboardingPanel/onboardingPanel.hooks";

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

export function getDisplayName(profile: OnboardingProfile | null, fallbackName: string) {
  return profile?.name.trim() || fallbackName.trim() || "there";
}

export { getFocusLabel, getTeamLabel };

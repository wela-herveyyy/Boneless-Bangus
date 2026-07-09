"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listLocalRecordsAction,
  saveLocalRecordAction,
} from "@/lib/domain/actions/storage.actions";

export const ONBOARDING_STORAGE_KEY = "bbai_onboarding";

export type OnboardingTeam = "development" | "qa" | "school-setup" | "operations";
export type OnboardingFocus = "tasks" | "bugs" | "school-setup" | "general";

export type OnboardingProfile = {
  name: string;
  team: OnboardingTeam;
  focus: OnboardingFocus;
  completedAt: string;
};

export const ONBOARDING_TEAMS: { value: OnboardingTeam; label: string; hint: string }[] = [
  { value: "development", label: "Development", hint: "Tasks, code, and shipping" },
  { value: "qa", label: "QA", hint: "Bugs, logs, and root cause" },
  { value: "school-setup", label: "School setup", hint: "Enrollment, roles, and configs" },
  { value: "operations", label: "Operations", hint: "Day-to-day coordination" },
];

export const ONBOARDING_FOCUS: { value: OnboardingFocus; label: string; hint: string }[] = [
  { value: "tasks", label: "Tasks & priorities", hint: "Overdue work and what to tackle next" },
  { value: "bugs", label: "Bug analysis", hint: "Errors, logs, and likely causes" },
  { value: "school-setup", label: "School setup", hint: "Academic year, enrollment, roles" },
  { value: "general", label: "General help", hint: "Anything permission-bound in your workspace" },
];

const STEPS = ["name", "team", "focus", "done"] as const;
export type OnboardingStep = (typeof STEPS)[number];

type UseOnboardingPanelOptions = {
  defaultName?: string;
};

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

export function useOnboardingPanel({ defaultName = "" }: UseOnboardingPanelOptions = {}) {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [step, setStep] = useState<OnboardingStep>("name");
  const [name, setName] = useState(defaultName);
  const [team, setTeam] = useState<OnboardingTeam | null>(null);
  const [focus, setFocus] = useState<OnboardingFocus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setError(null);
    const result = await listLocalRecordsAction();

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const record = result.data.find((item) => item.key === ONBOARDING_STORAGE_KEY);
    if (record) {
      const saved = parseProfile(record.value);
      if (saved) {
        setProfile(saved);
        setStep("done");
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (defaultName && !name) {
      setName(defaultName);
    }
  }, [defaultName, name]);

  async function completeOnboarding() {
    if (!name.trim() || !team || !focus) {
      return;
    }

    setSaving(true);
    setError(null);

    const nextProfile: OnboardingProfile = {
      name: name.trim(),
      team,
      focus,
      completedAt: new Date().toISOString(),
    };

    const result = await saveLocalRecordAction({
      key: ONBOARDING_STORAGE_KEY,
      value: JSON.stringify(nextProfile),
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setProfile(nextProfile);
    setStep("done");
  }

  function goNext() {
    if (step === "name" && name.trim()) {
      setStep("team");
      return;
    }
    if (step === "team" && team) {
      setStep("focus");
      return;
    }
    if (step === "focus" && focus) {
      void completeOnboarding();
    }
  }

  function goBack() {
    if (step === "team") {
      setStep("name");
    } else if (step === "focus") {
      setStep("team");
    }
  }

  function restart() {
    setProfile(null);
    setStep("name");
    setTeam(null);
    setFocus(null);
    setName(defaultName);
  }

  const stepIndex = STEPS.indexOf(step);
  const progress = step === "done" ? 100 : ((stepIndex + 1) / (STEPS.length - 1)) * 100;

  return {
    profile,
    step,
    stepIndex,
    progress,
    name,
    setName,
    team,
    setTeam,
    focus,
    setFocus,
    loading,
    saving,
    error,
    goNext,
    goBack,
    restart,
    canContinue:
      (step === "name" && Boolean(name.trim())) ||
      (step === "team" && Boolean(team)) ||
      (step === "focus" && Boolean(focus)),
  };
}

export function getTeamLabel(team: OnboardingTeam) {
  return ONBOARDING_TEAMS.find((item) => item.value === team)?.label ?? team;
}

export function getFocusLabel(focus: OnboardingFocus) {
  return ONBOARDING_FOCUS.find((item) => item.value === focus)?.label ?? focus;
}

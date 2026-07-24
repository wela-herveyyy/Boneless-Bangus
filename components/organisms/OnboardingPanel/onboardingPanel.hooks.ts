"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listLocalRecordsAction,
  saveLocalRecordAction,
} from "@/lib/domain/actions/storage.actions";
import { syncOnboardingProfileAction } from "@/lib/domain/actions/profile.actions";
import { type UserRole, isUserRole } from "@/lib/entities/users.type";
import { clearGithubCache } from "@/components/organisms/GithubSidebar/githubSidebar.hooks";

export const getOnboardingStorageKey = (userId?: string) => 
  userId ? `bbai_onboarding_${userId}` : "bbai_onboarding";

export type OnboardingFocus = "tasks" | "bugs" | "school-setup" | "general";

export type OnboardingProfile = {
  name: string;
  role: UserRole;
  focus: OnboardingFocus;
  completedAt: string;
};

export const ONBOARDING_ROLES: { value: UserRole; label: string; hint: string }[] = [
  { value: "owner", label: "Owner", hint: "Workspace owner and top-level management" },
  { value: "admin", label: "Admin", hint: "Workspace administration and settings" },
  { value: "tech", label: "Tech", hint: "Technical infrastructure and DevOps" },
  { value: "sales", label: "Sales", hint: "Client relations and revenue" },
  { value: "dev", label: "Development", hint: "Software development and engineering" },
  { value: "qa", label: "QA", hint: "Quality assurance and testing" },
  { value: "po", label: "Product Owner", hint: "Product ownership and backlog" },
  { value: "pm", label: "Project Manager", hint: "Project management and timelines" },
  { value: "finance", label: "Finance", hint: "Accounting and financial operations" },
];

export const ONBOARDING_FOCUS: { value: OnboardingFocus; label: string; hint: string }[] = [
  { value: "tasks", label: "Tasks & priorities", hint: "Overdue work and what to tackle next" },
  { value: "bugs", label: "Bug analysis", hint: "Errors, logs, and likely causes" },
  { value: "school-setup", label: "School setup", hint: "Academic year, enrollment, roles" },
  { value: "general", label: "General help", hint: "Anything permission-bound in your workspace" },
];

const STEPS = ["name", "role", "focus", "done"] as const;
export type OnboardingStep = (typeof STEPS)[number];

type UseOnboardingPanelOptions = {
  defaultName?: string;
  userId?: string;
};

function parseProfile(value: string): OnboardingProfile | null {
  try {
    const parsed = JSON.parse(value) as OnboardingProfile;
    // Handle old localstorage data that might have "team" instead of "role", or invalid role
    if (!parsed.name || (!parsed.role && !(parsed as any).team) || !parsed.focus || !parsed.completedAt) {
      return null;
    }
    // Migrate old "team" to "role" if necessary, though it might fail isUserRole
    if (!parsed.role && (parsed as any).team) {
      parsed.role = (parsed as any).team;
    }
    if (!isUserRole(parsed.role)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useOnboardingPanel({ defaultName = "", userId }: UseOnboardingPanelOptions = {}) {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [step, setStep] = useState<OnboardingStep>("name");
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState<UserRole | null>(null);
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

    const key = getOnboardingStorageKey(userId);
    const record = result.data.find((item) => item.key === key);
    if (record) {
      const saved = parseProfile(record.value);
      if (saved) {
        setProfile(saved);
        setStep("done");
      }
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (defaultName && !name) {
      setName(defaultName);
    }
  }, [defaultName, name]);

  async function completeOnboarding() {
    if (!name.trim() || !role || !focus) {
      return;
    }

    setSaving(true);
    setError(null);

    const nextProfile: OnboardingProfile = {
      name: name.trim(),
      role,
      focus,
      completedAt: new Date().toISOString(),
    };

    const result = await saveLocalRecordAction({
      key: getOnboardingStorageKey(userId),
      value: JSON.stringify(nextProfile),
    });

    // Also sync the name and role to the database directly
    await syncOnboardingProfileAction(name.trim(), role);

    // Clear the GitHub sidebar cache so it pulls the new role when remounted
    clearGithubCache();

    // Dispatch global event so persistent layouts can refresh their cached roles if they are mounted
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("profile-updated"));
    }

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
      setStep("role");
      return;
    }
    if (step === "role" && role) {
      setStep("focus");
      return;
    }
    if (step === "focus" && focus) {
      void completeOnboarding();
    }
  }

  function goBack() {
    if (step === "role") {
      setStep("name");
    } else if (step === "focus") {
      setStep("role");
    }
  }

  function restart() {
    setProfile(null);
    setStep("name");
    setRole(null);
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
    role,
    setRole,
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
      (step === "role" && Boolean(role)) ||
      (step === "focus" && Boolean(focus)),
  };
}

export function getRoleLabel(role: UserRole) {
  return ONBOARDING_ROLES.find((item) => item.value === role)?.label ?? role;
}

export function getFocusLabel(focus: OnboardingFocus) {
  return ONBOARDING_FOCUS.find((item) => item.value === focus)?.label ?? focus;
}

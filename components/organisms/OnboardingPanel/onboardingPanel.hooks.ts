"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listLocalRecordsAction,
  saveLocalRecordAction,
} from "@/lib/domain/actions/storage.actions";
import { syncOnboardingProfileAction } from "@/lib/domain/actions/profile.actions";
import { getRolesAction } from "@/lib/domain/actions/roles.actions";
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

export type OnboardingRoleOption = {
  value: string;
  label: string;
  hint: string;
};

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
    if (!parsed.name || (!parsed.role && !(parsed as any).team) || !parsed.focus || !parsed.completedAt) {
      return null;
    }
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
  const [onboardingRoles, setOnboardingRoles] = useState<OnboardingRoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

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

  const loadRoles = useCallback(async () => {
    setLoadingRoles(true);
    const result = await getRolesAction();
    if (result.ok) {
      setCachedDynamicRoles(result.data.map((r) => ({ value: r.value, label: r.label })));
      const filtered = result.data
        .filter((r) => !["owner", "admin", "team leader", "team-leader"].includes(r.value.toLowerCase()))
        .map((r) => ({
          value: r.value,
          label: r.label,
          hint: r.hint || r.description || "Role assigned during onboarding",
        }));
      setOnboardingRoles(filtered);
    }
    setLoadingRoles(false);
  }, []);

  useEffect(() => {
    void loadProfile();
    void loadRoles();
  }, [loadProfile, loadRoles]);

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

    await syncOnboardingProfileAction(name.trim(), role);
    clearGithubCache();

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
    onboardingRoles,
    loadingRoles,
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

let cachedDynamicRoles: { value: string; label: string }[] = [];

export function setCachedDynamicRoles(roles: { value: string; label: string }[]) {
  cachedDynamicRoles = roles;
}

export function useFetchDynamicRoles() {
  useEffect(() => {
    if (cachedDynamicRoles.length === 0) {
      void getRolesAction().then((result) => {
        if (result.ok) {
          cachedDynamicRoles = result.data.map((r) => ({ value: r.value, label: r.label }));
        }
      });
    }
  }, []);
}

export function getRoleLabel(role: UserRole, dynamicRoles: { value: string; label: string }[] = []) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  const source = dynamicRoles.length > 0 ? dynamicRoles : cachedDynamicRoles;
  const found = source.find((item) => item.value === role);
  return found ? found.label : (role.charAt(0).toUpperCase() + role.slice(1));
}

export function getFocusLabel(focus: OnboardingFocus) {
  return ONBOARDING_FOCUS.find((item) => item.value === focus)?.label ?? focus;
}

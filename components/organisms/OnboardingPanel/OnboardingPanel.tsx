"use client";

import Link from "next/link";
import { LuFishSymbol } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { useAuthFormSubmitStyles, useButtonStyles } from "@/components/atoms/Button/button.hooks";
import {
  getFocusLabel,
  getTeamLabel,
  ONBOARDING_FOCUS,
  ONBOARDING_TEAMS,
  useOnboardingPanel,
} from "./onboardingPanel.hooks";

type OnboardingPanelProps = {
  defaultName?: string;
};

function ChoiceCard({
  selected,
  label,
  hint,
  onSelect,
}: {
  selected: boolean;
  label: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-2xl px-5 py-4 text-left transition-colors",
        selected
          ? "bg-surface-container-high text-on-surface shadow-bloom"
          : "bg-surface-container-low text-on-surface-muted hover:bg-surface-container-high/70",
      ].join(" ")}
    >
      <span className="block text-sm font-medium text-on-surface">{label}</span>
      <span className="mt-1 block text-xs leading-relaxed">{hint}</span>
    </button>
  );
}

export function OnboardingPanel({ defaultName }: OnboardingPanelProps) {
  const submitClassName = useAuthFormSubmitStyles();
  const primaryLinkClass = useButtonStyles("primary");
  const secondaryLinkClass = useButtonStyles("secondary");
  const {
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
    canContinue,
  } = useOnboardingPanel({ defaultName });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="size-10 animate-pulse rounded-2xl bg-surface-container-low" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-surface-container-low lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div className="pointer-events-none absolute inset-0 futuristic-glow opacity-60" aria-hidden />

        <div className="relative z-10">
          <Link href="/landing" className="inline-flex items-center gap-3 text-primary">
            <span className="flex size-10 items-center justify-center bg-surface-container-high text-primary">
              <LuFishSymbol className="size-5" aria-hidden />
            </span>
            <span>
              <span className="font-display text-sm font-semibold">BBAI</span>
              <span className="block text-xs text-on-surface-muted">Boneless Bangus AI</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-secondary">Getting started</p>
          <blockquote className="font-display text-2xl font-semibold leading-snug text-on-surface xl:text-3xl">
            &ldquo;Just a few questions so I know how to help — and what to call you.&rdquo;
          </blockquote>
          <p className="text-sm text-on-surface-muted">— Boneless Bangus AI</p>
          <ul className="space-y-3 pt-2">
            <li className="rounded-xl bg-surface-container-high/80 px-4 py-3 text-sm leading-relaxed text-on-surface-muted">
              Your answers stay on this device — same as other PWA storage.
            </li>
            <li className="rounded-xl bg-surface-container-high/80 px-4 py-3 text-sm leading-relaxed text-on-surface-muted">
              BBAI only uses data your account already has access to.
            </li>
            <li className="rounded-xl bg-surface-container-high/80 px-4 py-3 text-sm leading-relaxed text-on-surface-muted">
              You can redo onboarding anytime from this page.
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-on-surface-muted">Livro Systems Inc.</p>
      </aside>

      <div className="flex flex-col items-center justify-center bg-surface px-6 py-10">
        <div className="mb-6 w-full max-w-md space-y-2 lg:hidden">
          <p className="text-xs font-medium uppercase tracking-wider text-secondary">Getting started</p>
          <p className="font-display text-lg font-semibold leading-snug text-on-surface">
            Tell BBAI a bit about you
          </p>
        </div>

        <main className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-8 shadow-bloom">
          {step !== "done" ? (
            <div className="mb-8">
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container-low">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-on-surface-muted">Step {stepIndex + 1} of 3</p>
            </div>
          ) : null}

          {error ? (
            <p className="mb-6 rounded-xl bg-secondary-container px-4 py-3 text-sm text-secondary">{error}</p>
          ) : null}

          {step === "name" ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-semibold text-on-surface">What&apos;s your name?</h1>
                <p className="mt-2 text-sm text-on-surface-muted">
                  How should BBAI greet you in this workspace?
                </p>
              </div>
              <label className="block space-y-2">
                <Label>Your name</Label>
                <Input
                  id="onboarding-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canContinue) {
                      goNext();
                    }
                  }}
                />
              </label>
              <Button type="button" className={submitClassName} disabled={!canContinue} onClick={goNext}>
                Continue
              </Button>
            </div>
          ) : null}

          {step === "team" ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-semibold text-on-surface">
                  Nice to meet you, {name.trim().split(" ")[0]}.
                </h1>
                <p className="mt-2 text-sm text-on-surface-muted">Which team are you on?</p>
              </div>
              <div className="space-y-3">
                {ONBOARDING_TEAMS.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    selected={team === option.value}
                    label={option.label}
                    hint={option.hint}
                    onSelect={() => setTeam(option.value)}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
                  Back
                </Button>
                <Button type="button" className="flex-1" disabled={!canContinue} onClick={goNext}>
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === "focus" ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-semibold text-on-surface">
                  What should I help with most?
                </h1>
                <p className="mt-2 text-sm text-on-surface-muted">
                  Pick your main use case — you can still ask about anything else.
                </p>
              </div>
              <div className="space-y-3">
                {ONBOARDING_FOCUS.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    selected={focus === option.value}
                    label={option.label}
                    hint={option.hint}
                    onSelect={() => setFocus(option.value)}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
                  Back
                </Button>
                <Button type="button" className="flex-1" disabled={!canContinue || saving} onClick={goNext}>
                  {saving ? "Saving…" : "Finish"}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "done" && profile ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-semibold text-on-surface">
                  You&apos;re all set, {profile.name.trim().split(" ")[0]}.
                </h1>
                <p className="mt-2 text-sm text-on-surface-muted">
                  BBAI will prioritize {getFocusLabel(profile.focus).toLowerCase()} for your{" "}
                  {getTeamLabel(profile.team).toLowerCase()} workflow.
                </p>
              </div>
              <div className="space-y-3 rounded-2xl bg-surface-container-low p-5 text-sm">
                <p>
                  <span className="text-on-surface-muted">Name</span>
                  <span className="mt-1 block font-medium text-on-surface">{profile.name}</span>
                </p>
                <p>
                  <span className="text-on-surface-muted">Team</span>
                  <span className="mt-1 block font-medium text-on-surface">{getTeamLabel(profile.team)}</span>
                </p>
                <p>
                  <span className="text-on-surface-muted">Focus</span>
                  <span className="mt-1 block font-medium text-on-surface">{getFocusLabel(profile.focus)}</span>
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/workspace" className={`${primaryLinkClass} w-full`}>
                  Open BBAI workspace
                </Link>
                <Button type="button" variant="secondary" onClick={restart}>
                  Redo onboarding
                </Button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

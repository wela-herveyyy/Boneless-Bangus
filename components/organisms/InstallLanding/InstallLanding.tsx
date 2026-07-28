"use client";

import Link from "next/link";
import { LuFishSymbol } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { useButtonStyles } from "@/components/atoms/Button/button.hooks";
import { StatusOrb } from "@/components/atoms/StatusOrb/StatusOrb";
import { DesktopWindowFrame } from "@/components/molecules/DesktopWindowFrame/DesktopWindowFrame";
import { FuturisticBackdrop } from "@/components/molecules/FuturisticBackdrop/FuturisticBackdrop";
import { usePwaInstall } from "./installLanding.hooks";

const BBAI_ACRONYMS = [
  "Boneless Bangus Always Informed",
  "Better Business AI Inside",
  "Bangus Brains Always Investigating",
] as const;

const KEY_PILLARS = [
  {
    title: "Task intelligence",
    body: "Scan assigned work, surface overdue items, recommend priorities, and draft tasks from plain language.",
  },
  {
    title: "QA & root cause",
    body: "Analyze bugs, errors, logs, and snippets — suggest likely causes and where to look next.",
  },
  {
    title: "Permission-bound context",
    body: "Answers only from your site, role, and records — the same access you already have manually.",
  },
] as const;

const PREVIEW_LINES = [
  "3 overdue tasks — Task A blocks two dev items.",
  "Login HTTP 500 → check auth middleware & DB config.",
  "School setup: verify academic year + enrollment roles.",
] as const;

export function InstallLanding() {
  const { isStandalone, canInstall, installOutcome, installApp } = usePwaInstall();
  const primaryLinkClass = useButtonStyles("primary");
  const secondaryLinkClass = useButtonStyles("secondary");

  const statusVariant = isStandalone ? "complete" : canInstall ? "progress" : "neutral";
  const statusLabel = isStandalone
    ? "PWA ready"
    : canInstall
      ? "Install available"
      : "Sign in to start";

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <FuturisticBackdrop />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8 flex items-center justify-between gap-4 pb-4 lg:mb-10">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-on-surface-muted transition-colors hover:text-primary"
            >
              ← Home
            </Link>
            <Link
              href="/docs"
              className="text-sm text-on-surface-muted transition-colors hover:text-primary"
            >
              Docs
            </Link>
            <span className="hidden text-sm text-on-surface-muted lg:inline">BBAI workspace</span>
          </div>
          <StatusOrb label={statusLabel} variant={statusVariant} />
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center bg-surface-container-low text-primary">
                  <LuFishSymbol className="size-7" aria-hidden />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight text-primary">BBAI</p>
                  <p className="text-sm text-on-surface-muted">Boneless Bangus AI</p>
                </div>
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.25em] text-secondary">
                Livro Systems Inc.
              </p>
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-on-surface sm:text-5xl lg:text-[3.25rem]">
                Boneless Bangus AI
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-on-surface-muted">
                BBAI is Livro&apos;s internal assistant — help with tasks, bugs, and school setups,
                using only the data your account already has access to.
              </p>
            </div>

            <div className="space-y-3 rounded-xl bg-surface-container-low/80 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted">
                Quick introduction
              </p>
              <p className="text-sm leading-relaxed text-on-surface-muted">
                <strong className="text-on-surface">BBAI</strong> stands for{" "}
                <strong className="text-on-surface">Boneless Bangus AI</strong> — unofficially also:
              </p>
              <ul className="space-y-1 text-sm text-on-surface-muted">
                {BBAI_ACRONYMS.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-4 lg:gap-5">
              <Link href="/sign-in" className={`${primaryLinkClass} px-8 py-3.5 text-base`}>
                Sign in
              </Link>
              {isStandalone ? (
                <Button variant="success" disabled className="px-8 py-3.5 text-base">
                  Installed on desktop
                </Button>
              ) : canInstall ? (
                <Button onClick={installApp} className="px-8 py-3.5 text-base">
                  Install PWA
                </Button>
              ) : (
                <span className={`${secondaryLinkClass} px-8 py-3.5 text-base opacity-60`}>
                  PWA install on desktop
                </span>
              )}
            </div>

            {installOutcome === "dismissed" ? (
              <p className="text-sm text-on-surface-muted">
                Install dismissed — use the browser install icon to add BBAI to your desktop.
              </p>
            ) : null}

            <dl className="hidden gap-6 border-t border-primary/10 pt-6 sm:grid sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wider text-on-surface-muted">Scope</dt>
                <dd className="mt-1 font-display text-lg font-semibold text-primary">Your access</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-on-surface-muted">Users</dt>
                <dd className="mt-1 font-display text-lg font-semibold text-on-surface">Teams & QA</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-on-surface-muted">Delivery</dt>
                <dd className="mt-1 font-display text-lg font-semibold text-on-surface">PWA + skills</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="futuristic-frame rounded-2xl bg-surface-container-low/60 p-4 backdrop-blur-sm lg:p-5">
              <DesktopWindowFrame title="BBAI — Livro Systems">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-surface-container-low text-primary ring-1 ring-primary/10">
                      <LuFishSymbol className="size-11" aria-hidden />
                    </div>
                    <h2 className="font-display text-2xl font-semibold text-primary">Boneless Bangus AI</h2>
                    <p className="mt-2 text-base text-on-surface-muted">
                      Tasks · bugs · school setup · Good Stuffs plugins
                    </p>
                  </div>
                  <ul className="mt-8 space-y-3 border-t border-primary/10 pt-6">
                    {PREVIEW_LINES.map((line) => (
                      <li
                        key={line}
                        className="rounded-lg bg-surface-container-low px-4 py-3 text-sm leading-relaxed text-on-surface-muted"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </DesktopWindowFrame>
            </div>
          </div>
        </div>

        <section className="mt-12 lg:mt-16">
          <div className="mb-8 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-on-surface lg:text-3xl">
                Core capabilities
              </h2>
              <p className="mt-2 max-w-2xl text-base text-on-surface-muted">
                Less time monitoring tasks and chasing errors — more time shipping work that matters.
              </p>
            </div>
            <div className="hidden h-px flex-1 bg-linear-to-r from-primary/20 to-transparent lg:ml-12 lg:block" aria-hidden />
          </div>

          <ol className="grid gap-6 lg:grid-cols-3 lg:gap-0">
            {KEY_PILLARS.map((step, index) => (
              <li
                key={step.title}
                className="group relative lg:border-l lg:border-primary/15 lg:px-6 lg:first:border-l-0 lg:first:pl-0"
              >
                <div className="rounded-xl bg-surface-container-low/80 p-5 backdrop-blur-sm transition-colors hover:bg-surface-container-high/80 lg:rounded-none lg:bg-transparent lg:p-0 lg:backdrop-blur-none lg:hover:bg-transparent">
                  <span className="font-display text-3xl font-semibold text-primary/25 lg:text-4xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-semibold text-primary lg:mt-6">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-base leading-relaxed text-on-surface-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

export function InstallLandingFallback() {
  return (
    <div className="relative min-h-screen bg-surface">
      <FuturisticBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-surface-container-low" />
        <div className="mt-16 h-64 animate-pulse rounded-2xl bg-surface-container-low" />
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { LuFishSymbol } from "react-icons/lu";
import { FuturisticBackdrop } from "@/components/molecules/FuturisticBackdrop/FuturisticBackdrop";
import {
  getAuthShellContent,
  getAuthWisdom,
  type AuthShellVariant,
} from "./authShell.hooks";

type AuthShellProps = {
  title: string;
  description: string;
  variant: AuthShellVariant;
  children: ReactNode;
};

export function AuthShell({ title, description, variant, children }: AuthShellProps) {
  const content = getAuthShellContent(title, description);
  const wisdom = getAuthWisdom(variant);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-surface-container-low lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <FuturisticBackdrop />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 text-primary">
            <span className="flex size-10 items-center justify-center bg-surface-container-high text-primary">
              <LuFishSymbol className="size-5" aria-hidden />
            </span>
            <span>
              <span className="font-display text-sm font-semibold">Giya</span>
              <span className="block text-xs text-on-surface-muted">Guide · Steer · Direct</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-secondary">
            {wisdom.eyebrow}
          </p>
          <blockquote className="font-display text-2xl font-semibold leading-snug text-on-surface xl:text-3xl">
            &ldquo;{wisdom.quote}&rdquo;
          </blockquote>
          <p className="text-sm text-on-surface-muted">{wisdom.attribution}</p>
          <ul className="space-y-3 pt-2">
            {wisdom.tips.map((tip) => (
              <li
                key={tip}
                className="rounded-xl bg-surface-container-high/80 px-4 py-3 text-sm leading-relaxed text-on-surface-muted"
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-on-surface-muted">Livro Systems Inc.</p>
      </aside>

      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-surface px-6 py-10">
        <FuturisticBackdrop />
        <div className="mb-6 w-full max-w-md space-y-2 lg:hidden">
          <p className="text-xs font-medium uppercase tracking-wider text-secondary">{wisdom.eyebrow}</p>
          <p className="font-display text-lg font-semibold leading-snug text-on-surface">
            &ldquo;{wisdom.quote}&rdquo;
          </p>
        </div>
        <main className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-8 shadow-bloom">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="font-display text-3xl font-semibold text-on-surface">{content.title}</h1>
            <p className="mt-2 text-sm text-on-surface-muted">{content.description}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AuthShellFallback({
  title,
  variant = "sign-in",
}: {
  title: string;
  variant?: AuthShellVariant;
}) {
  return (
    <AuthShell title={title} description="Loading..." variant={variant}>
      <div />
    </AuthShell>
  );
}

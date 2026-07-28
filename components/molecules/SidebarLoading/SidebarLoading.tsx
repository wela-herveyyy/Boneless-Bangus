"use client";

import type { ReactNode } from "react";

type SidebarLoadingProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  /** Skeleton shape hints for the panel content below the header. */
  variant?: "connection" | "overview";
};

export function SidebarLoading({
  title,
  subtitle = "This only takes a moment.",
  icon,
  variant = "connection",
}: SidebarLoadingProps) {
  return (
    <div className="flex flex-col gap-5 py-2" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-surface-container-low/80 px-4 py-8 text-center">
        <div className="relative flex size-14 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/15 [animation-duration:1.6s]" />
          <span className="absolute inset-1 animate-pulse rounded-2xl bg-primary/10" />
          <span className="relative flex size-12 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary shadow-bloom">
            {icon ?? (
              <span className="size-5 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
            )}
          </span>
        </div>
        <div className="space-y-1.5">
          <p className="font-display text-sm font-semibold text-on-surface">{title}</p>
          <p className="text-xs leading-relaxed text-on-surface-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary" />
        </div>
      </div>

      {variant === "overview" ? (
        <div className="space-y-2" aria-hidden>
          <div className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
          <div className="h-16 animate-pulse rounded-xl bg-surface-container-low [animation-delay:75ms]" />
          <div className="h-16 animate-pulse rounded-xl bg-surface-container-low [animation-delay:150ms]" />
          <div className="mt-3 space-y-1.5">
            <div className="h-9 animate-pulse rounded-xl bg-surface-container-low" />
            <div className="h-9 animate-pulse rounded-xl bg-surface-container-low [animation-delay:75ms]" />
          </div>
        </div>
      ) : (
        <div className="space-y-2" aria-hidden>
          <div className="h-24 animate-pulse rounded-2xl bg-surface-container-low" />
          <div className="h-10 animate-pulse rounded-xl bg-surface-container-low [animation-delay:100ms]" />
        </div>
      )}
    </div>
  );
}

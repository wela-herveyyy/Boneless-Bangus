export type StatusOrbVariant = "progress" | "complete" | "neutral";

export type StatusOrbProps = {
  label: string;
  variant?: StatusOrbVariant;
};

const variantStyles: Record<StatusOrbVariant, string> = {
  progress: "bg-secondary-container text-secondary shadow-[0_0_24px_color-mix(in_srgb,var(--secondary)_25%,transparent)]",
  complete: "bg-tertiary/15 text-tertiary shadow-[0_0_24px_color-mix(in_srgb,var(--tertiary)_20%,transparent)]",
  neutral: "bg-surface-container-high text-on-surface-muted",
};

export function useStatusOrb({ variant = "neutral" }: { variant?: StatusOrbVariant }) {
  const className = variantStyles[variant];
  return {
    className,
  };
}

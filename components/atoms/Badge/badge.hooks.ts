export type BadgeVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "muted"
  | "danger"
  | "success";

export function useBadgeStyles(variant: BadgeVariant = "muted", className?: string) {
  const baseStyle =
    "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide transition-colors";

  const variantStyles: Record<BadgeVariant, string> = {
    primary: "bg-primary/15 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    tertiary:
      "bg-tertiary/15 text-tertiary shadow-[0_0_16px_color-mix(in_srgb,var(--tertiary)_15%,transparent)]",
    muted: "bg-surface-container-high text-on-surface-muted",
    danger: "bg-secondary/15 text-secondary",
    success: "bg-tertiary/15 text-tertiary",
  };

  return [baseStyle, variantStyles[variant], className].filter(Boolean).join(" ");
}

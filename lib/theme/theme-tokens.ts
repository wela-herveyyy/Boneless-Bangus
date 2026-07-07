export const THEME_TOKEN_KEYS = [
  "--surface",
  "--on-surface",
  "--surface-container-low",
  "--surface-container-lowest",
  "--surface-container-high",
  "--surface-container-highest",
  "--surface-bright",
  "--surface-variant",
  "--primary",
  "--primary-container",
  "--on-primary",
  "--secondary",
  "--secondary-container",
  "--on-secondary",
  "--tertiary",
  "--outline-variant",
  "--on-surface-muted",
  "--shadow-bloom",
  "--radius",
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
export type ThemeVars = Record<ThemeTokenKey, string>;

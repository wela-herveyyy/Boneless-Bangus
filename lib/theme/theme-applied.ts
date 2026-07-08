import type { ThemeVars } from "./theme-tokens";

export const THEME_APPLIED_VARS_KEY = "rnd-theme-applied";

export function readAppliedThemeVars(): ThemeVars | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(THEME_APPLIED_VARS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThemeVars;
  } catch {
    return null;
  }
}

export function persistAppliedThemeVars(vars: ThemeVars): void {
  window.localStorage.setItem(THEME_APPLIED_VARS_KEY, JSON.stringify(vars));
}

import { getDefaultThemePreset, getThemePreset } from "./theme-presets";
import { THEME_TOKEN_KEYS, type ThemeTokenKey, type ThemeVars } from "./theme-tokens";

export const THEME_STORAGE_KEY = "rnd-theme";

type StoredTheme = {
  presetId?: string;
  customVars?: Partial<ThemeVars>;
};

export function themeVarsToCss(vars: ThemeVars): string {
  const lines = THEME_TOKEN_KEYS.map((key) => `  ${key}: ${vars[key]};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

export function parseThemeCss(css: string): Partial<ThemeVars> | null {
  const vars: Partial<ThemeVars> = {};
  const pattern = /(--[\w-]+)\s*:\s*([^;]+);/g;

  for (const match of css.matchAll(pattern)) {
    const key = match[1] as ThemeTokenKey;
    if (THEME_TOKEN_KEYS.includes(key)) {
      vars[key] = match[2].trim();
    }
  }

  return Object.keys(vars).length > 0 ? vars : null;
}

export function mergeThemeVars(base: ThemeVars, overrides?: Partial<ThemeVars>): ThemeVars {
  return { ...base, ...overrides };
}

export function applyThemeVars(vars: ThemeVars): void {
  const root = document.documentElement;
  for (const key of THEME_TOKEN_KEYS) {
    root.style.setProperty(key, vars[key]);
  }

  if (vars["--radius"] === "0") {
    root.dataset.radius = "sharp";
  } else {
    delete root.dataset.radius;
  }
}

export function clearAppliedThemeVars(): void {
  const root = document.documentElement;
  for (const key of THEME_TOKEN_KEYS) {
    root.style.removeProperty(key);
  }
  delete root.dataset.radius;
}

export function readStoredTheme(): StoredTheme | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTheme;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: StoredTheme): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

export function resolveThemeVars(presetId?: string, customVars?: Partial<ThemeVars>): ThemeVars {
  const base = presetId
    ? (getThemePreset(presetId)?.vars ?? getDefaultThemePreset().vars)
    : getDefaultThemePreset().vars;

  return mergeThemeVars(base, customVars);
}

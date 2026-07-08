import { getDefaultThemePreset, getThemePreset, THEME_PRESETS, type ThemePreset } from "./theme-presets";
import { persistAppliedThemeVars } from "./theme-applied";
import { THEME_TOKEN_KEYS, type ThemeTokenKey, type ThemeVars } from "./theme-tokens";

export const THEME_STORAGE_KEY = "rnd-theme";
export const THEME_CUSTOM_PRESETS_KEY = "rnd-theme-custom";

export type CustomThemePreset = {
  id: string;
  label: string;
  description: string;
  vars: ThemeVars;
  createdAt: number;
};

export type StoredTheme = {
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

  persistAppliedThemeVars(vars);
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

export function readCustomPresets(): CustomThemePreset[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(THEME_CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomThemePreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCustomPresets(presets: CustomThemePreset[]): void {
  window.localStorage.setItem(THEME_CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

export function customPresetToThemePreset(preset: CustomThemePreset): ThemePreset {
  return {
    id: preset.id,
    label: preset.label,
    description: preset.description,
    vars: preset.vars,
  };
}

export function mergePresets(customPresets: CustomThemePreset[]): ThemePreset[] {
  const custom = customPresets.map(customPresetToThemePreset);
  return [...THEME_PRESETS, ...custom];
}

export function findPresetById(
  presetId: string,
  customPresets: CustomThemePreset[] = [],
): ThemePreset | undefined {
  const builtIn = getThemePreset(presetId);
  if (builtIn) return builtIn;

  const custom = customPresets.find((preset) => preset.id === presetId);
  return custom ? customPresetToThemePreset(custom) : undefined;
}

export function resolveThemeVars(
  presetId?: string,
  customVars?: Partial<ThemeVars>,
  customPresets: CustomThemePreset[] = [],
): ThemeVars {
  const base = presetId
    ? (findPresetById(presetId, customPresets)?.vars ?? getDefaultThemePreset().vars)
    : getDefaultThemePreset().vars;

  return mergeThemeVars(base, customVars);
}

export function createCustomPresetId(): string {
  return `custom-${crypto.randomUUID()}`;
}

export function isCustomPresetId(presetId: string): boolean {
  return presetId.startsWith("custom-");
}

export function buildCustomPresetFromCss(
  label: string,
  css: string,
  fallbackVars: ThemeVars,
): CustomThemePreset | null {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) return null;

  const parsed = parseThemeCss(css);
  if (!parsed) return null;

  const vars = mergeThemeVars(fallbackVars, parsed);

  return {
    id: createCustomPresetId(),
    label: trimmedLabel,
    description: "Saved in this browser.",
    vars,
    createdAt: Date.now(),
  };
}

export function getClientThemeState() {
  const defaultPreset = getDefaultThemePreset();
  const customPresets = readCustomPresets();
  const stored = readStoredTheme();
  const presetId = stored?.presetId ?? defaultPreset.id;
  const customVars = stored?.customVars ?? {};
  const activeVars = resolveThemeVars(presetId, customVars, customPresets);

  return {
    customPresets,
    presetId,
    customVars,
    activeVars,
    editorCss: themeVarsToCss(activeVars),
  };
}

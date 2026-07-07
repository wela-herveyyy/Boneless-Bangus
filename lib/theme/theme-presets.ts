import type { ThemeVars } from "./theme-tokens";

export type ThemePreset = {
  id: string;
  label: string;
  description: string;
  vars: ThemeVars;
};

export const DEFAULT_THEME_PRESET_ID = "artisan-teal";

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "artisan-teal",
    label: "Artisan Teal",
    description: "Default — precise teal with warm ochre accents.",
    vars: {
      "--surface": "#f6fafa",
      "--on-surface": "#181c1d",
      "--surface-container-low": "#f0f4f4",
      "--surface-container-lowest": "#ffffff",
      "--surface-container-high": "#e8ecec",
      "--surface-container-highest": "#dee4e4",
      "--surface-bright": "#f6fafa",
      "--surface-variant": "#dce4e4",
      "--primary": "#0a5c66",
      "--primary-container": "#0d8494",
      "--on-primary": "#ffffff",
      "--secondary": "#c76a1a",
      "--secondary-container": "#f4dcc8",
      "--on-secondary": "#ffffff",
      "--tertiary": "#004f4f",
      "--outline-variant": "#bfc8cd",
      "--on-surface-muted": "#5c6568",
      "--shadow-bloom": "0 12px 32px rgb(24 28 29 / 4%)",
      "--radius": "1rem",
    },
  },
  {
    id: "warm-ochre",
    label: "Warm Ochre",
    description: "Sand surfaces with copper primary and amber secondary.",
    vars: {
      "--surface": "#faf7f2",
      "--on-surface": "#1c1814",
      "--surface-container-low": "#f3ede4",
      "--surface-container-lowest": "#ffffff",
      "--surface-container-high": "#ebe3d8",
      "--surface-container-highest": "#e2d8cb",
      "--surface-bright": "#faf7f2",
      "--surface-variant": "#e8dfd2",
      "--primary": "#8b4513",
      "--primary-container": "#b5651d",
      "--on-primary": "#ffffff",
      "--secondary": "#c76a1a",
      "--secondary-container": "#f2dcc4",
      "--on-secondary": "#ffffff",
      "--tertiary": "#5c3d1e",
      "--outline-variant": "#c9bfb2",
      "--on-surface-muted": "#6b6258",
      "--shadow-bloom": "0 12px 32px rgb(28 24 20 / 5%)",
      "--radius": "1rem",
    },
  },
  {
    id: "slate-studio",
    label: "Slate Studio",
    description: "Cool graphite surfaces with indigo primary.",
    vars: {
      "--surface": "#f4f5f8",
      "--on-surface": "#14161c",
      "--surface-container-low": "#eceef2",
      "--surface-container-lowest": "#ffffff",
      "--surface-container-high": "#e2e5eb",
      "--surface-container-highest": "#d6dae3",
      "--surface-bright": "#f4f5f8",
      "--surface-variant": "#d8dce4",
      "--primary": "#2f3f8f",
      "--primary-container": "#4a5fc7",
      "--on-primary": "#ffffff",
      "--secondary": "#6b4c9a",
      "--secondary-container": "#e4d8f2",
      "--on-secondary": "#ffffff",
      "--tertiary": "#1e3a5f",
      "--outline-variant": "#b8bec8",
      "--on-surface-muted": "#5a6170",
      "--shadow-bloom": "0 12px 32px rgb(20 22 28 / 5%)",
      "--radius": "1rem",
    },
  },
  {
    id: "forest-service",
    label: "Forest Service",
    description: "Moss surfaces with deep green primary and clay secondary.",
    vars: {
      "--surface": "#f3f7f4",
      "--on-surface": "#141c18",
      "--surface-container-low": "#eaf0ec",
      "--surface-container-lowest": "#ffffff",
      "--surface-container-high": "#dfe8e2",
      "--surface-container-highest": "#d2ddd6",
      "--surface-bright": "#f3f7f4",
      "--surface-variant": "#d6e2da",
      "--primary": "#1f5c3a",
      "--primary-container": "#2d7a50",
      "--on-primary": "#ffffff",
      "--secondary": "#a85c32",
      "--secondary-container": "#f0dcc8",
      "--on-secondary": "#ffffff",
      "--tertiary": "#0f3d32",
      "--outline-variant": "#b5c4bb",
      "--on-surface-muted": "#55635a",
      "--shadow-bloom": "0 12px 32px rgb(20 28 24 / 5%)",
      "--radius": "1rem",
    },
  },
  {
    id: "mono-brutalist",
    label: "Mono Brutalist",
    description: "Pure black mono, zero radius, hard white shadow blocks.",
    vars: {
      "--surface": "#000000",
      "--on-surface": "#f0f0f0",
      "--surface-container-low": "#0a0a0a",
      "--surface-container-lowest": "#111111",
      "--surface-container-high": "#1a1a1a",
      "--surface-container-highest": "#242424",
      "--surface-bright": "#000000",
      "--surface-variant": "#141414",
      "--primary": "#ffffff",
      "--primary-container": "#d4d4d4",
      "--on-primary": "#000000",
      "--secondary": "#737373",
      "--secondary-container": "#262626",
      "--on-secondary": "#ffffff",
      "--tertiary": "#525252",
      "--outline-variant": "#3f3f3f",
      "--on-surface-muted": "#a3a3a3",
      "--shadow-bloom": "4px 4px 0 rgb(255 255 255 / 100%)",
      "--radius": "0",
    },
  },
];

export function getThemePreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id);
}

export function getDefaultThemePreset(): ThemePreset {
  return getThemePreset(DEFAULT_THEME_PRESET_ID) ?? THEME_PRESETS[0];
}

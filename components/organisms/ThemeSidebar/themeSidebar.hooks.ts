"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_THEME_PRESET_ID,
  getDefaultThemePreset,
  getThemePreset,
  THEME_PRESETS,
} from "@/lib/theme/theme-presets";
import type { ThemeVars } from "@/lib/theme/theme-tokens";
import {
  applyThemeVars,
  mergeThemeVars,
  parseThemeCss,
  readStoredTheme,
  resolveThemeVars,
  themeVarsToCss,
  writeStoredTheme,
} from "@/lib/theme/theme.utils";

export function useThemeSidebar() {
  const defaultPreset = getDefaultThemePreset();
  const [presetId, setPresetId] = useState(defaultPreset.id);
  const [customVars, setCustomVars] = useState<Partial<ThemeVars>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorCss, setEditorCss] = useState(() => themeVarsToCss(defaultPreset.vars));
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [applyState, setApplyState] = useState<"idle" | "applied" | "error">("idle");

  const activeVars = useMemo(
    () => resolveThemeVars(presetId, customVars),
    [presetId, customVars],
  );

  useEffect(() => {
    const stored = readStoredTheme();
    if (!stored) return;

    const nextPresetId = stored.presetId ?? defaultPreset.id;
    const nextCustomVars = stored.customVars ?? {};
    const resolved = resolveThemeVars(nextPresetId, nextCustomVars);

    setPresetId(nextPresetId);
    setCustomVars(nextCustomVars);
    setEditorCss(themeVarsToCss(resolved));
  }, [defaultPreset.id]);

  useEffect(() => {
    applyThemeVars(activeVars);
  }, [activeVars]);

  const selectPreset = useCallback((nextPresetId: string) => {
    const preset = getThemePreset(nextPresetId);
    if (!preset) return;

    setPresetId(nextPresetId);
    setCustomVars({});
    setEditorCss(themeVarsToCss(preset.vars));
    setApplyState("idle");
    writeStoredTheme({ presetId: nextPresetId });
  }, []);

  const resetTheme = useCallback(() => {
    const preset = getDefaultThemePreset();
    setPresetId(preset.id);
    setCustomVars({});
    setEditorCss(themeVarsToCss(preset.vars));
    setApplyState("idle");
    writeStoredTheme({ presetId: DEFAULT_THEME_PRESET_ID });
  }, []);

  const copyThemeCss = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(themeVarsToCss(activeVars));
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }, [activeVars]);

  const applyEditorCss = useCallback(() => {
    const parsed = parseThemeCss(editorCss);
    if (!parsed) {
      setApplyState("error");
      window.setTimeout(() => setApplyState("idle"), 2000);
      return;
    }

    const base = getThemePreset(presetId)?.vars ?? getDefaultThemePreset().vars;
    const merged = mergeThemeVars(base, parsed);

    setCustomVars(parsed);
    setEditorCss(themeVarsToCss(merged));
    setApplyState("applied");
    writeStoredTheme({ presetId, customVars: parsed });
    window.setTimeout(() => setApplyState("idle"), 2000);
  }, [editorCss, presetId]);

  const loadPresetIntoEditor = useCallback(() => {
    const preset = getThemePreset(presetId) ?? getDefaultThemePreset();
    setEditorCss(themeVarsToCss(preset.vars));
    setApplyState("idle");
  }, [presetId]);

  return {
    presets: THEME_PRESETS,
    presetId,
    editorOpen,
    editorCss,
    copyState,
    applyState,
    activeVars,
    setEditorOpen,
    setEditorCss,
    selectPreset,
    resetTheme,
    copyThemeCss,
    applyEditorCss,
    loadPresetIntoEditor,
  };
}

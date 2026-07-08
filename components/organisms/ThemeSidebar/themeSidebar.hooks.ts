"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  DEFAULT_THEME_PRESET_ID,
  getDefaultThemePreset,
} from "@/lib/theme/theme-presets";
import { readAppliedThemeVars } from "@/lib/theme/theme-applied";
import type { ThemeVars } from "@/lib/theme/theme-tokens";
import {
  applyThemeVars,
  buildCustomPresetFromCss,
  findPresetById,
  getClientThemeState,
  isCustomPresetId,
  mergePresets,
  parseThemeCss,
  resolveThemeVars,
  themeVarsToCss,
  writeCustomPresets,
  writeStoredTheme,
  type CustomThemePreset,
} from "@/lib/theme/theme.utils";

function getDefaultState() {
  const defaultPreset = getDefaultThemePreset();
  return {
    customPresets: [] as CustomThemePreset[],
    presetId: defaultPreset.id,
    customVars: {} as Partial<ThemeVars>,
    editorCss: themeVarsToCss(defaultPreset.vars),
  };
}

export function useThemeSidebar() {
  const defaultState = getDefaultState();
  const [ready, setReady] = useState(false);
  const [customPresets, setCustomPresets] = useState<CustomThemePreset[]>(defaultState.customPresets);
  const [presetId, setPresetId] = useState(defaultState.presetId);
  const [customVars, setCustomVars] = useState<Partial<ThemeVars>>(defaultState.customVars);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorCss, setEditorCss] = useState(defaultState.editorCss);
  const [newThemeName, setNewThemeName] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [applyState, setApplyState] = useState<"idle" | "applied" | "error">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const presets = useMemo(() => mergePresets(customPresets), [customPresets]);

  const activeVars = useMemo(
    () => resolveThemeVars(presetId, customVars, customPresets),
    [presetId, customVars, customPresets],
  );

  const activePreset = useMemo(
    () => findPresetById(presetId, customPresets),
    [presetId, customPresets],
  );

  useLayoutEffect(() => {
    const stored = getClientThemeState();
    setCustomPresets(stored.customPresets);
    setPresetId(stored.presetId);
    setCustomVars(stored.customVars);
    setEditorCss(stored.editorCss);

    if (!readAppliedThemeVars()) {
      applyThemeVars(stored.activeVars);
    }

    document.documentElement.dataset.themeReady = "";
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyThemeVars(activeVars);
  }, [activeVars, ready]);

  const selectPreset = useCallback(
    (nextPresetId: string) => {
      const preset = findPresetById(nextPresetId, customPresets);
      if (!preset) return;

      setPresetId(nextPresetId);
      setCustomVars({});
      setEditorCss(themeVarsToCss(preset.vars));
      setApplyState("idle");
      writeStoredTheme({ presetId: nextPresetId });
    },
    [customPresets],
  );

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

    const base = findPresetById(presetId, customPresets)?.vars ?? getDefaultThemePreset().vars;
    const merged = { ...base, ...parsed };

    if (isCustomPresetId(presetId)) {
      const nextCustom = customPresets.map((preset) =>
        preset.id === presetId ? { ...preset, vars: merged } : preset,
      );
      setCustomPresets(nextCustom);
      writeCustomPresets(nextCustom);
      setCustomVars({});
      writeStoredTheme({ presetId });
    } else {
      setCustomVars(parsed);
      writeStoredTheme({ presetId, customVars: parsed });
    }

    setEditorCss(themeVarsToCss(merged));
    setApplyState("applied");
    window.setTimeout(() => setApplyState("idle"), 2000);
  }, [editorCss, presetId, customPresets]);

  const saveCustomTheme = useCallback(() => {
    const base = findPresetById(presetId, customPresets)?.vars ?? getDefaultThemePreset().vars;
    const created = buildCustomPresetFromCss(newThemeName, editorCss, base);

    if (!created) {
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    const nextCustom = [...customPresets, created];
    setCustomPresets(nextCustom);
    writeCustomPresets(nextCustom);
    setPresetId(created.id);
    setCustomVars({});
    setEditorCss(themeVarsToCss(created.vars));
    setNewThemeName("");
    writeStoredTheme({ presetId: created.id });
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 2000);
  }, [newThemeName, editorCss, presetId, customPresets]);

  const deleteCustomTheme = useCallback(
    (targetId: string) => {
      const nextCustom = customPresets.filter((preset) => preset.id !== targetId);
      setCustomPresets(nextCustom);
      writeCustomPresets(nextCustom);

      if (presetId === targetId) {
        const fallback = getDefaultThemePreset();
        setPresetId(fallback.id);
        setCustomVars({});
        setEditorCss(themeVarsToCss(fallback.vars));
        writeStoredTheme({ presetId: fallback.id });
      }
    },
    [customPresets, presetId],
  );

  const loadPresetIntoEditor = useCallback(() => {
    const preset = findPresetById(presetId, customPresets) ?? getDefaultThemePreset();
    setEditorCss(themeVarsToCss(preset.vars));
    setApplyState("idle");
  }, [presetId, customPresets]);

  return {
    ready,
    presets,
    customPresets,
    presetId,
    activePreset,
    editorOpen,
    editorCss,
    newThemeName,
    copyState,
    applyState,
    saveState,
    activeVars,
    setEditorOpen,
    setEditorCss,
    setNewThemeName,
    selectPreset,
    resetTheme,
    copyThemeCss,
    applyEditorCss,
    saveCustomTheme,
    deleteCustomTheme,
    loadPresetIntoEditor,
    isCustomPresetId,
  };
}

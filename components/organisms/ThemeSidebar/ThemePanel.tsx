"use client";

import { HiOutlineClipboardDocument, HiOutlinePaintBrush, HiOutlineTrash } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { useThemeSidebar } from "./themeSidebar.hooks";

/** Theme presets + CSS editor — embeddable (profile modal or sidebar). */
export function ThemePanel() {
  const {
    ready,
    presets,
    presetId,
    activePreset,
    editorOpen,
    editorCss,
    newThemeName,
    copyState,
    applyState,
    saveState,
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
  } = useThemeSidebar();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted">Presets</p>
        {!ready ? (
          <p className="text-xs text-on-surface-muted">Loading themes…</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Theme presets">
              {presets.map((preset) => {
                const isActive = presetId === preset.id;
                const isCustom = isCustomPresetId(preset.id);
                return (
                  <div key={preset.id} className="relative">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      aria-label={preset.label}
                      title={preset.description}
                      onClick={() => selectPreset(preset.id)}
                      className={[
                        "flex w-full flex-col items-center gap-1.5 rounded-xl bg-surface-container-low p-2 transition-colors hover:bg-surface-container-high",
                        isActive ? "ring-2 ring-primary" : "ghost-border",
                      ].join(" ")}
                    >
                      <span className="flex overflow-hidden rounded-md">
                        <span
                          className="size-5"
                          style={{ backgroundColor: preset.vars["--primary"] }}
                          aria-hidden
                        />
                        <span
                          className="size-5"
                          style={{ backgroundColor: preset.vars["--secondary"] }}
                          aria-hidden
                        />
                      </span>
                      <span className="w-full truncate text-center text-[10px] font-medium leading-none text-on-surface-muted">
                        {preset.label}
                      </span>
                    </button>
                    {isCustom ? (
                      <button
                        type="button"
                        aria-label={`Delete ${preset.label}`}
                        onClick={() => deleteCustomTheme(preset.id)}
                        className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-bloom"
                      >
                        <HiOutlineTrash className="size-3" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {activePreset ? (
              <p className="text-xs leading-relaxed text-on-surface-muted">{activePreset.description}</p>
            ) : null}
          </>
        )}
        <p className="text-[10px] leading-relaxed text-on-surface-muted">
          Custom themes are saved in this browser&apos;s local storage.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={copyThemeCss} className="px-4 py-2 text-sm">
          <HiOutlineClipboardDocument className="mr-2 size-4" aria-hidden />
          {copyState === "copied" ? "Copied!" : copyState === "error" ? "Copy failed" : "Copy CSS"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setEditorOpen(!editorOpen)}
          className="px-4 py-2 text-sm"
        >
          <HiOutlinePaintBrush className="mr-2 size-4" aria-hidden />
          {editorOpen ? "Hide editor" : "Customize"}
        </Button>
      </div>

      {editorOpen ? (
        <section className="space-y-4 rounded-2xl bg-surface-container-low p-4">
          <div className="space-y-2">
            <h3 className="font-display text-sm font-semibold text-primary">Paste :root CSS</h3>
            <p className="text-xs leading-relaxed text-on-surface-muted">
              Preview live, then copy into <code className="text-on-surface">app/globals.css</code>.
            </p>
          </div>

          <textarea
            value={editorCss}
            onChange={(event) => setEditorCss(event.target.value)}
            spellCheck={false}
            rows={12}
            className="input-glow w-full resize-y rounded-xl bg-surface-container-lowest p-3 font-mono text-xs leading-6 text-on-surface outline-none"
            aria-label="Theme CSS editor"
          />

          <div className="flex flex-wrap gap-2">
            <Button onClick={applyEditorCss} className="px-4 py-2 text-sm">
              {applyState === "applied"
                ? "Applied!"
                : applyState === "error"
                  ? "Invalid CSS"
                  : "Apply preview"}
            </Button>
            <Button variant="secondary" onClick={loadPresetIntoEditor} className="px-4 py-2 text-sm">
              Load preset
            </Button>
            <Button variant="secondary" onClick={resetTheme} className="px-4 py-2 text-sm">
              Reset default
            </Button>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium uppercase tracking-wider text-on-surface-muted">
              Save to library
            </p>
            <input
              type="text"
              value={newThemeName}
              onChange={(event) => setNewThemeName(event.target.value)}
              placeholder="Theme name"
              className="input-glow w-full rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none"
            />
            <Button onClick={saveCustomTheme} className="w-full px-4 py-2 text-sm">
              {saveState === "saved"
                ? "Saved!"
                : saveState === "error"
                  ? "Name or CSS invalid"
                  : "Save theme"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

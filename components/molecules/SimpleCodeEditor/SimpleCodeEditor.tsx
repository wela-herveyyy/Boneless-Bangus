"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import type { OnMount, BeforeMount } from "@monaco-editor/react";
import type { editor as MonacoEditorNs, Uri } from "monaco-editor";
import { createPortal } from "react-dom";
import { LuLoaderCircle, LuX } from "react-icons/lu";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-48 items-center justify-center gap-2 text-xs text-on-surface-muted">
      <LuLoaderCircle className="size-3.5 animate-spin text-primary" />
      Loading editor…
    </div>
  ),
});

export type SimpleCodeLanguage = "markup" | "css" | "javascript" | "markdown" | "plain";

/** Map Output Source field keys → editor language. */
export function languageForSourceField(fieldKey: string): SimpleCodeLanguage {
  switch (fieldKey) {
    case "html":
    case "main_section_html":
      return "markup";
    case "css":
    case "custom_css":
      return "css";
    case "javascript":
    case "client_script":
      return "javascript";
    case "main_section_md":
      return "markdown";
    default:
      return "plain";
  }
}

function monacoLanguage(language: SimpleCodeLanguage): string {
  switch (language) {
    case "markup":
      return "html";
    case "plain":
      return "plaintext";
    default:
      return language;
  }
}

const THEME_ID = "bbai-light";

const beforeMount: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(THEME_ID, {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6b7c7c", fontStyle: "italic" },
      { token: "tag", foreground: "0f766e" },
      { token: "keyword", foreground: "0f766e" },
      { token: "string", foreground: "0d9488" },
      { token: "number", foreground: "c2410c" },
      { token: "attribute.name", foreground: "0f766e" },
      { token: "attribute.value", foreground: "0d9488" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#1a2b2b",
      "editor.lineHighlightBackground": "#f0f4f4",
      "editorLineNumber.foreground": "#8aa0a0",
      "editorLineNumber.activeForeground": "#0f766e",
      "editorCursor.foreground": "#0f766e",
      "editor.selectionBackground": "#0f766e33",
      "editorIndentGuide.background": "#e2eaea",
      "editorIndentGuide.activeBackground": "#b8c9c9",
      "editorError.foreground": "#c2410c",
      "editorWarning.foreground": "#ea580c",
      "scrollbarSlider.background": "#0f766e22",
      "scrollbarSlider.hoverBackground": "#0f766e44",
    },
  });

  // Frappe/Jinja templates trip HTML validation — keep gutter diagnostics for CSS/JS.
  monaco.languages.html.htmlDefaults.setOptions({
    validate: false,
    autoClosingTags: true,
  });
  monaco.languages.css.cssDefaults.setOptions({
    validate: true,
    lint: {
      compatibleVendorPrefixes: "ignore",
      vendorPrefix: "ignore",
      duplicateProperties: "warning",
      emptyRules: "warning",
      importStatement: "ignore",
      boxModel: "ignore",
      universalSelector: "ignore",
      zeroUnits: "ignore",
      fontFaceProperties: "warning",
      hexColorLength: "error",
      argumentsInColorFunction: "error",
      unknownProperties: "warning",
      ieHack: "ignore",
      unknownVendorSpecificProperties: "ignore",
      propertyIgnoredDueToDisplay: "warning",
      important: "ignore",
      float: "ignore",
      idSelector: "ignore",
    },
  });
  // Syntax only — Frappe client scripts use globals (frappe, cur_frm) that aren't typed here.
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: true,
  });
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    allowNonTsExtensions: true,
    checkJs: false,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    lib: ["esnext", "dom"],
  });
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  language?: SimpleCodeLanguage;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  disabled?: boolean;
};

type MarkerSummary = {
  errors: number;
  warnings: number;
};

function countMarkers(markers: MonacoEditorNs.IMarker[]): MarkerSummary {
  let errors = 0;
  let warnings = 0;
  for (const m of markers) {
    // MarkerSeverity.Error = 8, Warning = 4
    if (m.severity === 8) errors += 1;
    else if (m.severity === 4) warnings += 1;
  }
  return { errors, warnings };
}

export function SimpleCodeEditor({
  value,
  onChange,
  language = "plain",
  placeholder,
  "aria-label": ariaLabel,
  className,
  disabled,
}: Props) {
  const editorRef = useRef<MonacoEditorNs.IStandaloneCodeEditor | null>(null);
  const [markers, setMarkers] = useState<MarkerSummary>({ errors: 0, warnings: 0 });

  const onMount: OnMount = useCallback((ed, monaco) => {
    editorRef.current = ed;
    const model = ed.getModel();
    if (!model) return;

    const syncMarkers = () => {
      setMarkers(countMarkers(monaco.editor.getModelMarkers({ resource: model.uri })));
    };
    syncMarkers();
    const sub = monaco.editor.onDidChangeMarkers((uris: readonly Uri[]) => {
      if (uris.some((u: Uri) => u.toString() === model.uri.toString())) syncMarkers();
    });

    ed.onDidDispose(() => {
      sub.dispose();
      editorRef.current = null;
    });
  }, []);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: Boolean(disabled) });
  }, [disabled]);

  const lang = monacoLanguage(language);
  const showStatus = markers.errors > 0 || markers.warnings > 0;

  return (
    <div
      className={[
        "bbai-simple-code-editor flex min-h-0 flex-1 flex-col bg-surface",
        className ?? "",
      ].join(" ")}
    >
      <div className="bbai-monaco-editor relative min-h-0 flex-1">
        {placeholder && !value ? (
          <p className="pointer-events-none absolute left-14 top-3 z-10 font-mono text-xs text-on-surface-muted/70">
            {placeholder}
          </p>
        ) : null}
        <Monaco
          height="100%"
          language={lang}
          theme={THEME_ID}
          value={value}
          onChange={(next) => onChange(next ?? "")}
          beforeMount={beforeMount}
          onMount={onMount}
          loading={
            <div className="flex h-full items-center justify-center gap-2 text-xs text-on-surface-muted">
              <LuLoaderCircle className="size-3.5 animate-spin text-primary" />
              Loading editor…
            </div>
          }
          options={{
            readOnly: Boolean(disabled),
            ariaLabel,
            fontSize: 13,
            lineHeight: 20,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            minimap: { enabled: value.length > 800 },
            lineNumbers: "on",
            glyphMargin: true,
            folding: true,
            renderLineHighlight: "line",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: "on",
            wrappingIndent: "indent",
            bracketPairColorization: { enabled: true },
            matchBrackets: "always",
            autoClosingBrackets: "languageDefined",
            autoClosingQuotes: "languageDefined",
            formatOnPaste: false,
            formatOnType: false,
            padding: { top: 12, bottom: 12 },
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            overviewRulerLanes: 2,
            fixedOverflowWidgets: true,
          }}
        />
      </div>
      <div
        className="flex flex-wrap items-center gap-3 px-3 py-1.5 font-mono text-[11px] text-on-surface-muted"
        role="status"
      >
        <span className="capitalize">{lang}</span>
        {showStatus ? (
          <>
            <span aria-hidden>·</span>
            {markers.errors > 0 ? (
              <span className="text-secondary">
                {markers.errors} error{markers.errors === 1 ? "" : "s"}
              </span>
            ) : null}
            {markers.warnings > 0 ? (
              <span>
                {markers.warnings} warning{markers.warnings === 1 ? "" : "s"}
              </span>
            ) : null}
          </>
        ) : (
          <>
            <span aria-hidden>·</span>
            <span className="text-on-surface-muted/70">No syntax issues</span>
          </>
        )}
      </div>
    </div>
  );
}

type PanelPos = { x: number; y: number; w: number; h: number };

/** Draggable / resizable floating shell for detached Output workspaces. */
export function DetachedFloatingPanel({
  title,
  eyebrow = "Detached",
  onDock,
  children,
  minWidth = 720,
  minHeight = 420,
}: {
  title: string;
  eyebrow?: string;
  onDock: () => void;
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
}) {
  const dragRef = useRef<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const [pos, setPos] = useState<PanelPos>(() => {
    if (typeof window === "undefined") {
      return { x: 32, y: 32, w: 1100, h: 720 };
    }
    const w = Math.min(1180, window.innerWidth - 32);
    const h = Math.min(760, window.innerHeight - 32);
    return {
      x: Math.max(12, (window.innerWidth - w) / 2),
      y: Math.max(12, (window.innerHeight - h) / 2),
      w,
      h,
    };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDock]);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { ox: e.clientX, oy: e.clientY, x: pos.x, y: pos.y };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setPos((p) => ({
      ...p,
      x: Math.max(8, Math.min(window.innerWidth - 120, d.x + (e.clientX - d.ox))),
      y: Math.max(8, Math.min(window.innerHeight - 80, d.y + (e.clientY - d.oy))),
    }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-200">
      <div
        className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl bg-surface-container-low shadow-[0_24px_80px_rgba(15,40,40,0.22)]"
        style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h }}
        role="dialog"
        aria-label={title}
      >
        <header
          className="flex cursor-grab items-center justify-between gap-3 px-4 py-3 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
            <h2 className="truncate text-sm font-semibold text-on-surface">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onDock}
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-high px-3 py-2 text-[11px] font-semibold text-on-surface-muted transition-colors hover:text-on-surface"
          >
            <LuX className="size-3.5" />
            Dock
          </button>
        </header>
        <div className="relative mx-3 mb-3 min-h-0 flex-1 overflow-hidden rounded-xl bg-surface-container-lowest">
          {children}
          <div
            className="absolute bottom-1 right-1 z-10 size-4 cursor-se-resize rounded-sm bg-primary/25"
            onPointerDown={(e) => {
              e.stopPropagation();
              const startX = e.clientX;
              const startY = e.clientY;
              const startW = pos.w;
              const startH = pos.h;
              const onMove = (ev: PointerEvent) => {
                setPos((p) => ({
                  ...p,
                  w: Math.max(
                    minWidth,
                    Math.min(window.innerWidth - p.x - 8, startW + (ev.clientX - startX)),
                  ),
                  h: Math.max(
                    minHeight,
                    Math.min(window.innerHeight - p.y - 8, startH + (ev.clientY - startY)),
                  ),
                }));
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
            aria-hidden
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

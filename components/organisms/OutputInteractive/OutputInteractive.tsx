"use client";

import { useRef } from "react";
import {
  LuCode,
  LuExternalLink,
  LuFileDown,
  LuLoaderCircle,
  LuMonitorPlay,
  LuPrinter,
  LuRefreshCw,
  LuSave,
  LuX,
} from "react-icons/lu";
import {
  languageForSourceField,
  SimpleCodeEditor,
} from "@/components/molecules/SimpleCodeEditor/SimpleCodeEditor";
import { useOutputInteractive, type OutputPaneTab } from "./outputInteractive.hooks";

export function OutputInteractive({
  onClose,
  toolLabel,
  canvasId,
}: {
  onClose?: () => void;
  /** Active Tools mode label shown in the header */
  toolLabel?: string;
  /** One canvas per conversation — pin id shown in Output */
  canvasId?: string | null;
} = {}) {
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const {
    state,
    tab,
    setTab,
    source,
    fieldDefs,
    setActiveField,
    setFieldValue,
    saveSource,
    refreshSource,
    schoolSession,
    clear,
    reload,
    downloadPdf,
    canPdf,
  } = useOutputInteractive();

  const printPreview = () => {
    try {
      previewFrameRef.current?.contentWindow?.focus();
      previewFrameRef.current?.contentWindow?.print();
    } catch {
      window.print();
    }
  };

  const tabs: { id: OutputPaneTab; label: string }[] = [
    { id: "preview", label: "Preview" },
    { id: "source", label: "Source" },
  ];

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface-container-low">
      <header className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Output
          </p>
          <h2 className="font-display text-lg font-semibold text-on-surface">
            {state.title || toolLabel || "Live preview"}
          </h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-on-surface-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={[
                  "size-1.5 rounded-full",
                  schoolSession ? "bg-emerald-500" : "bg-secondary",
                ].join(" ")}
              />
              {schoolSession
                ? `School MCP · ${schoolSession.baseUrl.replace(/^https?:\/\//, "")}`
                : "Connect School ERP so Output can use the MCP SID"}
            </span>
            {canvasId ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                {canvasId}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {tab === "preview" && state.frameUrl ? (
            <>
              <button
                type="button"
                onClick={printPreview}
                className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-high px-2.5 py-2 text-[11px] font-semibold text-on-surface-muted transition-colors hover:text-on-surface"
                aria-label="Print preview"
                title="Print"
              >
                <LuPrinter className="size-3.5" />
                Print
              </button>
              {canPdf ? (
                <button
                  type="button"
                  onClick={downloadPdf}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-high px-2.5 py-2 text-[11px] font-semibold text-on-surface-muted transition-colors hover:text-on-surface"
                  aria-label="Download PDF"
                  title="Get PDF"
                >
                  <LuFileDown className="size-3.5" />
                  Get PDF
                </button>
              ) : null}
              <button
                type="button"
                onClick={reload}
                className="flex size-9 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted transition-colors hover:text-on-surface"
                aria-label="Reload preview"
              >
                <LuRefreshCw className="size-4" />
              </button>
            </>
          ) : null}
          {tab === "source" ? (
            <button
              type="button"
              onClick={refreshSource}
              disabled={source.loading || source.saving}
              className="flex size-9 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted transition-colors hover:text-on-surface disabled:opacity-50"
              aria-label="Reload source"
            >
              <LuRefreshCw className={["size-4", source.loading ? "animate-spin" : ""].join(" ")} />
            </button>
          ) : null}
          {state.sourceUrl ? (
            <a
              href={state.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex size-9 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted transition-colors hover:text-on-surface"
              aria-label="Open on school site"
            >
              <LuExternalLink className="size-4" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              clear();
              onClose?.();
            }}
            className="flex size-9 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted transition-colors hover:text-on-surface"
            aria-label="Close output"
          >
            <LuX className="size-4" />
          </button>
        </div>
      </header>

      <div className="mx-5 mb-3 flex items-center gap-2">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-muted hover:text-on-surface",
              ].join(" ")}
            >
              {item.id === "source" ? <LuCode className="size-3.5" aria-hidden /> : null}
              {item.label}
              {item.id === "source" && source.dirty ? (
                <span className="size-1.5 rounded-full bg-secondary" aria-label="Unsaved changes" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="relative mx-5 mb-5 min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface-container-lowest">
        {tab === "preview" ? (
          <>
            {state.status || state.error || state.loading ? (
              <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-medium text-on-surface backdrop-blur-md">
                {state.loading ? (
                  <LuLoaderCircle className="size-3.5 animate-spin text-primary" />
                ) : (
                  <span
                    className={[
                      "size-2 rounded-full",
                      state.error ? "bg-secondary" : "bg-emerald-500",
                    ].join(" ")}
                  />
                )}
                <span className={state.error ? "text-secondary" : "text-on-surface-muted"}>
                  {state.error || state.status}
                </span>
              </div>
            ) : null}

            {state.frameUrl ? (
              <iframe
                key={state.frameUrl}
                ref={previewFrameRef}
                data-bbai-output-preview="1"
                title={state.title || "School ERP preview"}
                src={state.frameUrl}
                className="h-full w-full bg-white"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
              />
            ) : (
              <EmptyPreview toolLabel={toolLabel} />
            )}
          </>
        ) : (
          <SourceEditor
            source={source}
            fieldDefs={fieldDefs}
            onActiveField={setActiveField}
            onChange={setFieldValue}
            onSave={() => void saveSource()}
            hasTarget={Boolean(state.target)}
          />
        )}
      </div>
    </section>
  );
}

function EmptyPreview({ toolLabel }: { toolLabel?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
        <LuMonitorPlay className="size-6" />
      </span>
      <div>
        <p className="font-display text-base font-semibold text-on-surface">Waiting for preview</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-on-surface-muted">
          {toolLabel === "Print format"
            ? "Source edits Print Format html/css. Preview needs a document (e.g. Class name) plus the format."
            : toolLabel === "Web form"
              ? "Source edits Web Form client_script / custom_css. Preview needs a published route."
              : toolLabel === "Web page"
                ? "Source edits Web Page HTML / JavaScript / CSS. Preview needs a published route."
                : `Chat generates the ${toolLabel?.toLowerCase() || "Frappe"} result. Preview and Source use your School MCP session.`}
        </p>
      </div>
    </div>
  );
}

function SourceEditor({
  source,
  fieldDefs,
  onActiveField,
  onChange,
  onSave,
  hasTarget,
}: {
  source: ReturnType<typeof useOutputInteractive>["source"];
  fieldDefs: ReturnType<typeof useOutputInteractive>["fieldDefs"];
  onActiveField: (key: string) => void;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
  hasTarget: boolean;
}) {
  if (!hasTarget) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-container-high text-primary">
          <LuCode className="size-6" />
        </span>
        <p className="max-w-sm text-xs leading-relaxed text-on-surface-muted">
          Open a Web Page, Web Form, or Print Format from chat first — then edit its source here.
        </p>
      </div>
    );
  }

  if (source.loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-on-surface-muted">
        <LuLoaderCircle className="size-4 animate-spin text-primary" />
        Loading source from School ERP…
      </div>
    );
  }

  if (source.error && !source.name) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <p className="text-sm text-secondary">{source.error}</p>
        <p className="max-w-sm text-xs text-on-surface-muted">
          Make sure the document exists and is published on the connected school site.
        </p>
      </div>
    );
  }

  const activeValue = source.fields[source.activeField] ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-on-surface">
            {source.doctype} · {source.name}
          </p>
          <p className="text-[11px] text-on-surface-muted">
            {source.dirty
              ? "Unsaved changes"
              : source.savedAt
                ? `Saved ${source.savedAt}`
                : "Edit and save back to School ERP"}
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={source.saving || !source.dirty}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-br from-primary to-primary-container px-3.5 py-2 text-xs font-semibold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-45"
        >
          {source.saving ? (
            <LuLoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <LuSave className="size-3.5" />
          )}
          {source.saving ? "Saving…" : "Save"}
        </button>
      </div>

      {source.error ? (
        <p className="px-4 pb-2 text-xs text-secondary" role="alert">
          {source.error}
        </p>
      ) : null}

      {source.emptyContent && !source.dirty ? (
        <div className="mx-4 mb-2 rounded-xl bg-secondary/10 px-3 py-2.5 text-[11px] leading-relaxed text-secondary">
          This {source.doctype} exists on School ERP but its content is empty
          {source.contentType ? ` (content type: ${source.contentType})` : ""}.
          Paste HTML below and Save (writes{" "}
          <code className="text-on-surface">main_section_html</code>), or ask chat to fill it
          then reload Preview.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
        {fieldDefs.map((field) => {
          const active = field.key === source.activeField;
          return (
            <button
              key={field.key}
              type="button"
              onClick={() => onActiveField(field.key)}
              className={[
                "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-primary/12 text-primary"
                  : "bg-surface-container-high text-on-surface-muted hover:text-on-surface",
              ].join(" ")}
            >
              {field.label}
            </button>
          );
        })}
      </div>

      <SimpleCodeEditor
        key={source.activeField}
        value={activeValue}
        onChange={(code) => onChange(source.activeField, code)}
        language={languageForSourceField(source.activeField)}
        placeholder={`// ${source.activeField}`}
        aria-label={`${source.activeField} source`}
        disabled={source.saving}
      />
    </div>
  );
}

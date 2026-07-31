"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
  INSERT_TABLE_COMMAND,
  registerTablePlugin,
  registerTableSelectionObserver,
} from "@lexical/table";
import { mergeRegister } from "@lexical/utils";
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from "@lexical/rich-text";
import { $createParagraphNode, $getRoot } from "lexical";
import { $patchStyleText, $setBlocksType } from "@lexical/selection";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  type ElementFormatType,
  type EditorState,
  type LexicalEditor,
} from "lexical";
import { marked } from "marked";
import {
  LuAlignCenter,
  LuAlignJustify,
  LuAlignLeft,
  LuAlignRight,
  LuBold,
  LuFileDown,
  LuItalic,
  LuList,
  LuListOrdered,
  LuStrikethrough,
  LuTable,
  LuUnderline,
  LuX,
} from "react-icons/lu";
import {
  FONT_FAMILIES,
  FONT_SIZES,
  LINE_HEIGHTS,
  PAGE_SIZE_OPTIONS,
  useDocumentEditor,
  type DocumentExportFormat,
  type DocumentPageLayout,
} from "./documentEditor.hooks";

marked.setOptions({ gfm: true, breaks: false });

const EXPORTS: { id: DocumentExportFormat; label: string }[] = [
  { id: "pdf", label: "PDF" },
  { id: "txt", label: "TXT" },
  { id: "docx", label: "DOCX" },
  { id: "csv", label: "CSV" },
  { id: "xlsx", label: "Excel" },
];

function Toolbar({
  layout,
  onLayoutChange,
}: {
  layout: DocumentPageLayout;
  onLayoutChange: (patch: Partial<DocumentPageLayout>) => void;
}) {
  const [editor] = useLexicalComposerContext();

  const formatHeading = (tag: HeadingTagType | "p" | "quote") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (tag === "p") {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }
      if (tag === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
        return;
      }
      $setBlocksType(selection, () => $createHeadingNode(tag));
    });
  };

  const patchStyle = (styles: Record<string, string>) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, styles);
      }
    });
  };

  const align = (value: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      <div className="flex flex-wrap items-center gap-1">
        <ToolbarSelect
          label="Font"
          value={layout.fontFamily}
          onChange={(value) => {
            onLayoutChange({ fontFamily: value });
            patchStyle({ "font-family": value });
          }}
          options={FONT_FAMILIES.map((f) => ({ value: f.value, label: f.label }))}
        />
        <ToolbarSelect
          label="Size"
          value={String(layout.fontSizePx)}
          onChange={(value) => {
            const fontSizePx = Number(value);
            onLayoutChange({ fontSizePx });
            patchStyle({ "font-size": `${fontSizePx}px` });
          }}
          options={FONT_SIZES.map((n) => ({ value: String(n), label: `${n}` }))}
        />
        <ToolbarSelect
          label="Block"
          value="p"
          onChange={(value) => formatHeading(value as HeadingTagType | "p" | "quote")}
          options={[
            { value: "p", label: "Paragraph" },
            { value: "h1", label: "Heading 1" },
            { value: "h2", label: "Heading 2" },
            { value: "h3", label: "Heading 3" },
            { value: "quote", label: "Quote" },
          ]}
        />
        <span className="mx-1 h-4 w-px bg-on-surface/10" aria-hidden />
        <ToolbarButton
          label="Bold"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        >
          <LuBold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        >
          <LuItalic className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        >
          <LuUnderline className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
        >
          <LuStrikethrough className="size-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-on-surface/10" aria-hidden />
        <ToolbarButton label="Align left" onClick={() => align("left")}>
          <LuAlignLeft className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Align center" onClick={() => align("center")}>
          <LuAlignCenter className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => align("right")}>
          <LuAlignRight className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Justify" onClick={() => align("justify")}>
          <LuAlignJustify className="size-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-on-surface/10" aria-hidden />
        <ToolbarButton
          label="Bullet list"
          onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        >
          <LuList className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        >
          <LuListOrdered className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Insert table"
          onClick={() =>
            editor.dispatchCommand(INSERT_TABLE_COMMAND, {
              rows: "3",
              columns: "3",
              includeHeaders: true,
            })
          }
        >
          <LuTable className="size-3.5" />
        </ToolbarButton>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <ToolbarSelect
          label="Line spacing"
          value={String(layout.lineHeight)}
          onChange={(value) => {
            const lineHeight = Number(value);
            onLayoutChange({ lineHeight });
            patchStyle({ "line-height": String(lineHeight) });
          }}
          options={LINE_HEIGHTS.map((n) => ({ value: String(n), label: `${n}×` }))}
        />
        <ToolbarSelect
          label="Paragraph spacing"
          value={String(layout.paragraphSpacingPx)}
          onChange={(value) => onLayoutChange({ paragraphSpacingPx: Number(value) })}
          options={[0, 4, 8, 10, 12, 16, 20, 24, 32].map((n) => ({
            value: String(n),
            label: `${n}px gap`,
          }))}
        />
        <ToolbarSelect
          label="Page size"
          value={layout.pageSize}
          onChange={(value) =>
            onLayoutChange({ pageSize: value as DocumentPageLayout["pageSize"] })
          }
          options={PAGE_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
        <ToolbarSelect
          label="Margins"
          value={String(layout.marginIn)}
          onChange={(value) => onLayoutChange({ marginIn: Number(value) })}
          options={[0.5, 0.75, 1, 1.25, 1.5].map((n) => ({
            value: String(n),
            label: `${n}" margin`,
          }))}
        />
        {layout.pageSize === "custom" ? (
          <>
            <label className="inline-flex items-center gap-1 rounded-lg bg-surface-container-high px-2 py-1 text-[11px] text-on-surface">
              W
              <input
                type="number"
                min={3}
                max={22}
                step={0.1}
                value={layout.customWidthIn}
                onChange={(e) => onLayoutChange({ customWidthIn: Number(e.target.value) || 8.5 })}
                className="w-14 rounded-md bg-surface-container-lowest px-1.5 py-0.5 text-[11px] outline-none"
                aria-label="Custom page width inches"
              />
              in
            </label>
            <label className="inline-flex items-center gap-1 rounded-lg bg-surface-container-high px-2 py-1 text-[11px] text-on-surface">
              H
              <input
                type="number"
                min={3}
                max={22}
                step={0.1}
                value={layout.customHeightIn}
                onChange={(e) => onLayoutChange({ customHeightIn: Number(e.target.value) || 11 })}
                className="w-14 rounded-md bg-surface-container-lowest px-1.5 py-0.5 text-[11px] outline-none"
                aria-label="Custom page height inches"
              />
              in
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ToolbarSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-1">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        title={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-36 rounded-lg bg-surface-container-high px-2 py-1.5 text-[11px] font-semibold text-on-surface outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-surface-container-high px-2 text-xs font-semibold text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
    >
      {children}
    </button>
  );
}

function ChangeBridge({
  onChange,
}: {
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
}) {
  return (
    <OnChangePlugin
      ignoreSelectionChange
      onChange={(editorState, editor) => onChange(editorState, editor)}
    />
  );
}

/** Pull a document title from the first markdown H1, if present. */
function titleFromMarkdown(markdown: string): string | null {
  const match = markdown.match(/^\s*#\s+(.+?)\s*$/m);
  return match?.[1]?.trim() || null;
}

/**
 * Strip a short chat preface before the document body.
 * Keeps from the first markdown heading, or the whole reply if none.
 */
export function documentBodyFromAssistantMarkdown(markdown: string): string {
  const text = markdown.trim();
  if (!text) return "";
  const headingIdx = text.search(/^#{1,6}\s+/m);
  if (headingIdx >= 0) return text.slice(headingIdx).trim();
  return text;
}

/** Ensure headings/tables aren't glued to neighboring lines before HTML convert. */
function normalizeDocumentMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2")
    .replace(/(#{1,6}[^\n]+)\n(?!\n|#{1,6}\s|\||$)/g, "$1\n\n")
    .replace(/([^\n])\n(\|.+\|)\s*\n(\|[-:| ]+\|)/g, "$1\n\n$2\n$3");
}

function TableSupportPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return mergeRegister(
      registerTablePlugin(editor),
      registerTableSelectionObserver(editor, true),
    );
  }, [editor]);
  return null;
}

/** Apply chat assistant markdown into the Lexical document (replace). */
function ChatImportPlugin({
  turnId,
  markdown,
  onTitleHint,
}: {
  turnId: string | null;
  markdown: string;
  onTitleHint?: (title: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!turnId) return;
    const body = normalizeDocumentMarkdown(documentBodyFromAssistantMarkdown(markdown));
    if (!body.trim()) return;
    const key = `${turnId}:${body}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    const hinted = titleFromMarkdown(body);
    if (hinted) onTitleHint?.(hinted);

    const html = marked.parse(body, { async: false }) as string;
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      if (nodes.length) {
        root.append(...nodes);
      } else {
        root.append($createParagraphNode());
      }
    });
  }, [editor, markdown, onTitleHint, turnId]);

  return null;
}

export function DocumentEditor({
  onClose,
  conversationId,
  chatTurnId = null,
  chatMarkdown = "",
}: {
  onClose?: () => void;
  conversationId?: string | null;
  /** Latest assistant turn id — when it changes, content is written into the editor */
  chatTurnId?: string | null;
  /** Latest assistant markdown to place in the document */
  chatMarkdown?: string;
}) {
  const doc = useDocumentEditor(conversationId);
  const onTitleHint = useCallback(
    (nextTitle: string) => {
      if (!doc.title || doc.title === "Untitled document") {
        doc.onTitleChange(nextTitle);
      }
    },
    [doc.onTitleChange, doc.title],
  );

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface-container-low">
      <style>{`
        .bbai-doc-page .doc-p { margin: 0 0 var(--doc-p-gap, 10px); }
        .bbai-doc-page .doc-h1 { margin: 0 0 calc(var(--doc-p-gap, 10px) * 1.2); font-size: 1.75em; font-weight: 650; line-height: 1.25; }
        .bbai-doc-page .doc-h2 { margin: 0 0 var(--doc-p-gap, 10px); font-size: 1.4em; font-weight: 650; line-height: 1.3; }
        .bbai-doc-page .doc-h3 { margin: 0 0 var(--doc-p-gap, 10px); font-size: 1.15em; font-weight: 650; line-height: 1.35; }
        .bbai-doc-page .doc-ul { margin: 0 0 var(--doc-p-gap, 10px); padding-left: 1.25rem; list-style: disc; }
        .bbai-doc-page .doc-ol { margin: 0 0 var(--doc-p-gap, 10px); padding-left: 1.25rem; list-style: decimal; }
        .bbai-doc-page .doc-li { margin: 0.15em 0; }
        .bbai-doc-page .doc-quote { margin: 0 0 var(--doc-p-gap, 10px); padding-left: 0.85rem; color: var(--color-on-surface-muted, #64748b); font-style: italic; box-shadow: inset 3px 0 0 color-mix(in srgb, var(--color-primary, #0f766e) 35%, transparent); }
        .bbai-doc-page .doc-link { color: var(--color-primary, #0f766e); text-decoration: underline; }
        .bbai-doc-page .doc-table,
        .bbai-doc-page table { width: 100%; border-collapse: collapse; margin: 0 0 var(--doc-p-gap, 10px); table-layout: fixed; }
        .bbai-doc-page .doc-td,
        .bbai-doc-page .doc-th,
        .bbai-doc-page td,
        .bbai-doc-page th { border: 1px solid #cbd5e1; padding: 0.4em 0.55em; vertical-align: top; word-break: break-word; }
        .bbai-doc-page .doc-th,
        .bbai-doc-page th { font-weight: 650; background: color-mix(in srgb, var(--color-primary, #0f766e) 8%, #fff); }
      `}</style>

      <header className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Output
          </p>
          <input
            value={doc.title}
            onChange={(e) => doc.onTitleChange(e.target.value)}
            className="mt-1 w-full bg-transparent font-display text-lg font-semibold text-on-surface outline-none placeholder:text-on-surface-muted"
            placeholder="Untitled document"
            aria-label="Document title"
          />
          <p className="mt-1.5 text-[11px] text-on-surface-muted">
            Document Editor · headings, tables, spacing · export PDF / TXT / DOCX / CSV / Excel
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-muted transition-colors hover:text-on-surface"
            aria-label="Close Document Editor"
          >
            <LuX className="size-4" />
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3">
        <LuFileDown className="size-3.5 text-on-surface-muted" aria-hidden />
        {EXPORTS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={Boolean(doc.exporting)}
            onClick={() => void doc.exportDocument(item.id)}
            className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-on-surface transition-colors hover:bg-primary/12 hover:text-primary disabled:opacity-50"
          >
            {doc.exporting === item.id ? "…" : item.label}
          </button>
        ))}
      </div>

      {doc.error ? (
        <p className="px-5 pb-2 text-xs text-red-600">{doc.error}</p>
      ) : null}

      <div className="mx-5 mb-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-bloom">
        {!doc.bootReady ? (
          <div className="flex flex-1 items-center justify-center text-xs text-on-surface-muted">
            Loading editor…
          </div>
        ) : (
          <LexicalComposer initialConfig={doc.initialConfig} key={doc.storageKey}>
            <Toolbar layout={doc.layout} onLayoutChange={doc.setLayout} />
            <div className="min-h-0 flex-1 overflow-auto bg-surface-container-low/60 px-4 py-4">
              <div
                className="bbai-doc-page mx-auto bg-surface-container-lowest text-on-surface shadow-bloom"
                style={doc.pageStyle as CSSProperties}
              >
                <div className="relative">
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        aria-placeholder="Start writing… ask the chat to draft content for this document."
                        placeholder={
                          <div className="pointer-events-none absolute left-0 top-0 text-on-surface-muted opacity-70">
                            Start writing… ask the chat to draft content for this document.
                          </div>
                        }
                        className="min-h-64 outline-none"
                      />
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                </div>
              </div>
            </div>
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
            <TableSupportPlugin />
            <ChatImportPlugin
              turnId={chatTurnId}
              markdown={chatMarkdown}
              onTitleHint={onTitleHint}
            />
            <ChangeBridge onChange={doc.onEditorChange} />
          </LexicalComposer>
        )}
      </div>
    </section>
  );
}

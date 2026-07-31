"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { $generateHtmlFromNodes } from "@lexical/html";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { CodeNode } from "@lexical/code";
import {
  type EditorState,
  type LexicalEditor,
  type SerializedEditorState,
} from "lexical";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ITableCellOptions,
} from "docx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const STORAGE_PREFIX = "bbai_document_editor:";

export type DocumentExportFormat = "pdf" | "txt" | "docx" | "csv" | "xlsx";

export type PageSizePreset = "a4" | "letter" | "legal" | "custom";

export type DocumentPageLayout = {
  pageSize: PageSizePreset;
  /** Custom page width in inches (when pageSize is custom) */
  customWidthIn: number;
  /** Custom page height in inches (when pageSize is custom) */
  customHeightIn: number;
  /** Page margin in inches */
  marginIn: number;
  /** Default body font family */
  fontFamily: string;
  /** Default body font size in px */
  fontSizePx: number;
  /** Line height multiplier */
  lineHeight: number;
  /** Paragraph spacing in px */
  paragraphSpacingPx: number;
};

export const DEFAULT_PAGE_LAYOUT: DocumentPageLayout = {
  pageSize: "a4",
  customWidthIn: 8.5,
  customHeightIn: 11,
  marginIn: 0.75,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSizePx: 14,
  lineHeight: 1.6,
  paragraphSpacingPx: 10,
};

export const FONT_FAMILIES = [
  { value: "Inter, system-ui, sans-serif", label: "Inter" },
  { value: "Manrope, system-ui, sans-serif", label: "Manrope" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "'Courier New', Courier, monospace", label: "Courier" },
] as const;

export const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36] as const;

export const LINE_HEIGHTS = [1, 1.15, 1.5, 1.6, 1.8, 2, 2.5] as const;

export const PAGE_SIZE_OPTIONS: { value: PageSizePreset; label: string }[] = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
  { value: "legal", label: "Legal" },
  { value: "custom", label: "Custom" },
];

const PAGE_SIZE_IN: Record<Exclude<PageSizePreset, "custom">, { w: number; h: number }> = {
  a4: { w: 8.27, h: 11.69 },
  letter: { w: 8.5, h: 11 },
  legal: { w: 8.5, h: 14 },
};

export function pageDimensionsIn(layout: DocumentPageLayout): { w: number; h: number } {
  if (layout.pageSize === "custom") {
    return {
      w: Math.max(3, layout.customWidthIn || 8.5),
      h: Math.max(3, layout.customHeightIn || 11),
    };
  }
  return PAGE_SIZE_IN[layout.pageSize];
}

export function documentStorageKey(conversationId?: string | null) {
  return `${STORAGE_PREFIX}${conversationId?.trim() || "draft"}`;
}

function primaryFont(layout: DocumentPageLayout): string {
  return layout.fontFamily.split(",")[0]?.replace(/['"]/g, "").trim() || "Arial";
}

function halfPoints(px: number): number {
  return Math.max(16, Math.round(px * 1.5));
}

/** Prefer block-aware text so headings/paragraphs don't glue together. */
function plainTextFromHtml(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  const el = document.createElement("div");
  el.innerHTML = html;
  const blocks = el.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,tr");
  if (blocks.length > 0) {
    return Array.from(blocks)
      .map((b) => {
        if (b.tagName.toLowerCase() === "tr") {
          return Array.from(b.querySelectorAll("th,td"))
            .map((c) => (c.textContent || "").trim())
            .join("\t");
        }
        return (b.textContent || "").replace(/\s+/g, " ").trim();
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return (el.innerText || el.textContent || "").replace(/\r\n/g, "\n").trim();
}

function tablesFromHtml(html: string): string[][][] {
  if (typeof document === "undefined") return [];
  const el = document.createElement("div");
  el.innerHTML = html;
  return Array.from(el.querySelectorAll("table")).map((table) =>
    Array.from(table.querySelectorAll("tr")).map((tr) =>
      Array.from(tr.querySelectorAll("th,td")).map((cell) =>
        (cell.textContent || "").replace(/\s+/g, " ").trim(),
      ),
    ),
  );
}

function rowsFromPlainText(text: string): string[][] {
  const lines = text.split("\n").map((line) => line.trimEnd());
  return lines.length ? lines.map((line) => [line]) : [[""]];
}

type InlineStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
};

function collectTextRuns(
  node: Node,
  layout: DocumentPageLayout,
  inherited: InlineStyle = {},
): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (!text) return [];
    return [
      new TextRun({
        text,
        bold: inherited.bold,
        italics: inherited.italic,
        underline: inherited.underline ? {} : undefined,
        strike: inherited.strike,
        font: primaryFont(layout),
        size: halfPoints(layout.fontSizePx),
      }),
    ];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const next: InlineStyle = { ...inherited };
  if (tag === "strong" || tag === "b") next.bold = true;
  if (tag === "em" || tag === "i") next.italic = true;
  if (tag === "u") next.underline = true;
  if (tag === "s" || tag === "strike" || tag === "del") next.strike = true;
  return Array.from(el.childNodes).flatMap((child) => collectTextRuns(child, layout, next));
}

function paragraphFromElement(
  el: HTMLElement,
  layout: DocumentPageLayout,
  opts?: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; bulletPrefix?: string },
): Paragraph {
  const runs = collectTextRuns(el, layout);
  const children =
    opts?.bulletPrefix != null
      ? [
          new TextRun({
            text: opts.bulletPrefix,
            font: primaryFont(layout),
            size: halfPoints(layout.fontSizePx),
          }),
          ...(runs.length ? runs : [new TextRun({ text: " " })]),
        ]
      : runs.length
        ? runs
        : [new TextRun({ text: " " })];

  return new Paragraph({
    heading: opts?.heading,
    spacing: {
      after: Math.round(layout.paragraphSpacingPx * 20),
      line: Math.round(layout.lineHeight * 240),
    },
    children,
  });
}

const THIN_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "CBD5E1",
};

function docxTableFromHtml(tableEl: HTMLElement, layout: DocumentPageLayout, contentWidthDx: number): Table {
  const rows = Array.from(tableEl.querySelectorAll("tr"));
  const colCount = Math.max(
    1,
    ...rows.map((row) => row.querySelectorAll("th,td").length),
  );
  const colWidth = Math.floor(contentWidthDx / colCount);

  return new Table({
    width: { size: contentWidthDx, type: WidthType.DXA },
    columnWidths: Array.from({ length: colCount }, () => colWidth),
    rows: rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("th,td"));
      while (cells.length < colCount) {
        cells.push(document.createElement("td"));
      }
      return new TableRow({
        children: cells.slice(0, colCount).map((cell) => {
          const isHeader = cell.tagName.toLowerCase() === "th";
          const cellOpts: ITableCellOptions = {
            width: { size: colWidth, type: WidthType.DXA },
            borders: {
              top: THIN_BORDER,
              bottom: THIN_BORDER,
              left: THIN_BORDER,
              right: THIN_BORDER,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: (() => {
                  const runs = collectTextRuns(cell, layout, { bold: isHeader || undefined });
                  return runs.length
                    ? runs
                    : [
                        new TextRun({
                          text: " ",
                          bold: isHeader,
                          font: primaryFont(layout),
                          size: halfPoints(layout.fontSizePx),
                        }),
                      ];
                })(),
              }),
            ],
          };
          return new TableCell(cellOpts);
        }),
      });
    }),
  });
}

function docxBlocksFromHtml(
  html: string,
  layout: DocumentPageLayout,
  contentWidthDx: number,
): Array<Paragraph | Table> {
  if (typeof document === "undefined") {
    return [new Paragraph({ children: [new TextRun({ text: plainTextFromHtml(html) || " " })] })];
  }
  const root = document.createElement("div");
  root.innerHTML = html;
  const out: Array<Paragraph | Table> = [];

  const walk = (nodes: NodeListOf<ChildNode> | ChildNode[]) => {
    for (const node of Array.from(nodes)) {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        const text = (node.textContent || "").trim();
        if (text) {
          out.push(
            new Paragraph({
              spacing: {
                after: Math.round(layout.paragraphSpacingPx * 20),
                line: Math.round(layout.lineHeight * 240),
              },
              children: [
                new TextRun({
                  text,
                  font: primaryFont(layout),
                  size: halfPoints(layout.fontSizePx),
                }),
              ],
            }),
          );
        }
        continue;
      }
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (tag === "h1") {
        out.push(paragraphFromElement(el, layout, { heading: HeadingLevel.HEADING_1 }));
      } else if (tag === "h2") {
        out.push(paragraphFromElement(el, layout, { heading: HeadingLevel.HEADING_2 }));
      } else if (tag === "h3") {
        out.push(paragraphFromElement(el, layout, { heading: HeadingLevel.HEADING_3 }));
      } else if (tag === "p" || tag === "blockquote" || tag === "pre") {
        out.push(paragraphFromElement(el, layout));
      } else if (tag === "ul") {
        Array.from(el.children).forEach((li) => {
          if (li.tagName.toLowerCase() === "li") {
            out.push(paragraphFromElement(li as HTMLElement, layout, { bulletPrefix: "• " }));
          }
        });
      } else if (tag === "ol") {
        Array.from(el.children).forEach((li, i) => {
          if (li.tagName.toLowerCase() === "li") {
            out.push(
              paragraphFromElement(li as HTMLElement, layout, { bulletPrefix: `${i + 1}. ` }),
            );
          }
        });
      } else if (tag === "table") {
        out.push(docxTableFromHtml(el, layout, contentWidthDx));
      } else if (tag === "div" || tag === "section" || tag === "article") {
        walk(el.childNodes);
      } else {
        out.push(paragraphFromElement(el, layout));
      }
    }
  };

  walk(root.childNodes);
  return out.length ? out : [new Paragraph({ children: [new TextRun({ text: " " })] })];
}

async function exportPdfFromPage(layout: DocumentPageLayout, base: string, html: string) {
  const dims = pageDimensionsIn(layout);
  const pageWmm = dims.w * 25.4;
  const pageHmm = dims.h * 25.4;

  let target = document.querySelector(".bbai-doc-page") as HTMLElement | null;
  let host: HTMLElement | null = null;

  if (!target) {
    host = document.createElement("div");
    host.className = "bbai-doc-page";
    host.style.cssText = [
      "position:fixed",
      "left:-10000px",
      "top:0",
      `width:${dims.w}in`,
      `min-height:${dims.h}in`,
      `padding:${layout.marginIn}in`,
      `font-family:${layout.fontFamily}`,
      `font-size:${layout.fontSizePx}px`,
      `line-height:${layout.lineHeight}`,
      "background:#fff",
      "color:#111",
      "box-sizing:border-box",
    ].join(";");
    host.innerHTML = html;
    document.body.appendChild(host);
    target = host;
  }

  try {
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      unit: "mm",
      format: [pageWmm, pageHmm],
      orientation: pageWmm > pageHmm ? "landscape" : "portrait",
    });
    const imgWidth = pageWmm;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHmm;

    while (heightLeft > 0.5) {
      position = heightLeft - imgHeight;
      pdf.addPage([pageWmm, pageHmm]);
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHmm;
    }

    pdf.save(`${base}.pdf`);
  } finally {
    host?.remove();
  }
}

function normalizeLayout(raw: unknown): DocumentPageLayout {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PAGE_LAYOUT };
  const o = raw as Partial<DocumentPageLayout>;
  return {
    pageSize:
      o.pageSize === "a4" || o.pageSize === "letter" || o.pageSize === "legal" || o.pageSize === "custom"
        ? o.pageSize
        : DEFAULT_PAGE_LAYOUT.pageSize,
    customWidthIn: Number.isFinite(o.customWidthIn) ? Number(o.customWidthIn) : DEFAULT_PAGE_LAYOUT.customWidthIn,
    customHeightIn: Number.isFinite(o.customHeightIn)
      ? Number(o.customHeightIn)
      : DEFAULT_PAGE_LAYOUT.customHeightIn,
    marginIn: Number.isFinite(o.marginIn) ? Number(o.marginIn) : DEFAULT_PAGE_LAYOUT.marginIn,
    fontFamily: typeof o.fontFamily === "string" ? o.fontFamily : DEFAULT_PAGE_LAYOUT.fontFamily,
    fontSizePx: Number.isFinite(o.fontSizePx) ? Number(o.fontSizePx) : DEFAULT_PAGE_LAYOUT.fontSizePx,
    lineHeight: Number.isFinite(o.lineHeight) ? Number(o.lineHeight) : DEFAULT_PAGE_LAYOUT.lineHeight,
    paragraphSpacingPx: Number.isFinite(o.paragraphSpacingPx)
      ? Number(o.paragraphSpacingPx)
      : DEFAULT_PAGE_LAYOUT.paragraphSpacingPx,
  };
}

export function useDocumentEditor(conversationId?: string | null) {
  const storageKey = useMemo(() => documentStorageKey(conversationId), [conversationId]);
  const [title, setTitle] = useState("Untitled document");
  const [html, setHtml] = useState("<p></p>");
  const [plainText, setPlainText] = useState("");
  const [serialized, setSerialized] = useState<SerializedEditorState | null>(null);
  const [bootSerialized, setBootSerialized] = useState<SerializedEditorState | null>(null);
  const [bootReady, setBootReady] = useState(false);
  const [layout, setLayoutState] = useState<DocumentPageLayout>(DEFAULT_PAGE_LAYOUT);
  const [exporting, setExporting] = useState<DocumentExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBootReady(false);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setTitle("Untitled document");
        setHtml("<p></p>");
        setPlainText("");
        setSerialized(null);
        setBootSerialized(null);
        setLayoutState({ ...DEFAULT_PAGE_LAYOUT });
      } else {
        const parsed = JSON.parse(raw) as {
          title?: string;
          html?: string;
          plainText?: string;
          serialized?: SerializedEditorState;
          layout?: unknown;
        };
        setTitle(parsed.title?.trim() || "Untitled document");
        setHtml(parsed.html || "<p></p>");
        setPlainText(parsed.plainText || "");
        setSerialized(parsed.serialized ?? null);
        setBootSerialized(parsed.serialized ?? null);
        setLayoutState(normalizeLayout(parsed.layout));
      }
    } catch {
      setTitle("Untitled document");
      setHtml("<p></p>");
      setPlainText("");
      setSerialized(null);
      setBootSerialized(null);
      setLayoutState({ ...DEFAULT_PAGE_LAYOUT });
    }
    setBootReady(true);
  }, [storageKey]);

  const persist = useCallback(
    (next: {
      title: string;
      html: string;
      plainText: string;
      serialized: SerializedEditorState | null;
      layout: DocumentPageLayout;
    }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey],
  );

  const onEditorChange = useCallback(
    (editorState: EditorState, lexEditor: LexicalEditor) => {
      editorState.read(() => {
        const nextHtml = $generateHtmlFromNodes(lexEditor);
        const nextText = plainTextFromHtml(nextHtml);
        const nextSerialized = editorState.toJSON();
        setHtml(nextHtml);
        setPlainText(nextText);
        setSerialized(nextSerialized);
        persist({
          title,
          html: nextHtml,
          plainText: nextText,
          serialized: nextSerialized,
          layout,
        });
      });
    },
    [layout, persist, title],
  );

  const onTitleChange = useCallback(
    (next: string) => {
      setTitle(next);
      persist({ title: next, html, plainText, serialized, layout });
    },
    [html, layout, plainText, persist, serialized],
  );

  const setLayout = useCallback(
    (patch: Partial<DocumentPageLayout>) => {
      setLayoutState((prev) => {
        const next = { ...prev, ...patch };
        persist({ title, html, plainText, serialized, layout: next });
        return next;
      });
    },
    [html, plainText, persist, serialized, title],
  );

  const exportDocument = useCallback(
    async (format: DocumentExportFormat) => {
      setError(null);
      setExporting(format);
      const base = (title.trim() || "document").replace(/[\\/:*?"<>|]+/g, "_");
      const dims = pageDimensionsIn(layout);
      try {
        if (format === "txt") {
          saveAs(new Blob([plainText || ""], { type: "text/plain;charset=utf-8" }), `${base}.txt`);
          return;
        }

        if (format === "csv" || format === "xlsx") {
          const tables = tablesFromHtml(html);
          const book = XLSX.utils.book_new();
          if (tables.length > 0) {
            tables.forEach((table, i) => {
              const sheet = XLSX.utils.aoa_to_sheet(table.length ? table : [[""]]);
              XLSX.utils.book_append_sheet(book, sheet, tables.length === 1 ? "Table" : `Table ${i + 1}`);
            });
          } else {
            const sheet = XLSX.utils.aoa_to_sheet(rowsFromPlainText(plainText || ""));
            XLSX.utils.book_append_sheet(book, sheet, "Document");
          }
          if (format === "csv") {
            const first = book.SheetNames[0];
            const csv = XLSX.utils.sheet_to_csv(book.Sheets[first]!);
            saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${base}.csv`);
          } else {
            const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
            saveAs(
              new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              }),
              `${base}.xlsx`,
            );
          }
          return;
        }

        if (format === "docx") {
          const contentWidthDx = Math.round((dims.w - layout.marginIn * 2) * 1440);
          const children = docxBlocksFromHtml(html, layout, contentWidthDx);
          const doc = new Document({
            sections: [
              {
                properties: {
                  page: {
                    size: {
                      width: Math.round(dims.w * 1440),
                      height: Math.round(dims.h * 1440),
                    },
                    margin: {
                      top: Math.round(layout.marginIn * 1440),
                      bottom: Math.round(layout.marginIn * 1440),
                      left: Math.round(layout.marginIn * 1440),
                      right: Math.round(layout.marginIn * 1440),
                    },
                  },
                },
                children,
              },
            ],
          });
          const blob = await Packer.toBlob(doc);
          saveAs(blob, `${base}.docx`);
          return;
        }

        if (format === "pdf") {
          await exportPdfFromPage(layout, base, html);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Export failed.");
      } finally {
        setExporting(null);
      }
    },
    [html, layout, plainText, title],
  );

  const initialConfig = useMemo(
    () => ({
      namespace: "BbaiDocumentEditor",
      theme: {
        paragraph: "doc-p",
        heading: {
          h1: "doc-h1",
          h2: "doc-h2",
          h3: "doc-h3",
        },
        list: {
          ul: "doc-ul",
          ol: "doc-ol",
          listitem: "doc-li",
        },
        quote: "doc-quote",
        link: "doc-link",
        table: "doc-table",
        tableCell: "doc-td",
        tableCellHeader: "doc-th",
        text: {
          bold: "font-semibold",
          italic: "italic",
          underline: "underline",
          strikethrough: "line-through",
        },
      },
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        AutoLinkNode,
        CodeNode,
        TableNode,
        TableCellNode,
        TableRowNode,
      ],
      onError(err: Error) {
        console.error("[DocumentEditor]", err);
      },
      editorState: bootSerialized ? JSON.stringify(bootSerialized) : undefined,
    }),
    [bootSerialized],
  );

  const pageStyle = useMemo(() => {
    const dims = pageDimensionsIn(layout);
    return {
      width: `${dims.w}in`,
      minHeight: `${dims.h}in`,
      padding: `${layout.marginIn}in`,
      fontFamily: layout.fontFamily,
      fontSize: `${layout.fontSizePx}px`,
      lineHeight: String(layout.lineHeight),
      ["--doc-p-gap" as string]: `${layout.paragraphSpacingPx}px`,
    } as CSSProperties;
  }, [layout]);

  return {
    title,
    onTitleChange,
    html,
    plainText,
    initialConfig,
    onEditorChange,
    exportDocument,
    exporting,
    error,
    storageKey,
    bootReady,
    layout,
    setLayout,
    pageStyle,
  };
}

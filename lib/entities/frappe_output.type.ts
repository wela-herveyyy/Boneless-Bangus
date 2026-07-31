export const FRAPPE_OUTPUT_KIND = {
  PRINT_FORMAT: "print_format",
  WEBPAGE: "webpage",
  WEBFORM: "webform",
} as const;

export type FrappeOutputKind =
  (typeof FRAPPE_OUTPUT_KIND)[keyof typeof FRAPPE_OUTPUT_KIND];

/** Composer Tools menu — generation mode for this conversation. */
export const FRAPPE_TOOL_MODE = {
  OFF: "off",
  WEBFORM: "webform",
  WEBPAGE: "webpage",
  PRINT_FORMAT: "print_format",
} as const;

export type FrappeToolMode =
  (typeof FRAPPE_TOOL_MODE)[keyof typeof FRAPPE_TOOL_MODE];

export const FRAPPE_TOOL_OPTIONS: {
  id: FrappeToolMode;
  label: string;
  hint: string;
}[] = [
  {
    id: FRAPPE_TOOL_MODE.OFF,
    label: "Off",
    hint: "Chat only — hide Output",
  },
  {
    id: FRAPPE_TOOL_MODE.WEBFORM,
    label: "Web form",
    hint: "Generate a Web Form · new chat if switching",
  },
  {
    id: FRAPPE_TOOL_MODE.WEBPAGE,
    label: "Web page",
    hint: "Generate a Web Page · new chat if switching",
  },
  {
    id: FRAPPE_TOOL_MODE.PRINT_FORMAT,
    label: "Print format",
    hint: "Generate a Print Format script · new chat if switching",
  },
];

/** Prefixed onto the user message when a Frappe tool mode is active. */
export function frappeToolPromptPrefix(mode: FrappeToolMode): string {
  if (mode === FRAPPE_TOOL_MODE.OFF) return "";
  if (mode === FRAPPE_TOOL_MODE.WEBFORM) {
    return [
      "[BBAI Frappe tool: Web Form]",
      "Help the user generate a Frappe Web Form DocType: client_script, custom_css, web_form_fields, published, route, button_label, etc.",
      "When ready, call school_erp_open_output with kind=webform, name=<Web Form name>, and route when published for Preview. Include the <!-- bbai:output ... --> marker so Output opens Source (client_script / custom_css) + Preview.",
      "",
    ].join("\n");
  }
  if (mode === FRAPPE_TOOL_MODE.WEBPAGE) {
    return [
      "[BBAI Frappe tool: Web Page]",
      "Create/update a Frappe Web Page with REAL HTML. Frappe HTML mode uses field main_section_html (not only main_section).",
      "Required flow:",
      "1) Create the Web Page on School ERP (title, route, published=1, content_type=HTML).",
      "2) Call school_erp_set_web_page_html with name + full HTML (writes main_section_html + main_section).",
      "3) Call school_erp_open_output with kind=webpage, name, and route — paste the <!-- bbai:output ... --> marker in your reply.",
      "Do not open Output until HTML is saved.",
      "",
    ].join("\n");
  }
  return [
    "[BBAI Frappe tool: Custom Print Format]",
    "Help the user generate a Frappe Print Format DocType (custom Jinja): fields include html, css, custom_format=1, print_format_type=Jinja, doc_type (e.g. Class), standard=No.",
    "If this is a BED Report Card print format: follow skills \"Generate Report Card Print Format (SF9)\" + \"BED Report Card Layout (SF9)\" — use the canonical SF9 Jinja/CSS (name BED Report Card SF9). Do NOT invent SCSHS/school-specific layouts.",
    "When ready, call school_erp_open_output with kind=print_format, format=<Print Format name>, and for Preview also doctype + name (document to print). Include the <!-- bbai:output ... --> marker so Output opens Preview + Source (html/css editor).",
    "",
  ].join("\n");
}

export type FrappeOutputTarget = {
  kind: FrappeOutputKind;
  /** DocType being printed (e.g. Class) — needed for Preview printview */
  doctype?: string;
  /**
   * Document name:
   * - print_format Preview: Class (etc.) name to print
   * - print_format Source: Print Format name if `format` omitted
   * - webpage / webform: Web Page / Web Form name (desk /app/web-form/<name>)
   */
  name?: string;
  /** Print Format DocType name (e.g. "Class List with Grades BED") */
  format?: string;
  /** Website route for webpage / webform Preview (published path) */
  route?: string;
  title?: string;
};

export type FrappeOutputStreamEvent =
  | { type: "status"; message: string }
  | { type: "meta"; title: string; sourceUrl: string; kind: FrappeOutputKind }
  | { type: "html"; chunk: string }
  | { type: "done" }
  | { type: "error"; message: string };

export const BBAI_OUTPUT_EVENT = "bbai-output-target";
export const BBAI_OUTPUT_MARKER_RE =
  /<!--\s*bbai:output\s+(\{[\s\S]*?\})\s*-->/;

export function parseOutputMarker(text: string): FrappeOutputTarget | null {
  const match = BBAI_OUTPUT_MARKER_RE.exec(text);
  if (!match?.[1]) return null;
  try {
    const parsed = JSON.parse(match[1]) as FrappeOutputTarget;
    if (!parsed?.kind) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function formatOutputMarker(target: FrappeOutputTarget): string {
  return `<!-- bbai:output ${JSON.stringify(target)} -->`;
}

/** ERP path (+ query) for the Output mini-browser / proxy. */
export function buildFrappeOutputPath(target: FrappeOutputTarget): string | null {
  if (target.kind === FRAPPE_OUTPUT_KIND.PRINT_FORMAT) {
    if (!target.doctype?.trim() || !target.name?.trim() || !target.format?.trim()) {
      return null;
    }
    const params = new URLSearchParams({
      doctype: target.doctype.trim(),
      name: target.name.trim(),
      format: target.format.trim(),
      no_letterhead: "0",
      _lang: "en",
    });
    return `/printview?${params.toString()}`;
  }

  const route = (target.route || "").replace(/^\/+/, "").trim();
  if (!route) return null;
  return `/${route}`;
}

/** ERP path for Frappe "Get PDF" (print format download). */
export function buildFrappePdfPath(target: FrappeOutputTarget): string | null {
  if (target.kind !== FRAPPE_OUTPUT_KIND.PRINT_FORMAT) return null;
  if (!target.doctype?.trim() || !target.name?.trim() || !target.format?.trim()) {
    return null;
  }
  const params = new URLSearchParams({
    doctype: target.doctype.trim(),
    name: target.name.trim(),
    format: target.format.trim(),
    no_letterhead: "0",
    _lang: "en",
  });
  return `/api/method/frappe.utils.print_format.download_pdf?${params.toString()}`;
}

export type FrappeSourceFieldDef = {
  key: string;
  label: string;
};

/** Editable script/content fields for the Output Source tab. */
export function sourceFieldDefsForKind(kind: FrappeOutputKind): FrappeSourceFieldDef[] {
  if (kind === FRAPPE_OUTPUT_KIND.PRINT_FORMAT) {
    // Matches Frappe Print Format (custom Jinja): html + css on the desk form.
    return [
      { key: "html", label: "HTML" },
      { key: "css", label: "CSS" },
      { key: "doc_type", label: "DocType" },
    ];
  }
  if (kind === FRAPPE_OUTPUT_KIND.WEBPAGE) {
    // Frappe Web Page: content_type=HTML uses main_section_html (Code field on desk).
    // main_section is Text Text; website render picks *_html / *_md via content_type.
    return [
      { key: "main_section_html", label: "HTML" },
      { key: "main_section_md", label: "Markdown" },
      { key: "javascript", label: "JavaScript" },
      { key: "css", label: "CSS" },
    ];
  }
  // Matches Frappe Web Form desk form: client_script + custom_css.
  return [
    { key: "client_script", label: "Client Script" },
    { key: "custom_css", label: "Custom CSS" },
  ];
}

/** Desk DocType that owns the source for a preview target. */
export function sourceDocTypeForKind(kind: FrappeOutputKind): string {
  if (kind === FRAPPE_OUTPUT_KIND.PRINT_FORMAT) return "Print Format";
  if (kind === FRAPPE_OUTPUT_KIND.WEBPAGE) return "Web Page";
  return "Web Form";
}

/**
 * How to locate the source document.
 * Print Format → Print Format name (`format`, else `name` like /app/print-format/…).
 * Web Page / Web Form → name or route lookup.
 */
export function resolveSourceDocLookup(target: FrappeOutputTarget): {
  doctype: string;
  name?: string;
  route?: string;
} | null {
  const doctype = sourceDocTypeForKind(target.kind);
  if (target.kind === FRAPPE_OUTPUT_KIND.PRINT_FORMAT) {
    const name = target.format?.trim() || target.name?.trim();
    if (!name) return null;
    return { doctype, name };
  }
  const name = target.name?.trim();
  const route = (target.route || "").replace(/^\/+/, "").trim();
  if (!name && !route) return null;
  return { doctype, name: name || undefined, route: route || undefined };
}

/** Desk app path for the source DocType (Source-only open). */
export function buildFrappeDeskSourcePath(target: FrappeOutputTarget): string | null {
  if (target.kind === FRAPPE_OUTPUT_KIND.PRINT_FORMAT) {
    const name = target.format?.trim() || target.name?.trim();
    if (!name) return null;
    return `/app/print-format/${encodeURIComponent(name)}`;
  }
  if (target.kind === FRAPPE_OUTPUT_KIND.WEBFORM) {
    const name = target.name?.trim();
    if (!name) return null;
    return `/app/web-form/${encodeURIComponent(name)}`;
  }
  if (target.kind === FRAPPE_OUTPUT_KIND.WEBPAGE) {
    const name = target.name?.trim();
    if (!name) return null;
    return `/app/web-page/${encodeURIComponent(name)}`;
  }
  return null;
}

/** True when Output can open Source and/or Preview for this target. */
export function canOpenOutputTarget(target: FrappeOutputTarget): boolean {
  if (target.kind === FRAPPE_OUTPUT_KIND.PRINT_FORMAT) {
    return Boolean(target.format?.trim() || target.name?.trim());
  }
  if (target.kind === FRAPPE_OUTPUT_KIND.WEBFORM || target.kind === FRAPPE_OUTPUT_KIND.WEBPAGE) {
    return Boolean(target.name?.trim() || target.route?.trim());
  }
  return Boolean(buildFrappeOutputPath(target));
}

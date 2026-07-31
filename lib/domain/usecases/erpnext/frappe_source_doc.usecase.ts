import {
  resolveSourceDocLookup,
  sourceFieldDefsForKind,
  type FrappeOutputTarget,
} from "@/lib/entities/frappe_output.type";
import { normalizeErpnextBaseUrl } from "./erpnext_http.usecase";

export type FrappeSourceDoc = {
  doctype: string;
  name: string;
  title: string;
  fields: Record<string, string>;
  /** Field keys that exist on this site’s DocType */
  availableKeys: string[];
  contentType?: string;
  published?: boolean;
  route?: string;
  /** True when primary content fields are blank on ERP. */
  emptyContent?: boolean;
};

function erpHeaders(sid: string) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${sid}`,
    Cookie: `sid=${sid}`,
  };
}

async function listByRoute(
  baseUrl: string,
  sid: string,
  doctype: string,
  route: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    fields: JSON.stringify(["name", "route", "title"]),
    filters: JSON.stringify([["route", "=", route]]),
    limit_page_length: "1",
  });
  const res = await fetch(
    `${baseUrl}/api/resource/${encodeURIComponent(doctype)}?${params}`,
    { headers: erpHeaders(sid), cache: "no-store", signal: AbortSignal.timeout(20_000) },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ name?: string }> };
  return json.data?.[0]?.name?.trim() || null;
}

async function listByTitle(
  baseUrl: string,
  sid: string,
  doctype: string,
  title: string,
): Promise<string | null> {
  const trimmed = title.trim();
  if (!trimmed) return null;
  for (const op of ["=", "like"] as const) {
    const value = op === "like" ? `%${trimmed}%` : trimmed;
    const params = new URLSearchParams({
      fields: JSON.stringify(["name", "title"]),
      filters: JSON.stringify([["title", op, value]]),
      limit_page_length: "1",
    });
    const res = await fetch(
      `${baseUrl}/api/resource/${encodeURIComponent(doctype)}?${params}`,
      { headers: erpHeaders(sid), cache: "no-store", signal: AbortSignal.timeout(20_000) },
    );
    if (!res.ok) continue;
    const json = (await res.json()) as { data?: Array<{ name?: string }> };
    const found = json.data?.[0]?.name?.trim();
    if (found) return found;
  }
  return null;
}

/** Desk slug vs title mismatch — resolve the real document name before GET/PUT. */
async function resolveDocName(
  baseUrl: string,
  sid: string,
  doctype: string,
  hint: string,
  routeHint?: string,
): Promise<string | null> {
  const name = hint.trim();
  if (!name) return null;

  if (await getDoc(baseUrl, sid, doctype, name)) return name;

  if (doctype === "Web Page" || doctype === "Web Form") {
    const route = (routeHint || name).replace(/^\/+/, "").trim();
    if (route) {
      const byRoute =
        (await listByRoute(baseUrl, sid, doctype, route)) ||
        (await listByRoute(baseUrl, sid, doctype, `/${route}`));
      if (byRoute) return byRoute;
    }
    const byTitle = await listByTitle(baseUrl, sid, doctype, name);
    if (byTitle) return byTitle;
  }

  return null;
}

function parseFrappeError(text: string, fallback: string): string {
  try {
    const json = JSON.parse(text) as {
      message?: string;
      exc?: string;
      _server_messages?: string;
    };
    if (json._server_messages) {
      const messages = JSON.parse(json._server_messages) as unknown[];
      const parsed = messages
        .map((entry) => {
          if (typeof entry !== "string") return "";
          try {
            const row = JSON.parse(entry) as { message?: string };
            return row.message?.trim() || "";
          } catch {
            return entry.trim();
          }
        })
        .filter(Boolean);
      if (parsed.length) return parsed.join(" ");
    }
    if (json.message) return String(json.message);
    if (json.exc) return String(json.exc).slice(0, 240);
  } catch {
    /* keep fallback */
  }
  return fallback;
}

async function getDoc(
  baseUrl: string,
  sid: string,
  doctype: string,
  name: string,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `${baseUrl}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { headers: erpHeaders(sid), cache: "no-store", signal: AbortSignal.timeout(20_000) },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Record<string, unknown> };
  return json.data ?? null;
}

export async function fetchFrappeSourceDoc(input: {
  sid: string;
  baseUrl: string;
  target: FrappeOutputTarget;
}): Promise<{ ok: true; data: FrappeSourceDoc } | { ok: false; error: string }> {
  const baseUrl = normalizeErpnextBaseUrl(input.baseUrl);
  if (!baseUrl) return { ok: false, error: "Invalid ERP URL." };
  const sid = input.sid.trim();
  if (!sid) return { ok: false, error: "School ERP session missing." };

  const lookup = resolveSourceDocLookup(input.target);
  if (!lookup) {
    return {
      ok: false,
      error: "Need a Print Format name, or Web Page / Web Form name or route.",
    };
  }

  let name = lookup.name;
  if (name) {
    name =
      (await resolveDocName(baseUrl, sid, lookup.doctype, name, lookup.route)) || undefined;
  }
  if (!name && lookup.route) {
    name = (await listByRoute(baseUrl, sid, lookup.doctype, lookup.route)) || undefined;
    // Some sites store route with/without leading slash
    if (!name && !lookup.route.startsWith("/")) {
      name =
        (await listByRoute(baseUrl, sid, lookup.doctype, `/${lookup.route}`)) || undefined;
    }
  }
  if (!name) {
    return {
      ok: false,
      error: `Could not find ${lookup.doctype} for this preview. Publish it on School ERP first.`,
    };
  }

  const doc = await getDoc(baseUrl, sid, lookup.doctype, name);
  if (!doc) {
    return { ok: false, error: `Failed to load ${lookup.doctype} “${name}”.` };
  }

  const defs = sourceFieldDefsForKind(input.target.kind);
  const fields: Record<string, string> = {};
  const availableKeys: string[] = [];
  for (const def of defs) {
    // Always expose known fields for this kind so the editor can create content
    // even when ERP returns null / omits empty Code fields.
    availableKeys.push(def.key);
    const value = doc[def.key];
    fields[def.key] = value == null ? "" : String(value);
  }

  // Also read legacy/Text Editor field — BBAI used to write only main_section.
  const mainSection =
    doc.main_section == null ? "" : String(doc.main_section);
  const mainSectionHtml = fields.main_section_html ?? "";

  // content_type=HTML renders main_section_html; keep editor filled from either field.
  if (lookup.doctype === "Web Page") {
    if (!mainSectionHtml.trim() && mainSection.trim()) {
      fields.main_section_html = mainSection;
    }
    // Page Builder fallback
    if (
      !fields.main_section_html?.trim() &&
      Array.isArray(doc.page_blocks)
    ) {
      const fromBlocks = extractHtmlFromPageBlocks(doc.page_blocks);
      if (fromBlocks) fields.main_section_html = fromBlocks;
    }
  }

  const contentType =
    typeof doc.content_type === "string" ? doc.content_type : undefined;
  const primaryKeys =
    input.target.kind === "webpage"
      ? ["main_section_html", "main_section_md"]
      : input.target.kind === "webform"
        ? ["client_script"]
        : ["html"];
  const emptyContent = !primaryKeys.some((k) => (fields[k] || "").trim());

  const title =
    (typeof doc.title === "string" && doc.title) ||
    (typeof doc.name === "string" && doc.name) ||
    name;

  return {
    ok: true,
    data: {
      doctype: lookup.doctype,
      name,
      title,
      fields,
      availableKeys,
      contentType,
      published: Boolean(doc.published),
      route: typeof doc.route === "string" ? doc.route : undefined,
      emptyContent,
    },
  };
}

function extractHtmlFromPageBlocks(blocks: unknown[]): string {
  const chunks: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const row = block as Record<string, unknown>;
    const raw = row.web_template_values;
    if (typeof raw !== "string" || !raw.trim()) continue;
    try {
      const values = JSON.parse(raw) as Record<string, unknown>;
      for (const key of ["html_content", "content", "html", "text"]) {
        const v = values[key];
        if (typeof v === "string" && v.trim()) {
          chunks.push(v.trim());
          break;
        }
      }
    } catch {
      /* ignore bad JSON */
    }
  }
  return chunks.join("\n\n");
}

export async function saveFrappeSourceDoc(input: {
  sid: string;
  baseUrl: string;
  doctype: string;
  name: string;
  fields: Record<string, string>;
}): Promise<{ ok: true; data: { name: string } } | { ok: false; error: string }> {
  const baseUrl = normalizeErpnextBaseUrl(input.baseUrl);
  if (!baseUrl) return { ok: false, error: "Invalid ERP URL." };
  const sid = input.sid.trim();
  if (!sid) return { ok: false, error: "School ERP session missing." };

  const doctype = input.doctype.trim();
  const hint = input.name.trim();
  if (!doctype || !hint) return { ok: false, error: "doctype and name are required." };

  const routeHint =
    typeof input.fields.route === "string" ? input.fields.route.trim() : undefined;
  const name =
    (await resolveDocName(baseUrl, sid, doctype, hint, routeHint)) || hint;

  const payload: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(input.fields)) {
    if (!key.trim()) continue;
    payload[key] = value;
  }
  if (Object.keys(payload).length === 0) {
    return { ok: false, error: "No fields to save." };
  }

  // Web Page Style tab: CSS only applies when insert_style is on.
  if (doctype === "Web Page" && typeof payload.css === "string" && payload.css.trim()) {
    payload.insert_style = 1;
  }
  // Frappe desk HTML mode edits main_section_html; website also reads it when
  // content_type=HTML. Mirror into main_section so both stay in sync.
  if (doctype === "Web Page") {
    const html =
      (typeof payload.main_section_html === "string" && payload.main_section_html) ||
      (typeof payload.main_section === "string" && payload.main_section) ||
      "";
    if (html) {
      payload.content_type = "HTML";
      payload.main_section_html = html;
      payload.main_section = html;
    }
  }

  const res = await fetch(
    `${baseUrl}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    {
      method: "PUT",
      headers: erpHeaders(sid),
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    },
  );

  const text = await res.text();
  if (!res.ok) {
    const fallback = `Save failed (HTTP ${res.status}).`;
    const message = parseFrappeError(text, fallback);
    const notFoundHint =
      doctype === "Web Page" && name !== hint
        ? ""
        : doctype === "Web Page"
          ? ` Web Page not found for “${hint}”. Use the desk slug (e.g. bbai-—-boneless-bangus-ai) or route bbai.`
          : "";
    return { ok: false, error: `${message}${notFoundHint}`.trim() };
  }

  return { ok: true, data: { name } };
}

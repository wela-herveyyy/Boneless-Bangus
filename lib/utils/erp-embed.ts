import {
  ERP_BASE_URL,
  normalizeErpBaseUrl,
} from "@/lib/entities/erpnext.type";

export const ERP_EMBED_PARENT_KEY = "bbai_erp_embed_parent";
export const ERP_EMBED_MODE_KEY = "bbai_erp_embed_mode";
/** School MCP auto-wired from embed sid+parent (non-Livro desk). */
export const ERP_SCHOOL_MCP_AUTO_KEY = "bbai_school_mcp_auto";
export const ERP_SCHOOL_CODE_KEY = "bbai_school_code";

export type ErpEmbedParams = {
  sid: string | null;
  parent: string | null;
};

/** Read `sid` + `parent`/`erp` from a URLSearchParams-like source. */
export function parseErpEmbedParams(
  params: URLSearchParams | { get(name: string): string | null },
): ErpEmbedParams {
  const sid = (params.get("sid") || params.get("erp_sid") || "").trim() || null;
  const parentRaw =
    (params.get("parent") || params.get("erp") || params.get("erp_url") || "").trim() || null;
  return {
    sid,
    parent: parentRaw ? normalizeErpBaseUrl(parentRaw) : null,
  };
}

/**
 * Prefer `window.location` — `useSearchParams()` is often empty inside ERPNext iframes.
 */
export function readEmbedParamsFromWindow(): ErpEmbedParams & {
  embed: string | null;
  schoolMcp: string | null;
} {
  if (typeof window === "undefined") {
    return { sid: null, parent: null, embed: null, schoolMcp: null };
  }
  const params = new URLSearchParams(window.location.search);
  const { sid, parent } = parseErpEmbedParams(params);
  return {
    sid,
    parent,
    embed: params.get("embed"),
    schoolMcp: params.get("school_mcp"),
  };
}

export function getLivroOrigin(): string | null {
  return normalizeErpBaseUrl(ERP_BASE_URL);
}

/** Livro origin + optional local/staging aliases (`NEXT_PUBLIC_ERP_LIVRO_ALIASES`). */
function trustedLivroOrigins(): Set<string> {
  const origins = new Set<string>();
  const livro = getLivroOrigin();
  if (livro) origins.add(livro);
  for (const part of (process.env.NEXT_PUBLIC_ERP_LIVRO_ALIASES ?? "").split(",")) {
    const origin = normalizeErpBaseUrl(part);
    if (origin) origins.add(origin);
  }
  return origins;
}

/** True when parent origin matches configured Livro ERP (`NEXT_PUBLIC_ERP_BASE_URL` / aliases). */
export function isLivroParent(parent: string | null | undefined): boolean {
  const normalized = parent ? normalizeErpBaseUrl(parent) : null;
  if (!normalized) return false;
  return trustedLivroOrigins().has(normalized);
}

export function persistEmbedParent(parent: string | null) {
  if (typeof window === "undefined") return;
  if (parent) {
    // localStorage survives iframe quirks better than sessionStorage alone
    localStorage.setItem(ERP_EMBED_PARENT_KEY, parent);
    sessionStorage.setItem(ERP_EMBED_PARENT_KEY, parent);
    sessionStorage.setItem(ERP_EMBED_MODE_KEY, "1");
    localStorage.setItem(ERP_EMBED_MODE_KEY, "1");
  }
}

export function readEmbedParent(): string | null {
  if (typeof window === "undefined") return null;
  const stored =
    sessionStorage.getItem(ERP_EMBED_PARENT_KEY) ||
    localStorage.getItem(ERP_EMBED_PARENT_KEY);
  return stored ? normalizeErpBaseUrl(stored) : null;
}

export function isErpEmbedMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    sessionStorage.getItem(ERP_EMBED_MODE_KEY) === "1" ||
    localStorage.getItem(ERP_EMBED_MODE_KEY) === "1" ||
    Boolean(readEmbedParent())
  );
}

/**
 * Resolve the ERP parent we are embedded in.
 * Prefer live URL, then the active School MCP site, then stale embed storage.
 * (School base before embed store so localhost desk embeds don't win after a
 * manual connect to a real school site.)
 */
export function resolveSchoolEmbedParent(): string | null {
  if (typeof window === "undefined") return null;
  const fromWindow = readEmbedParamsFromWindow().parent;
  if (fromWindow) return fromWindow;
  const schoolBase = normalizeErpBaseUrl(
    localStorage.getItem("bbai_school_erp_base_url") ?? "",
  );
  if (schoolBase) return schoolBase;
  return readEmbedParent();
}

/**
 * Hide School ERP rail when parent is a school desk (anything except Livro).
 * Does NOT use useSearchParams — reads window.location + storage.
 */
export function shouldHideSchoolErpSidebar(parent?: string | null): boolean {
  if (typeof window === "undefined") return false;
  if (isSchoolMcpAutoConnected()) return true;

  const resolved = parent ?? resolveSchoolEmbedParent();
  if (!resolved) {
    // embed=1 without parent still means FAB embed — prefer hide school login
    const { embed, schoolMcp } = readEmbedParamsFromWindow();
    return schoolMcp === "auto" || embed === "1";
  }
  return !isLivroParent(resolved);
}

/** @deprecated use shouldHideSchoolErpSidebar — kept for call sites */
export function shouldAutoSchoolMcpFromEmbed(opts: {
  sid?: string | null;
  parent?: string | null;
  schoolMcp?: string | null;
  embed?: string | null;
}): boolean {
  if (opts.schoolMcp === "auto") return true;
  if (typeof window !== "undefined" && isSchoolMcpAutoConnected()) return true;
  const parent = opts.parent
    ? normalizeErpBaseUrl(opts.parent)
    : resolveSchoolEmbedParent();
  if (parent && !isLivroParent(parent)) return true;
  if (opts.embed === "1" && parent && !isLivroParent(parent)) return true;
  if (opts.sid?.trim() && parent && !isLivroParent(parent)) return true;
  return shouldHideSchoolErpSidebar(parent);
}

export function persistSchoolMcpAuto(schoolCode: string | null) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ERP_SCHOOL_MCP_AUTO_KEY, "1");
  localStorage.setItem(ERP_SCHOOL_MCP_AUTO_KEY, "1");
  if (schoolCode) {
    sessionStorage.setItem(ERP_SCHOOL_CODE_KEY, schoolCode);
    localStorage.setItem(ERP_SCHOOL_CODE_KEY, schoolCode);
  }
}

export function isSchoolMcpAutoConnected(): boolean {
  if (typeof window === "undefined") return false;
  return (
    sessionStorage.getItem(ERP_SCHOOL_MCP_AUTO_KEY) === "1" ||
    localStorage.getItem(ERP_SCHOOL_MCP_AUTO_KEY) === "1"
  );
}

function persistSidKeys(
  keys: { sid: string; user: string; email: string; baseUrl: string },
  session: { sid: string; fullName: string; email: string; baseUrl: string },
  eventName: string,
) {
  const changed =
    localStorage.getItem(keys.sid) !== session.sid ||
    localStorage.getItem(keys.user) !== session.fullName ||
    localStorage.getItem(keys.email) !== session.email ||
    localStorage.getItem(keys.baseUrl) !== session.baseUrl;

  localStorage.setItem(keys.sid, session.sid);
  localStorage.setItem(keys.user, session.fullName);
  localStorage.setItem(keys.email, session.email);
  localStorage.setItem(keys.baseUrl, session.baseUrl);

  // Only notify listeners when something changed — avoids restore ↔ event loops
  if (changed) window.dispatchEvent(new Event(eventName));
}

export function persistLivroSidClient(session: {
  sid: string;
  fullName: string;
  email: string;
  baseUrl: string;
}) {
  persistSidKeys(
    {
      sid: "bbai_erp_sid",
      user: "bbai_erp_user",
      email: "bbai_erp_email",
      baseUrl: "bbai_erp_base_url",
    },
    session,
    "bbai-erp-session",
  );
}

function persistSchoolSidClient(session: {
  sid: string;
  fullName: string;
  email: string;
  baseUrl: string;
}) {
  persistSidKeys(
    {
      sid: "bbai_school_erp_sid",
      user: "bbai_school_erp_user",
      email: "bbai_school_erp_email",
      baseUrl: "bbai_school_erp_base_url",
    },
    session,
    "bbai-school-erp-session",
  );
}

/** Persist MCP sid for Livro or school parent after embed / password login. */
export function persistEmbedSidClient(
  session: {
    sid: string;
    fullName: string;
    email: string;
    baseUrl: string;
  },
  options?: { forceSchool?: boolean; schoolCode?: string | null },
) {
  if (typeof window === "undefined") return;
  persistEmbedParent(session.baseUrl);

  const forceSchool =
    options?.forceSchool || !isLivroParent(session.baseUrl);

  if (forceSchool) {
    persistSchoolSidClient(session);
    persistSchoolMcpAuto(options?.schoolCode ?? null);
    return;
  }

  persistLivroSidClient(session);
}

import {
  ERP_BASE_URL,
  normalizeErpBaseUrl,
} from "@/lib/entities/erpnext.type";

export const ERP_EMBED_PARENT_KEY = "bbai_erp_embed_parent";
export const ERP_EMBED_MODE_KEY = "bbai_erp_embed_mode";

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
    sessionStorage.setItem(ERP_EMBED_PARENT_KEY, parent);
    sessionStorage.setItem(ERP_EMBED_MODE_KEY, "1");
  }
}

export function readEmbedParent(): string | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(ERP_EMBED_PARENT_KEY);
  return stored ? normalizeErpBaseUrl(stored) : null;
}

export function isErpEmbedMode(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ERP_EMBED_MODE_KEY) === "1" || Boolean(readEmbedParent());
}

/**
 * Hide School ERP login rail when embedded from a non-Livro parent URL
 * (any school / other site). Standalone BBAI still shows it.
 */
export function shouldHideSchoolErpSidebar(parent?: string | null): boolean {
  const resolved = parent ?? readEmbedParent();
  if (!resolved) return false;
  return !isLivroParent(resolved);
}

export function persistLivroSidClient(session: {
  sid: string;
  fullName: string;
  email: string;
  baseUrl: string;
}) {
  localStorage.setItem("bbai_erp_sid", session.sid);
  localStorage.setItem("bbai_erp_user", session.fullName);
  localStorage.setItem("bbai_erp_email", session.email);
  localStorage.setItem("bbai_erp_base_url", session.baseUrl);
  window.dispatchEvent(new Event("bbai-erp-session"));
}

function persistSchoolSidClient(session: {
  sid: string;
  fullName: string;
  email: string;
  baseUrl: string;
}) {
  localStorage.setItem("bbai_school_erp_sid", session.sid);
  localStorage.setItem("bbai_school_erp_user", session.fullName);
  localStorage.setItem("bbai_school_erp_email", session.email);
  localStorage.setItem("bbai_school_erp_base_url", session.baseUrl);
  window.dispatchEvent(new Event("bbai-school-erp-session"));
}

/** Persist MCP sid for Livro or school parent after embed / password login. */
export function persistEmbedSidClient(session: {
  sid: string;
  fullName: string;
  email: string;
  baseUrl: string;
}) {
  if (typeof window === "undefined") return;
  persistEmbedParent(session.baseUrl);
  if (isLivroParent(session.baseUrl)) {
    persistLivroSidClient(session);
    return;
  }
  persistSchoolSidClient(session);
}

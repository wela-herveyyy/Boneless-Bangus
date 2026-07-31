import {
  buildFrappeOutputPath,
  type FrappeOutputTarget,
} from "@/lib/entities/frappe_output.type";
import { normalizeErpnextBaseUrl } from "./erpnext_http.usecase";

export const SCHOOL_PREVIEW_COOKIE = "bbai_school_preview";

export type SchoolPreviewCookie = {
  sid: string;
  baseUrl: string;
};

export function buildFrappeOutputSourceUrl(
  baseUrl: string,
  target: FrappeOutputTarget,
): string | null {
  const origin = normalizeErpnextBaseUrl(baseUrl);
  const path = buildFrappeOutputPath(target);
  if (!origin || !path) return null;
  return `${origin}${path}`;
}

export function encodeSchoolPreviewCookie(session: SchoolPreviewCookie): string {
  return Buffer.from(
    JSON.stringify({ sid: session.sid, baseUrl: session.baseUrl }),
    "utf8",
  ).toString("base64url");
}

/** Build `Set-Cookie` without NextResponse.cookies (avoids App Router cookie mutate quirks). */
export function schoolPreviewSetCookieHeader(
  session: SchoolPreviewCookie | null,
): string {
  if (!session) {
    return `${SCHOOL_PREVIEW_COOKIE}=; Path=/api/erp/output; HttpOnly; SameSite=Lax; Max-Age=0`;
  }
  const value = encodeSchoolPreviewCookie(session);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SCHOOL_PREVIEW_COOKIE}=${value}; Path=/api/erp/output; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}${secure}`;
}

/** JSON response that also sets (or clears) the School MCP preview cookie. */
export function jsonWithSchoolPreviewCookie(
  data: unknown,
  session: SchoolPreviewCookie | null,
  init?: { status?: number },
): Response {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  headers.append("Set-Cookie", schoolPreviewSetCookieHeader(session));
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers,
  });
}

export function decodeSchoolPreviewCookie(raw: string | undefined): SchoolPreviewCookie | null {
  if (!raw?.trim()) return null;
  try {
    const json = JSON.parse(
      Buffer.from(raw.trim(), "base64url").toString("utf8"),
    ) as Partial<SchoolPreviewCookie>;
    const sid = json.sid?.trim();
    const baseUrl = normalizeErpnextBaseUrl(json.baseUrl || "");
    if (!sid || !baseUrl) return null;
    return { sid, baseUrl };
  } catch {
    return null;
  }
}

/** Rewrite ERP HTML so assets/links stay inside the BBAI mini-browser proxy. */
export function rewriteHtmlForSchoolProxy(
  html: string,
  baseUrl: string,
  browsePathPrefix: string,
): string {
  const origin = normalizeErpnextBaseUrl(baseUrl);
  if (!origin) return html;

  const toProxy = (raw: string): string => {
    const value = raw.trim();
    if (
      !value ||
      value.startsWith("#") ||
      value.startsWith("data:") ||
      value.startsWith("javascript:") ||
      value.startsWith("mailto:") ||
      value.startsWith("blob:")
    ) {
      return raw;
    }
    // Already proxied
    if (value.includes("/api/erp/output/browse")) return raw;

    try {
      const abs = new URL(value, `${origin}/`);
      if (abs.origin !== origin) return raw;
      const path = `${abs.pathname}${abs.search}`;
      return `${browsePathPrefix}${encodeURIComponent(path)}`;
    } catch {
      return raw;
    }
  };

  let out = html.replace(
    /\b(href|src|action)=["']([^"']+)["']/gi,
    (_m, attr: string, url: string) => `${attr}="${toProxy(url)}"`,
  );

  // CSS url(...) — also used when proxying .css bundles (font/background paths).
  out = rewriteCssUrlsForSchoolProxy(out, toProxy);

  return out;
}

/** Rewrite url(...) and @import in CSS so /assets/* hits the browse proxy, not BBAI origin. */
export function rewriteCssUrlsForSchoolProxy(
  css: string,
  toProxy: (raw: string) => string,
): string {
  let out = css.replace(/url\((['"]?)([^)'"]+)\1\)/gi, (_m, _q: string, url: string) => {
    return `url("${toProxy(url)}")`;
  });
  out = out.replace(
    /@import\s+(?:url\()?['"]?([^'")\s]+)['"]?\)?/gi,
    (_m, url: string) => `@import url("${toProxy(url)}")`,
  );
  return out;
}

export async function proxySchoolErpRequest(input: {
  sid: string;
  baseUrl: string;
  path: string;
}): Promise<{
  ok: boolean;
  status: number;
  contentType: string;
  body: ArrayBuffer | Uint8Array;
  finalPath: string;
}> {
  const origin = normalizeErpnextBaseUrl(input.baseUrl);
  if (!origin) {
    return {
      ok: false,
      status: 400,
      contentType: "text/plain",
      body: new TextEncoder().encode("Invalid ERP URL."),
      finalPath: input.path,
    };
  }

  let path = input.path.trim() || "/";
  if (!path.startsWith("/")) path = `/${path}`;

  // Block path traversal into other origins
  const target = new URL(path, `${origin}/`);
  if (target.origin !== origin) {
    return {
      ok: false,
      status: 400,
      contentType: "text/plain",
      body: new TextEncoder().encode("Path must stay on the school site."),
      finalPath: path,
    };
  }

  const sid = input.sid.trim();
  const res = await fetch(target.toString(), {
    headers: {
      Accept: "*/*",
      Authorization: `Bearer ${sid}`,
      Cookie: `sid=${sid}`,
    },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });

  const body = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "application/octet-stream";

  return {
    ok: res.ok,
    status: res.status,
    contentType,
    body,
    finalPath: `${target.pathname}${target.search}`,
  };
}

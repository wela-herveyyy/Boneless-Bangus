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

  // Printview "Get PDF" often uses window.open('/api/method/...') which would hit
  // BBAI origin — bridge relative ERP paths back through the browse proxy.
  const bridge = `<script>(function(){var P=${JSON.stringify(browsePathPrefix)};function prox(u){if(!u||typeof u!=="string")return u;if(u.indexOf("/api/erp/output/browse")!==-1)return u;try{var x=new URL(u,window.location.origin);if(x.origin!==window.location.origin)return u;var path=x.pathname+x.search;if(/^\\/(api|printview|app|files|private|assets)\\b/.test(path))return P+encodeURIComponent(path);}catch(e){}return u;}var o=window.open;window.open=function(u){if(typeof u==="string")u=prox(u);return o.apply(this,arguments);};document.addEventListener("click",function(e){var t=e.target;if(!t||!t.closest)return;var a=t.closest("a[href]");if(a){var h=a.getAttribute("href")||"";if(/download_pdf|\\/api\\/method\\//i.test(h)){e.preventDefault();window.location.href=prox(h);return;}}var b=t.closest("button,a.btn,.btn");if(!b)return;var label=(b.textContent||"").replace(/\\s+/g," ").trim();if(/^get\\s*pdf$/i.test(label)||/download_pdf/i.test(b.getAttribute("onclick")||"")){var m=(b.getAttribute("onclick")||"").match(/['"](\\/api\\/method\\/[^'"]+)['"]/);if(m){e.preventDefault();e.stopPropagation();window.location.href=prox(m[1]);}}},true);})();</script>`;

  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${bridge}</head>`);
  } else {
    out = bridge + out;
  }

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
  contentDisposition?: string | null;
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
  const isPdf = /download_pdf|\.pdf(?:$|\?)/i.test(path);
  const res = await fetch(target.toString(), {
    headers: {
      Accept: isPdf ? "application/pdf,*/*" : "*/*",
      Authorization: `Bearer ${sid}`,
      Cookie: `sid=${sid}`,
    },
    cache: "no-store",
    redirect: "follow",
    // wkhtmltopdf / chrome PDF can be slow on school sites
    signal: AbortSignal.timeout(isPdf ? 90_000 : 30_000),
  });

  const body = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const contentDisposition = res.headers.get("content-disposition");

  return {
    ok: res.ok,
    status: res.status,
    contentType,
    contentDisposition,
    body,
    finalPath: `${target.pathname}${target.search}`,
  };
}

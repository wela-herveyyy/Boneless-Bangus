import { cookies } from "next/headers";
import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission } from "@/lib/entities/users.type";
import {
  decodeSchoolPreviewCookie,
  proxySchoolErpRequest,
  rewriteCssUrlsForSchoolProxy,
  rewriteHtmlForSchoolProxy,
  SCHOOL_PREVIEW_COOKIE,
} from "@/lib/domain/usecases/erpnext/school_preview_proxy.usecase";
import { normalizeErpnextBaseUrl } from "@/lib/domain/usecases/erpnext/erpnext_http.usecase";
import { erpPermissionForBaseUrl } from "@/lib/utils/erp-permission";

/**
 * Mini-browser proxy: iframe navigates here; we fetch School ERP with the MCP SID cookie.
 * Query: `path` = ERP path+query (e.g. /test-004 or /printview?...).
 */
export async function GET(request: Request) {
  const userSession = await auth();
  if (!userSession || userSession.expired) {
    return new Response("Sign in to BBAI first.", { status: 401 });
  }

  const jar = await cookies();
  const session = decodeSchoolPreviewCookie(jar.get(SCHOOL_PREVIEW_COOKIE)?.value);
  if (!session) {
    return new Response(
      "School ERP preview session missing. Connect School ERP, then open Output again.",
      { status: 401 },
    );
  }

  if (!hasPermission(userSession.user.permissions, erpPermissionForBaseUrl(session.baseUrl))) {
    return new Response("Not authorized for this school site.", { status: 403 });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "/";

  try {
    const upstream = await proxySchoolErpRequest({
      sid: session.sid,
      baseUrl: session.baseUrl,
      path,
    });

    const contentType = upstream.contentType;
    const isHtml = /text\/html|application\/xhtml/i.test(contentType);
    const isCss = /text\/css/i.test(contentType) || /\.css(?:$|\?)/i.test(path);
    const browsePrefix = `${url.origin}/api/erp/output/browse?path=`;

    if (isHtml) {
      const html = new TextDecoder().decode(upstream.body);
      const rewritten = rewriteHtmlForSchoolProxy(html, session.baseUrl, browsePrefix);
      return new Response(rewritten, {
        status: upstream.status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Frame-Options": "SAMEORIGIN",
        },
      });
    }

    if (isCss) {
      const css = new TextDecoder().decode(upstream.body);
      const origin = normalizeErpnextBaseUrl(session.baseUrl) || session.baseUrl;
      const toProxy = (raw: string): string => {
        const value = raw.trim();
        if (
          !value ||
          value.startsWith("#") ||
          value.startsWith("data:") ||
          value.startsWith("javascript:")
        ) {
          return raw;
        }
        if (value.includes("/api/erp/output/browse")) return raw;
        try {
          const abs = new URL(value, `${origin}/`);
          if (abs.origin !== new URL(origin).origin) return raw;
          return `${browsePrefix}${encodeURIComponent(`${abs.pathname}${abs.search}`)}`;
        } catch {
          return raw;
        }
      };
      const rewritten = rewriteCssUrlsForSchoolProxy(css, toProxy);
      return new Response(rewritten, {
        status: upstream.status,
        headers: {
          "Content-Type": "text/css; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    };
    if (upstream.contentDisposition) {
      headers["Content-Disposition"] = upstream.contentDisposition;
    } else if (/application\/pdf/i.test(contentType)) {
      headers["Content-Disposition"] = 'inline; filename="print.pdf"';
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Preview proxy failed.",
      { status: 502 },
    );
  }
}

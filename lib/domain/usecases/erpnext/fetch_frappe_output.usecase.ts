import type {
  FrappeOutputKind,
  FrappeOutputTarget,
} from "@/lib/entities/frappe_output.type";
import { normalizeErpnextBaseUrl } from "./erpnext_http.usecase";
import { buildFrappeOutputSourceUrl } from "./school_preview_proxy.usecase";

export type FetchFrappeOutputInput = {
  sid: string;
  baseUrl: string;
  target: FrappeOutputTarget;
};

export type FetchFrappeOutputResult = {
  html: string;
  sourceUrl: string;
  title: string;
  kind: FrappeOutputKind;
};

/** Make relative asset URLs resolve against the ERP origin inside srcdoc. */
export function rewriteHtmlAssets(html: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  let out = html;
  // <base> helps relative CSS/JS/img inside srcdoc
  if (!/<\s*base\s/i.test(out)) {
    if (/<\s*head[^>]*>/i.test(out)) {
      out = out.replace(/<\s*head([^>]*)>/i, `<head$1><base href="${base}/">`);
    } else {
      out = `<base href="${base}/">${out}`;
    }
  }
  return out;
}

export async function fetchFrappeOutput(
  input: FetchFrappeOutputInput,
): Promise<{ ok: true; data: FetchFrappeOutputResult } | { ok: false; error: string }> {
  const baseUrl = normalizeErpnextBaseUrl(input.baseUrl);
  if (!baseUrl) return { ok: false, error: "Invalid ERP URL." };
  if (!input.sid.trim()) return { ok: false, error: "School ERP session missing." };

  const sourceUrl = buildFrappeOutputSourceUrl(baseUrl, input.target);
  if (!sourceUrl) {
    return {
      ok: false,
      error:
        input.target.kind === "print_format"
          ? "Print format needs doctype, name, and format."
          : "Webpage/webform needs a route.",
    };
  }

  try {
    const sid = input.sid.trim();
    // Same auth shape as School MCP (`Authorization: Bearer` + `Cookie: sid=`).
    const res = await fetch(sourceUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/json",
        Authorization: `Bearer ${sid}`,
        Cookie: `sid=${sid}`,
      },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        error: `ERP returned HTTP ${res.status} for ${input.target.kind}. Check DocType/Name/format and School ERP login.`,
      };
    }

    // Some endpoints return JSON error envelopes
    if (text.trimStart().startsWith("{")) {
      try {
        const json = JSON.parse(text) as { message?: string; exc?: string };
        return {
          ok: false,
          error: json.message || json.exc || "ERP returned JSON instead of HTML.",
        };
      } catch {
        /* fall through */
      }
    }

    // Guest / login page — SID not accepted for this site
    if (
      /frappe\.session\.user\s*=\s*["']Guest["']/i.test(text) ||
      (/\/login/i.test(text) && /password/i.test(text) && text.length < 40_000)
    ) {
      return {
        ok: false,
        error: "School ERP session expired or invalid. Reconnect School ERP, then try again.",
      };
    }

    const title =
      input.target.title ||
      input.target.format ||
      input.target.route ||
      input.target.name ||
      "Frappe output";

    return {
      ok: true,
      data: {
        html: rewriteHtmlAssets(text, baseUrl),
        sourceUrl,
        title,
        kind: input.target.kind,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to fetch Frappe output.",
    };
  }
}

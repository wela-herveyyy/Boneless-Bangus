import { normalizeErpBaseUrl } from "@/lib/entities/erpnext.type";

export { normalizeErpBaseUrl as normalizeErpnextBaseUrl };

export function extractSidFromSetCookie(headers: Headers): string | null {
  const cookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie")].filter((c): c is string => !!c);

  for (const cookie of cookies) {
    // sid=... may appear in multi-cookie joined strings
    const match = /(?:^|[,\s])sid=([^;,\s]+)/i.exec(cookie);
    const sid = match?.[1] ? decodeURIComponent(match[1]) : null;
    if (sid && sid !== "Guest") return sid;
  }
  return null;
}

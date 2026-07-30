import type { ErpnextResult } from "@/lib/entities/erpnext.type";
import { normalizeErpnextBaseUrl } from "./erpnext_http.usecase";

/** Resolve the logged-in ERP user email/name from a session sid. */
export async function getErpLoggedUser(
  baseUrl: string,
  sid: string,
): Promise<ErpnextResult<{ email: string }>> {
  const site = normalizeErpnextBaseUrl(baseUrl);
  if (!site) return { ok: false, error: "Invalid ERPNext base URL." };
  if (!sid.trim()) return { ok: false, error: "sid is required." };

  try {
    const res = await fetch(`${site}/api/method/frappe.auth.get_logged_user`, {
      headers: {
        Accept: "application/json",
        Cookie: `sid=${sid}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      return { ok: false, error: res.status >= 500 ? "ERP unreachable." : "Session expired." };
    }

    const json = (await res.json()) as { message?: string };
    const email = typeof json.message === "string" ? json.message.trim() : "";
    if (!email || email === "Guest") {
      return { ok: false, error: "Session expired." };
    }

    return { ok: true, data: { email } };
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return { ok: false, error: `ERP at ${site} timed out while checking sid.` };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "ERPNext session check failed.",
    };
  }
}

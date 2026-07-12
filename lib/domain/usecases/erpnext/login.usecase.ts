import type {
  ErpnextLoginInput,
  ErpnextLoginOutput,
  ErpnextResult,
} from "@/lib/entities/erpnext.type";
import {
  extractSidFromSetCookie,
  normalizeErpnextBaseUrl,
} from "./erpnext_http.usecase";

export async function loginErpnext(
  input: ErpnextLoginInput,
): Promise<ErpnextResult<ErpnextLoginOutput>> {
  const baseUrl = normalizeErpnextBaseUrl(input.baseUrl);
  if (!baseUrl) {
    return { ok: false, error: "Invalid ERPNext base URL." };
  }
  if (!input.usr.trim() || !input.pwd) {
    return { ok: false, error: "Username and password are required." };
  }

  try {
    const response = await fetch(`${baseUrl}/api/method/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ usr: input.usr.trim(), pwd: input.pwd }),
      redirect: "manual",
    });

    const sid = extractSidFromSetCookie(response.headers);
    let payload: { message?: string; full_name?: string } = {};
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      // some sites return empty body with Set-Cookie only
    }

    if (!sid) {
      return {
        ok: false,
        error: payload.message || `Login failed (HTTP ${response.status}).`,
      };
    }

    return {
      ok: true,
      data: {
        baseUrl,
        sid,
        fullName: typeof payload.full_name === "string" ? payload.full_name : undefined,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "ERPNext login failed.",
    };
  }
}

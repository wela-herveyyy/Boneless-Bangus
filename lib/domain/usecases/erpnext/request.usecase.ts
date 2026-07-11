import type {
  ErpnextRequestInput,
  ErpnextRequestOutput,
  ErpnextResult,
} from "@/lib/entities/erpnext.type";
import { normalizeErpnextBaseUrl } from "./erpnext_http.usecase";

export async function requestErpnext(
  input: ErpnextRequestInput,
): Promise<ErpnextResult<ErpnextRequestOutput>> {
  const baseUrl = normalizeErpnextBaseUrl(input.baseUrl);
  if (!baseUrl) {
    return { ok: false, error: "Invalid ERPNext base URL." };
  }
  if (!input.sid.trim()) {
    return { ok: false, error: "SID is required." };
  }

  const path = input.path.trim().startsWith("/")
    ? input.path.trim()
    : `/${input.path.trim()}`;
  if (!path || path === "/") {
    return { ok: false, error: "Request path is required." };
  }

  const method = input.method ?? (input.body === undefined ? "GET" : "POST");

  try {
    // ponytail: auth is Cookie sid=... — same as browser session
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        Cookie: `sid=${input.sid.trim()}`,
        ...(input.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...input.headers,
      },
      body: input.body !== undefined ? JSON.stringify(input.body) : undefined,
    });

    let data: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : `ERPNext request failed (HTTP ${response.status}).`;
      return { ok: false, error: message };
    }

    return { ok: true, data: { status: response.status, data } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "ERPNext request failed.",
    };
  }
}

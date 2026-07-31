import { ERP_BASE_URL } from "@/lib/entities/erpnext.type";
import type { ErpnextResult } from "@/lib/entities/erpnext.type";
import {
  extractSidFromSetCookie,
  normalizeErpnextBaseUrl,
} from "./erpnext_http.usecase";

export type LivroLoginInput =
  | { usr: string; pwd: string; baseUrl?: string }
  | { tmp_id: string; otp: string; usr?: string; baseUrl?: string };

export type LivroLoginNeedsOtp = {
  needs_otp: true;
  tmp_id: string;
  prompt: string;
  method: string;
};

export type LivroLoginSuccess = {
  needs_otp?: false;
  sid: string;
  fullName: string;
  baseUrl: string;
};

type ErpLoginBody = {
  full_name?: string;
  message?: string;
  tmp_id?: string;
  verification?: {
    token_delivery?: boolean;
    prompt?: string;
    method?: string;
  };
};

async function readErpJson(response: Response): Promise<ErpLoginBody | null> {
  const text = await response.text();
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.startsWith("<!") || trimmed.startsWith("<html")) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as ErpLoginBody;
  } catch {
    return null;
  }
}

async function postErpLogin(
  baseUrl: string,
  body: Record<string, string>,
  contentType: "json" | "form",
): Promise<{ response: Response; erpBody: ErpLoginBody | null }> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: string;
  if (contentType === "form") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams(body).toString();
  } else {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}/api/method/login`, {
    method: "POST",
    headers,
    body: payload,
    redirect: "manual",
    signal: AbortSignal.timeout(12_000),
  });

  return { response, erpBody: await readErpJson(response) };
}

/**
 * Password/OTP login against any ERPNext origin.
 * Defaults to Livro (`NEXT_PUBLIC_ERP_BASE_URL`) when `baseUrl` omitted.
 * Prefers form-urlencoded (Frappe desk default); falls back to JSON.
 */
export async function loginLivroErp(
  input: LivroLoginInput,
): Promise<ErpnextResult<LivroLoginNeedsOtp | LivroLoginSuccess>> {
  const baseUrl = normalizeErpnextBaseUrl(input.baseUrl || ERP_BASE_URL);
  if (!baseUrl) {
    return { ok: false, error: "ERP URL is not configured." };
  }

  try {
    let body: Record<string, string>;
    if ("tmp_id" in input) {
      if (!input.tmp_id || !input.otp) {
        return { ok: false, error: "Verification code is required." };
      }
      body = { cmd: "login", tmp_id: input.tmp_id, otp: input.otp };
    } else {
      const usr = input.usr.trim();
      if (!usr || !input.pwd) {
        return { ok: false, error: "Email and password are required." };
      }
      body = { usr, pwd: input.pwd };
    }

    // School sites (and most Frappe desks) expect form posts for /api/method/login
    let { response, erpBody } = await postErpLogin(baseUrl, body, "form");

    // Retry JSON if form got an HTML/404 gateway page
    if (!erpBody && (response.status === 404 || response.status === 405 || response.status >= 500)) {
      ({ response, erpBody } = await postErpLogin(baseUrl, body, "json"));
    }

    if (erpBody?.tmp_id) {
      return {
        ok: true,
        data: {
          needs_otp: true,
          tmp_id: erpBody.tmp_id,
          prompt: erpBody.verification?.prompt ?? "Enter the verification code sent to your email.",
          method: erpBody.verification?.method ?? "Email",
        },
      };
    }

    const sid = extractSidFromSetCookie(response.headers);
    if (!sid) {
      if (!erpBody && response.status === 404) {
        return {
          ok: false,
          error: `Login endpoint not found on ${baseUrl}. Check the School ERP URL.`,
        };
      }
      if (!erpBody && response.status >= 500) {
        return { ok: false, error: `School ERP at ${baseUrl} returned an error (${response.status}).` };
      }
      const msg =
        typeof erpBody?.message === "string" && erpBody.message
          ? erpBody.message
          : "Wrong email or password.";
      return { ok: false, error: msg };
    }

    const fallbackName = input.usr?.trim() || "User";

    return {
      ok: true,
      data: {
        sid,
        fullName: erpBody?.full_name?.trim() || fallbackName,
        baseUrl,
      },
    };
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return { ok: false, error: `ERP at ${baseUrl} timed out.` };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "ERPNext login failed.",
    };
  }
}

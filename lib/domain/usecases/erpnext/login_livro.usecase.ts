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

/**
 * Password/OTP login against any ERPNext origin.
 * Defaults to Livro (`NEXT_PUBLIC_ERP_BASE_URL`) when `baseUrl` omitted.
 */
export async function loginLivroErp(
  input: LivroLoginInput,
): Promise<ErpnextResult<LivroLoginNeedsOtp | LivroLoginSuccess>> {
  const baseUrl = normalizeErpnextBaseUrl(input.baseUrl || ERP_BASE_URL);
  if (!baseUrl) {
    return { ok: false, error: "ERP URL is not configured." };
  }

  try {
    const body =
      "tmp_id" in input
        ? { cmd: "login", tmp_id: input.tmp_id, otp: input.otp }
        : { usr: input.usr.trim(), pwd: input.pwd };

    if ("usr" in body && (!body.usr || !body.pwd)) {
      return { ok: false, error: "Email and password are required." };
    }
    if ("tmp_id" in body && (!body.tmp_id || !body.otp)) {
      return { ok: false, error: "Verification code is required." };
    }

    const response = await fetch(`${baseUrl}/api/method/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
    });

    const erpBody = (await response.json().catch(() => null)) as {
      full_name?: string;
      message?: string;
      tmp_id?: string;
      verification?: {
        token_delivery?: boolean;
        prompt?: string;
        method?: string;
      };
    } | null;

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

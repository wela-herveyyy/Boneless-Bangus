"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ERP_BASE_URL, normalizeErpBaseUrl } from "@/lib/entities/erpnext.type";
import { persistEmbedSidClient } from "@/lib/utils/erp-embed";

type UseErpPasswordSignInOptions = {
  callbackURL: string;
  initialError?: string;
  /** ERP origin to authenticate against (Livro fallback if omitted). */
  erpBaseUrl: string;
};

type ErpSignInSuccess = {
  ok: true;
  sid: string;
  fullName: string;
  email: string;
  baseUrl: string;
  needsOnboarding: boolean;
  callbackURL: string;
};

type ErpSignInOtp = {
  ok: true;
  needs_otp: true;
  tmp_id: string;
  prompt: string;
  method: string;
};

type ErpSignInResponse =
  | ErpSignInSuccess
  | ErpSignInOtp
  | { ok?: false; message?: string; error?: string; code?: string };

function readErrorMessage(json: ErpSignInResponse | null, fallback: string): string {
  if (!json) return fallback;
  if ("message" in json && typeof json.message === "string" && json.message) return json.message;
  if ("error" in json && typeof json.error === "string" && json.error) return json.error;
  return fallback;
}

/** @deprecated use useErpPasswordSignIn */
export const useErpLivroSignIn = useErpPasswordSignIn;

export function useErpPasswordSignIn({
  callbackURL,
  initialError,
  erpBaseUrl,
}: UseErpPasswordSignInOptions) {
  const router = useRouter();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [otp, setOtp] = useState("");
  const [tmpId, setTmpId] = useState<string | null>(null);
  const [otpPrompt, setOtpPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  const parent =
    normalizeErpBaseUrl(erpBaseUrl) || normalizeErpBaseUrl(ERP_BASE_URL) || "";

  async function submit(body: Record<string, string>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/sign-in/erp-livro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, parent }),
        credentials: "include",
      });

      const json = (await res.json().catch(() => null)) as ErpSignInResponse | null;

      if (!res.ok || !json) {
        setError(readErrorMessage(json, "ERP login failed."));
        return;
      }

      if ("needs_otp" in json && json.needs_otp) {
        setTmpId(json.tmp_id);
        setOtpPrompt(json.prompt);
        return;
      }

      if ("sid" in json && json.sid) {
        const baseUrl =
          normalizeErpBaseUrl(json.baseUrl || parent || ERP_BASE_URL) || parent;
        persistEmbedSidClient({
          sid: json.sid,
          fullName: json.fullName,
          email: json.email,
          baseUrl,
        });
        router.replace(
          json.needsOnboarding ? "/" : json.callbackURL || callbackURL || "/workspace",
        );
        router.refresh();
        return;
      }

      setError("Unexpected login response.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERP login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    await submit({ usr: usr.trim(), pwd, callbackURL });
  }

  async function verifyOtp() {
    if (!tmpId) return;
    await submit({
      usr: usr.trim(),
      tmp_id: tmpId,
      otp: otp.trim(),
      callbackURL,
    });
  }

  function cancelOtp() {
    setTmpId(null);
    setOtp("");
    setOtpPrompt("");
    setError(null);
  }

  return {
    usr,
    setUsr,
    pwd,
    setPwd,
    otp,
    setOtp,
    tmpId,
    otpPrompt,
    loading,
    error,
    login,
    verifyOtp,
    cancelOtp,
  };
}

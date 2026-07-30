"use client";

import { useEffect, useRef, useState } from "react";
import { persistEmbedParent, persistEmbedSidClient } from "@/lib/utils/erp-embed";
import { normalizeErpBaseUrl } from "@/lib/entities/erpnext.type";
import { ErpPasswordSignInForm } from "./erp-livro-sign-in-form";

type ErpEmbedSignInProps = {
  callbackURL: string;
  initialError?: string;
  /** From server searchParams — avoid useSearchParams (empty in iframe). */
  embedSid?: string | null;
  embedParent?: string | null;
  /** Site used for password fallback (parent or Livro). */
  erpBaseUrl: string;
};

type SessionCookiePayload = {
  name: string;
  value: string;
  maxAge: number;
  path: string;
  sameSite: string;
  secure: boolean;
};

function applySessionCookie(cookie: SessionCookiePayload) {
  // http://localhost / 127.0.0.1 cannot store Secure cookies — drop Secure on non-HTTPS
  const secure = cookie.secure && window.location.protocol === "https:";
  const sameSite = secure ? cookie.sameSite || "Lax" : "Lax";
  const parts = [
    `${cookie.name}=${encodeURIComponent(cookie.value)}`,
    `Path=${cookie.path || "/"}`,
    `Max-Age=${cookie.maxAge || 60 * 60 * 24 * 7}`,
    `SameSite=${sameSite}`,
  ];
  if (secure) parts.push("Secure");
  document.cookie = parts.join("; ");
}

/**
 * sid + parent → silent SID auth.
 * Otherwise password form against erpBaseUrl (Livro or school parent).
 */
export function ErpEmbedSignIn({
  callbackURL,
  initialError,
  embedSid,
  embedParent,
  erpBaseUrl,
}: ErpEmbedSignInProps) {
  const sid = embedSid?.trim() || null;
  const parent = embedParent ? normalizeErpBaseUrl(embedParent) : null;
  const started = useRef(false);
  const [status, setStatus] = useState<"idle" | "bootstrapping" | "failed">(
    sid && parent ? "bootstrapping" : "idle",
  );
  const [error, setError] = useState<string | null>(initialError ?? null);

  useEffect(() => {
    if (!sid || !parent) return;
    if (started.current) return;
    started.current = true;

    setStatus("bootstrapping");
    persistEmbedParent(parent);

    const controller = new AbortController();
    const kill = window.setTimeout(() => controller.abort(), 15_000);

    void (async () => {
      try {
        const res = await fetch("/api/erp/embed-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({ sid, parent }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          sid?: string;
          fullName?: string;
          email?: string;
          baseUrl?: string;
          autoSchoolMcp?: boolean;
          schoolCode?: string | null;
          isTeacher?: boolean;
          isLivro?: boolean;
          needsOnboarding?: boolean;
          redirectTo?: string;
          sessionCookie?: SessionCookiePayload;
          error?: string;
          message?: string;
        } | null;

        if (res.ok && json?.ok && json.sid && json.sessionCookie) {
          applySessionCookie(json.sessionCookie);
          // Livro parent → bbai_erp_* ; school parent → bbai_school_erp_* (MCP SID)
          const isLivro = Boolean(json.isLivro);
          persistEmbedSidClient(
            {
              sid: json.sid,
              fullName: json.fullName || "User",
              email: json.email || "",
              baseUrl: json.baseUrl || parent,
            },
            { forceSchool: !isLivro, schoolCode: json.schoolCode },
          );
          // Stay inside the ERPNext chat iframe — never break out to a new tab
          const dest = json.redirectTo || (json.needsOnboarding ? "/" : "/workspace");
          const url = new URL(dest, window.location.origin);
          url.searchParams.set("embed", "1");
          // Keep parent in URL — iframe sessionStorage can be flaky cross-port
          url.searchParams.set("parent", json.baseUrl || parent);
          if (!isLivro) {
            url.searchParams.set("school_mcp", "auto");
            if (json.schoolCode) url.searchParams.set("school_code", json.schoolCode);
          }
          window.location.replace(url.pathname + url.search);
          return;
        }

        started.current = false;
        setError(json?.error || json?.message || "ERP session expired. Sign in with your password.");
        setStatus("failed");
      } catch (err) {
        started.current = false;
        setError(
          err instanceof Error && err.name === "AbortError"
            ? "ERP sign-in timed out. Is the school site reachable from BBAI?"
            : err instanceof Error
              ? err.message
              : "SID sign-in failed.",
        );
        setStatus("failed");
      } finally {
        window.clearTimeout(kill);
      }
    })();
  }, [sid, parent]);

  if (status === "bootstrapping") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-on-surface-muted">
          Signing you in from ERPNext with your session — no password needed.
        </p>
        <div className="h-2 animate-pulse rounded-full bg-surface-container-low" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="rounded-xl bg-secondary-container px-4 py-3 text-sm text-secondary">
          {error}
        </p>
      ) : null}
      <ErpPasswordSignInForm
        callbackURL={callbackURL || "/workspace"}
        erpBaseUrl={erpBaseUrl}
      />
    </div>
  );
}

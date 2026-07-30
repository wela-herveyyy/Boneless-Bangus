"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseErpEmbedParams,
  persistEmbedParent,
  persistEmbedSidClient,
} from "@/lib/utils/erp-embed";

/**
 * Consumes `?sid=&parent=` from any ERPNext FAB / external-app link.
 * Validates sid against that parent origin, creates BBAI session, stores MCP sid.
 */
export function ErpEmbedBootstrap() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    // Sign-in page owns embed bootstrap UI — avoid racing / stripping params
    if (pathname.startsWith("/sign-in")) return;
    const { sid, parent } = parseErpEmbedParams(searchParams);
    if (!sid && !parent) return;
    ran.current = true;

    if (parent) persistEmbedParent(parent);

    const stripEmbedParams = () => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("sid");
      next.delete("erp_sid");
      next.delete("parent");
      next.delete("erp");
      next.delete("erp_url");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    };

    void (async () => {
      if (!sid || !parent) {
        stripEmbedParams();
        return;
      }

      try {
        const res = await fetch("/api/auth/sign-in/erp-livro-sid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sid,
            parent,
            callbackURL: "/workspace",
          }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          sid?: string;
          fullName?: string;
          email?: string;
          baseUrl?: string;
          needsOnboarding?: boolean;
          callbackURL?: string;
          message?: string;
        } | null;

        if (res.ok && json?.sid) {
          const baseUrl = json.baseUrl || parent;
          persistEmbedSidClient({
            sid: json.sid,
            fullName: json.fullName || "User",
            email: json.email || "",
            baseUrl,
          });
          const dest = json.needsOnboarding ? "/" : "/workspace";
          router.replace(dest);
          router.refresh();
          return;
        }

        console.warn("[ErpEmbedBootstrap]", json?.message || "SID sign-in failed");
      } catch (error) {
        console.warn("[ErpEmbedBootstrap]", error);
      }
      stripEmbedParams();
    })();
  }, [searchParams, pathname, router]);

  return null;
}

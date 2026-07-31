"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isLivroParent,
  persistEmbedParent,
  persistEmbedSidClient,
  readEmbedParamsFromWindow,
} from "@/lib/utils/erp-embed";

/**
 * Consumes `?sid=&parent=` on non-sign-in routes (FAB may land on /workspace).
 * Uses window.location — useSearchParams is unreliable in ERPNext iframes.
 * Stores SID into Livro or School MCP keys the same way /sign-in embed does.
 */
export function ErpEmbedBootstrap() {
  const pathname = usePathname();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (pathname.startsWith("/sign-in")) return;

    const { sid, parent } = readEmbedParamsFromWindow();
    if (!sid && !parent) return;
    ran.current = true;

    if (parent) persistEmbedParent(parent);

    const stripSidParams = () => {
      const next = new URLSearchParams(window.location.search);
      next.delete("sid");
      next.delete("erp_sid");
      next.delete("erp");
      next.delete("erp_url");
      // keep parent + embed + school_mcp for School MCP session mode
      const qs = next.toString();
      const target = qs ? `${pathname}?${qs}` : pathname;
      if (target !== `${pathname}${window.location.search}`) {
        router.replace(target);
      }
    };

    void (async () => {
      // parent-only (no sid): remember embed context, do not navigate — navigating
      // the same URL remounts and can look like an infinite reload.
      if (!sid || !parent) {
        stripSidParams();
        return;
      }

      try {
        const res = await fetch("/api/erp/embed-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sid, parent }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          sid?: string;
          fullName?: string;
          email?: string;
          baseUrl?: string;
          isLivro?: boolean;
          schoolCode?: string | null;
          needsOnboarding?: boolean;
          message?: string;
        } | null;

        if (res.ok && json?.ok && json.sid) {
          const baseUrl = json.baseUrl || parent;
          const forceSchool = !json.isLivro && !isLivroParent(baseUrl);
          persistEmbedSidClient(
            {
              sid: json.sid,
              fullName: json.fullName || "User",
              email: json.email || "",
              baseUrl,
            },
            { forceSchool, schoolCode: json.schoolCode },
          );
          const dest = json.needsOnboarding ? "/onboarding" : "/workspace";
          const url = new URL(dest, window.location.origin);
          url.searchParams.set("embed", "1");
          url.searchParams.set("parent", baseUrl);
          if (forceSchool) url.searchParams.set("school_mcp", "auto");
          window.location.replace(url.pathname + url.search);
          return;
        }

        console.warn("[ErpEmbedBootstrap]", json?.message || "SID sign-in failed");
      } catch (error) {
        console.warn("[ErpEmbedBootstrap]", error);
      }
      stripSidParams();
    })();
  }, [pathname, router]);

  return null;
}

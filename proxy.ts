import { NextRequest, NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/domain/services/auth.service";

const authPaths = ["/sign-in", "/sign-up", "/dcmu"];
const publicPaths = [
  "/",
  "/sign-in",
  "/sign-up",
  "/dcmu",
  "/landing",
  "/docs",
  "/api/workspace/oauth",
  "/api/mcp/google-workspace",
  "/api/erp/embed-login",
];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await getSessionFromHeaders(request.headers);
  const sid =
    request.nextUrl.searchParams.get("sid") || request.nextUrl.searchParams.get("erp_sid");
  const parent =
    request.nextUrl.searchParams.get("parent") ||
    request.nextUrl.searchParams.get("erp") ||
    request.nextUrl.searchParams.get("erp_url");
  const hasEmbedSid = Boolean(sid?.trim() && parent?.trim());

  // Already signed in — leave auth pages. Keep embed sid/parent for silent login.
  // Send to `/onboarding` (not /workspace): no-role users finish setup there;
  // users with a role are forwarded to workspace by that page.
  if (session && matchesPath(pathname, authPaths)) {
    if (hasEmbedSid) {
      return NextResponse.next();
    }
    const dest = new URL("/onboarding", request.url);
    const embed = request.nextUrl.searchParams.get("embed");
    if (embed) dest.searchParams.set("embed", embed);
    if (parent) dest.searchParams.set("parent", parent);
    const schoolMcp = request.nextUrl.searchParams.get("school_mcp");
    if (schoolMcp) dest.searchParams.set("school_mcp", schoolMcp);
    // Recover embed flags nested in callbackURL (common after cookie miss)
    const callbackURL = request.nextUrl.searchParams.get("callbackURL");
    if (callbackURL?.startsWith("/")) {
      try {
        const cb = new URL(callbackURL, request.url);
        for (const key of ["embed", "parent", "school_mcp"] as const) {
          const value = cb.searchParams.get(key);
          if (value && !dest.searchParams.get(key)) dest.searchParams.set(key, value);
        }
      } catch {
        /* ignore */
      }
    }
    return NextResponse.redirect(dest);
  }

  if (!session && !matchesPath(pathname, publicPaths)) {
    // Never redirect API callers to HTML /sign-in — clients parse JSON.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }
    const signInUrl = new URL("/sign-in", request.url);
    const callbackPath = `${pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set("callbackURL", callbackPath);
    if (sid) signInUrl.searchParams.set("sid", sid);
    if (parent) signInUrl.searchParams.set("parent", parent);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

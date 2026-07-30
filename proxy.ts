import { NextRequest, NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/domain/services/auth.service";

const authPaths = ["/sign-in", "/sign-up"];
const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/landing",
  "/docs",
  "/api/workspace/oauth",
  "/api/mcp/google-workspace",
  "/api/erp/embed-login",
];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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

  // Already signed in — go to workspace, but NEVER drop embed sid/parent
  if (session && matchesPath(pathname, authPaths)) {
    if (hasEmbedSid) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/workspace", request.url));
  }

  if (!session && !matchesPath(pathname, publicPaths)) {
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

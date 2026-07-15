import { NextRequest, NextResponse } from "next/server";
import { authFromHeaders } from "@/lib/domain/services/auth.service";
import { handleOAuthCallbackService } from "@/lib/domain/services/google_workspace_auth.service";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  try {
    const userSession = await authFromHeaders(req.headers);
    if (!userSession || userSession.expired) {
      return NextResponse.redirect(`${origin}/sign-in`);
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${origin}/?workspace_auth_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${origin}/?workspace_auth_error=missing_code_or_state`);
    }

    const cookieState = req.cookies.get("workspace_oauth_state")?.value;
    if (!cookieState || cookieState !== state) {
      return NextResponse.json({ error: "State mismatch (CSRF protection triggered)" }, { status: 403 });
    }

    const redirectUri = process.env.GOOGLE_WORKSPACE_REDIRECT_URI || `${origin}/api/workspace/oauth/callback`;

    await handleOAuthCallbackService(userSession.user.id, code, redirectUri);

    const response = NextResponse.redirect(`${origin}/?workspace_auth=success`);
    response.cookies.delete("workspace_oauth_state");
    return response;
  } catch (error: any) {
    if (error && typeof error === "object" && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    const message = error instanceof Error ? error.message : "OAuth callback error";
    console.error("Workspace OAuth callback failed:", error);
    return NextResponse.redirect(`${origin}/?workspace_auth_error=${encodeURIComponent(message)}`);
  }
}

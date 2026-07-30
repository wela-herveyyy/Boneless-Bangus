import { NextResponse } from "next/server";
import crypto from "crypto";
import { authFromHeaders } from "@/lib/domain/services/auth.service";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

export async function GET(req: Request) {
  try {
    const userSession = await authFromHeaders(req.headers);
    if (!userSession || userSession.expired) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!hasPermission(userSession.user.permissions, USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS)) {
      return NextResponse.json({ error: "Not authorized for Google Workspace." }, { status: 403 });
    }

    const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "GOOGLE_WORKSPACE_CLIENT_ID is not configured in .env on the server." },
        { status: 500 }
      );
    }

    const origin = new URL(req.url).origin;
    const redirectUri = process.env.GOOGLE_WORKSPACE_REDIRECT_URI || `${origin}/api/workspace/oauth/callback`;

    const state = crypto.randomBytes(16).toString("hex");

    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes,
      access_type: "offline",
      prompt: "consent",
      state: state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("workspace_oauth_state", state, {
      httpOnly: true,
      secure: origin.startsWith("https://"),
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error: any) {
    if (error && typeof error === "object" && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("Workspace OAuth init error:", error);
    return NextResponse.json({ error: "Failed to initiate OAuth flow" }, { status: 500 });
  }
}

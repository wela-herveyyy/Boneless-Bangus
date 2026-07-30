import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getErpUserProfile } from "@/lib/domain/usecases/erpnext/get_erp_user_profile.usecase";
import { getSchoolTeacherContext } from "@/lib/domain/usecases/erpnext/get_school_teacher_context.usecase";
import { getUserRole } from "@/lib/domain/usecases/users/get_user_role.usecase";
import { ERP_BASE_URL, normalizeErpBaseUrl } from "@/lib/entities/erpnext.type";
import { isLivroParent } from "@/lib/utils/erp-embed";

const PROVIDER_ID = "erp-livro";

function toAppEmail(erpUser: string): string {
  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(erpUser);
  if (emailLike) return erpUser.toLowerCase();
  const local = erpUser.replace(/[^a-zA-Z0-9._+-]/g, "_").slice(0, 64) || "user";
  return `${local.toLowerCase()}@livro.local`;
}

/** Match better-call `signCookieValue` (HMAC-SHA256 + base64). */
async function signSessionCookie(token: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(token),
  );
  const b64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${token}.${b64}`;
}

/**
 * Silent FAB / iframe login.
 * Flow: sid → get_logged_user → GET /api/resource/User/{email}
 * (Desk: /app/user-profile → /app/user/worldcupteacher%40gmail.com)
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sid?: string;
      parent?: string;
    };
    const sid = body.sid?.trim();
    const parent = normalizeErpBaseUrl(body.parent || ERP_BASE_URL);

    if (!sid) {
      return NextResponse.json({ ok: false, error: "sid is required." }, { status: 400 });
    }
    if (!parent) {
      return NextResponse.json(
        { ok: false, error: "A valid parent URL origin is required." },
        { status: 400 },
      );
    }

    const profile = await getErpUserProfile(parent, sid);
    if (!profile.ok) {
      return NextResponse.json({ ok: false, error: profile.error }, { status: 401 });
    }

    const email = toAppEmail(profile.data.email);
    const displayName = profile.data.fullName || email;
    const ctx = await auth.$context;
    const existing = await ctx.internalAdapter.findUserByEmail(email, {
      includeAccounts: true,
    });

    let user = existing?.user ?? null;
    if (!user) {
      user = await ctx.internalAdapter.createUser({
        email,
        name: displayName,
        emailVerified: true,
        image: profile.data.userImage ?? undefined,
      });
      if (!user) {
        return NextResponse.json({ ok: false, error: "Failed to create user." }, { status: 500 });
      }
      await ctx.internalAdapter.createAccount({
        userId: user.id,
        providerId: PROVIDER_ID,
        accountId: `${parent}:${profile.data.userName}`,
      });
    } else {
      if (!existing?.accounts.some((a) => a.providerId === PROVIDER_ID)) {
        await ctx.internalAdapter.createAccount({
          userId: user.id,
          providerId: PROVIDER_ID,
          accountId: `${parent}:${profile.data.userName}`,
        });
      }
      if (displayName && displayName !== user.name) {
        user = await ctx.internalAdapter.updateUser(user.id, {
          name: displayName,
          image: profile.data.userImage ?? user.image,
        });
      }
    }

    const session = await ctx.internalAdapter.createSession(user.id);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Failed to create session." }, { status: 500 });
    }

    const role = await getUserRole(user.id);
    const cookieName = ctx.authCookies.sessionToken.name;
    const attrs = ctx.authCookies.sessionToken.attributes;
    const cookieValue = await signSessionCookie(session.token, ctx.secret);
    const maxAge = ctx.sessionConfig.expiresIn;

    const livro = isLivroParent(parent);
    let autoSchoolMcp = false;
    let schoolCode: string | null = null;
    let isTeacher = false;
    let erpRoles: string[] = [];

    // School desk embed (any non-Livro parent + sid): School MCP is that site.
    // Also load Teacher / school_code for richer client flags.
    if (!livro) {
      autoSchoolMcp = true;
      const schoolCtx = await getSchoolTeacherContext(parent, sid, profile.data.userName);
      if (schoolCtx.ok) {
        schoolCode = schoolCtx.data.schoolCode;
        isTeacher = schoolCtx.data.isTeacher;
        erpRoles = schoolCtx.data.erpRoles;
      }
    }

    const response = NextResponse.json({
      ok: true,
      sid,
      fullName: user.name,
      email,
      baseUrl: parent,
      isLivro: livro,
      autoSchoolMcp,
      schoolCode,
      isTeacher,
      erpRoles,
      // New school users still need onboarding — but only after session cookie sticks
      needsOnboarding: !role,
      redirectTo: !role ? "/" : "/workspace",
      // Client must set this via document.cookie — Set-Cookie from fetch is
      // blocked in cross-site ERPNext iframes (127.0.0.1 embedding localhost).
      sessionCookie: {
        name: cookieName,
        value: cookieValue,
        maxAge,
        path: attrs.path ?? "/",
        sameSite: (attrs.sameSite as string) ?? "lax",
        secure: Boolean(attrs.secure),
      },
      erpUser: {
        name: profile.data.userName,
        path: profile.data.userPath,
        fullName: profile.data.fullName,
      },
    });

    // Still try Set-Cookie for popup / first-party opens
    response.cookies.set(cookieName, cookieValue, {
      httpOnly: false, // must be readable/settable from iframe JS as fallback
      path: attrs.path ?? "/",
      sameSite: (attrs.sameSite as "lax" | "strict" | "none") ?? "lax",
      secure: Boolean(attrs.secure),
      maxAge,
    });

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Embed login failed.";
    console.error("[embed-login]", error);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

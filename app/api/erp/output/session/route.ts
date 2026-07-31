import { NextResponse } from "next/server";
import { auth } from "@/lib/domain/services/auth.service";
import { hasPermission } from "@/lib/entities/users.type";
import { resolveErpBaseUrl } from "@/lib/domain/usecases/erpnext/resolve_erp_base_url.usecase";
import {
  encodeSchoolPreviewCookie,
  SCHOOL_PREVIEW_COOKIE,
} from "@/lib/domain/usecases/erpnext/school_preview_proxy.usecase";
import { erpPermissionForBaseUrl } from "@/lib/utils/erp-permission";

/**
 * Bind School MCP SID + site into an httpOnly cookie for the Output mini-browser
 * (`/api/erp/output/browse`). Same credentials School MCP tools use.
 */
export async function POST(request: Request) {
  const userSession = await auth();
  if (!userSession || userSession.expired) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    sid?: string;
    baseUrl?: string;
  } | null;

  const sid = body?.sid?.trim();
  const baseUrl = resolveErpBaseUrl(body?.baseUrl);
  if (!sid || !baseUrl) {
    return NextResponse.json(
      { ok: false, error: "sid and baseUrl are required." },
      { status: 400 },
    );
  }

  if (!hasPermission(userSession.user.permissions, erpPermissionForBaseUrl(baseUrl))) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, baseUrl });
  response.cookies.set({
    name: SCHOOL_PREVIEW_COOKIE,
    value: encodeSchoolPreviewCookie({ sid, baseUrl }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/erp/output",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SCHOOL_PREVIEW_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/api/erp/output",
    maxAge: 0,
  });
  return response;
}

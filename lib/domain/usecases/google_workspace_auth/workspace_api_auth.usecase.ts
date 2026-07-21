import { NextResponse } from "next/server";
import { authFromHeaders } from "@/lib/domain/services/auth.service";
import { canManageGoogleWorkspaceAuth } from "@/lib/entities/google_workspace_auth.type";
import type { ActionSession } from "@/lib/entities/auth.type";

export function workspaceApiError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function workspaceApiOk<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

/** Session + workspace permission for /api/workspace/* (except oauth). */
export async function requireWorkspaceApiSession(
  headers: Headers,
): Promise<{ session: ActionSession } | { response: NextResponse }> {
  const session = await authFromHeaders(headers);
  if (!session || session.expired) {
    return { response: workspaceApiError("Authentication required.", 401) };
  }
  if (!canManageGoogleWorkspaceAuth(session.user.role)) {
    return { response: workspaceApiError("Not authorized for Google Workspace.", 403) };
  }
  return { session };
}

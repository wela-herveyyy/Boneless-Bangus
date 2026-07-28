import { auth } from "@/lib/domain/services/auth.service";
import { ERP_BASE_URL } from "@/lib/entities/erpnext.type";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

const ERP_URL = ERP_BASE_URL;

/**
 * Validate an ERPNext sid.
 * // ponytail: only "expired" when ERP says Guest — never wipe on blips
 */
export async function POST(request: Request) {
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }
    if (!hasPermission(userSession.user.role, USER_PERMISSION.ERPNEXT_ACCESS)) {
      return Response.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }

    const body = (await request.json()) as { sid?: string };
    const sid = body.sid?.trim();
    if (!sid) {
      return Response.json({ ok: false, error: "sid is required." }, { status: 400 });
    }

    let erpRes: Response;
    try {
      erpRes = await fetch(`${ERP_URL}/api/method/frappe.auth.get_logged_user`, {
        headers: {
          Accept: "application/json",
          Cookie: `sid=${sid}`,
        },
        cache: "no-store",
      });
    } catch {
      return Response.json({ ok: false, error: "ERP unreachable." }, { status: 503 });
    }

    if (!erpRes.ok) {
      // Transient ERP/gateway errors — do not tell the client to wipe SID
      if (erpRes.status >= 500) {
        return Response.json({ ok: false, error: "ERP unreachable." }, { status: 503 });
      }
      return Response.json({ ok: false, error: "Session expired." }, { status: 401 });
    }

    const json = (await erpRes.json()) as { message?: string };
    const email = typeof json.message === "string" ? json.message : "";
    if (!email || email === "Guest") {
      return Response.json({ ok: false, error: "Session expired." }, { status: 401 });
    }

    return Response.json({ ok: true, data: { email, sid } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected error.";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

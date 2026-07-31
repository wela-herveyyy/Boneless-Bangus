import { authFromHeaders } from "@/lib/domain/services/auth.service";
import { hasPermission } from "@/lib/entities/users.type";
import { resolveErpBaseUrl } from "@/lib/domain/usecases/erpnext/resolve_erp_base_url.usecase";
import { jsonWithSchoolPreviewCookie } from "@/lib/domain/usecases/erpnext/school_preview_proxy.usecase";
import { erpPermissionForBaseUrl } from "@/lib/utils/erp-permission";
import { isLivroParent } from "@/lib/utils/erp-embed";

/**
 * Bind School MCP SID + site into an httpOnly cookie for the Output mini-browser
 * (`/api/erp/output/browse`). Same credentials School MCP tools use.
 */
export async function POST(request: Request) {
  try {
    const userSession = await authFromHeaders(request.headers);
    if (!userSession || userSession.expired) {
      return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      sid?: string;
      baseUrl?: string;
    } | null;

    const sid = body?.sid?.trim();
    const baseUrl = resolveErpBaseUrl(body?.baseUrl);
    if (!sid || !baseUrl) {
      return Response.json(
        { ok: false, error: "sid and baseUrl are required." },
        { status: 400 },
      );
    }

    if (isLivroParent(baseUrl)) {
      return Response.json(
        { ok: false, error: "Output preview uses School ERP, not Livro." },
        { status: 400 },
      );
    }

    if (!hasPermission(userSession.user.permissions, erpPermissionForBaseUrl(baseUrl))) {
      return Response.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }

    return jsonWithSchoolPreviewCookie({ ok: true, baseUrl }, { sid, baseUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Bind failed.";
    console.error("[api/erp/output/bind]", error);
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  return jsonWithSchoolPreviewCookie({ ok: true }, null);
}

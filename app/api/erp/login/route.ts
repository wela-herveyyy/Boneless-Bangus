import { authFromHeaders } from "@/lib/domain/services/auth.service";
import { hasPermission } from "@/lib/entities/users.type";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import { loginLivroErp } from "@/lib/domain/usecases/erpnext/login_livro.usecase";
import { resolveErpBaseUrl } from "@/lib/domain/usecases/erpnext/resolve_erp_base_url.usecase";
import { jsonWithSchoolPreviewCookie } from "@/lib/domain/usecases/erpnext/school_preview_proxy.usecase";
import { erpPermissionForBaseUrl } from "@/lib/utils/erp-permission";
import { isLivroParent } from "@/lib/utils/erp-embed";

export async function POST(request: Request) {
  const action = "erp:login";

  try {
    const userSession = await authFromHeaders(request.headers);
    if (!userSession || userSession.expired) {
      return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json()) as {
      usr?: string;
      pwd?: string;
      tmp_id?: string;
      otp?: string;
      baseUrl?: string;
    };

    const erpUrl = resolveErpBaseUrl(body.baseUrl);
    if (!erpUrl) {
      return Response.json({ ok: false, error: "Invalid ERP URL." }, { status: 400 });
    }

    const permission = erpPermissionForBaseUrl(erpUrl);
    if (!hasPermission(userSession.user.permissions, permission)) {
      return Response.json(
        { ok: false, error: "Not authorized for this ERP site." },
        { status: 403 },
      );
    }

    const result =
      body.tmp_id && body.otp
        ? await loginLivroErp({
            tmp_id: body.tmp_id,
            otp: body.otp,
            usr: body.usr,
            baseUrl: erpUrl,
          })
        : await loginLivroErp({
            usr: body.usr?.trim() || "",
            pwd: body.pwd || "",
            baseUrl: erpUrl,
          });

    if (!result.ok) {
      await logAction({
        userId: userSession.user.id,
        action: body.tmp_id ? "erp:otp" : action,
        success: false,
        error: result.error,
        role: userSession.user.role,
      });
      const status = /not found|not authorized|required/i.test(result.error) ? 400 : 401;
      return Response.json({ ok: false, error: result.error }, { status });
    }

    if ("needs_otp" in result.data && result.data.needs_otp) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: true,
        role: userSession.user.role,
        metadata: { step: "2fa_required", erpUser: body.usr },
      });
      return Response.json({
        ok: true,
        data: {
          needs_otp: true,
          tmp_id: result.data.tmp_id,
          prompt: result.data.prompt,
          method: result.data.method,
        },
      });
    }

    await logAction({
      userId: userSession.user.id,
      action: body.tmp_id ? "erp:otp" : action,
      success: true,
      role: userSession.user.role,
      metadata: {
        erpUser: body.usr,
        fullName: result.data.fullName,
        baseUrl: result.data.baseUrl,
      },
    });

    const payload = {
      ok: true as const,
      data: {
        sid: result.data.sid,
        fullName: result.data.fullName,
        baseUrl: result.data.baseUrl,
      },
    };

    // Bind School MCP SID for Output mini-browser as soon as login succeeds.
    if (!isLivroParent(result.data.baseUrl)) {
      return jsonWithSchoolPreviewCookie(payload, {
        sid: result.data.sid,
        baseUrl: result.data.baseUrl,
      });
    }
    return Response.json(payload);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: msg });
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

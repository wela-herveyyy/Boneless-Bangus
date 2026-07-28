import { auth } from "@/lib/domain/services/auth.service";
import { ERP_BASE_URL } from "@/lib/entities/erpnext.type";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";

const ERP_URL = ERP_BASE_URL;

function extractSid(response: Response): string | null {
  const setCookieHeaders = response.headers.getSetCookie?.() ?? [];

  for (const cookie of setCookieHeaders) {
    const match = cookie.match(/^sid=([^;]+)/);
    if (match && match[1] !== "Guest") return match[1];
  }

  const allCookies = response.headers.get("set-cookie") ?? "";
  const fallback = allCookies.match(/sid=([^;,\s]+)/);
  if (fallback && fallback[1] !== "Guest") return fallback[1];

  return null;
}

export async function POST(request: Request) {
  const action = "erp:login";

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }
    if (!hasPermission(userSession.user.role, USER_PERMISSION.ERPNEXT_ACCESS)) {
      return Response.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }

    const body = (await request.json()) as {
      usr?: string;
      pwd?: string;
      tmp_id?: string;
      otp?: string;
    };

    // Step 2: OTP verification
    if (body.tmp_id && body.otp) {
      const otpResponse = await fetch(`${ERP_URL}/api/method/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ cmd: "login", tmp_id: body.tmp_id, otp: body.otp }),
        redirect: "manual",
      });

      const sid = extractSid(otpResponse);

      if (!sid) {
        const otpBody = (await otpResponse.json().catch(() => null)) as {
          message?: string;
          exc_type?: string;
        } | null;

        const msg = otpBody?.message ?? "Invalid verification code.";
        await logAction({
          userId: userSession.user.id,
          action: "erp:otp",
          success: false,
          error: msg,
          role: userSession.user.role,
        });
        return Response.json({ ok: false, error: msg }, { status: 401 });
      }

      const otpBody = (await otpResponse.json().catch(() => null)) as {
        full_name?: string;
      } | null;

      await logAction({
        userId: userSession.user.id,
        action: "erp:otp",
        success: true,
        role: userSession.user.role,
      });

      return Response.json({
        ok: true,
        data: { sid, fullName: otpBody?.full_name ?? body.usr ?? "User" },
      });
    }

    // Step 1: username + password
    const usr = body.usr?.trim();
    const pwd = body.pwd;

    if (!usr || !pwd) {
      return Response.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    const erpResponse = await fetch(`${ERP_URL}/api/method/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ usr, pwd }),
      redirect: "manual",
    });

    const erpBody = (await erpResponse.json().catch(() => null)) as {
      full_name?: string;
      message?: string;
      tmp_id?: string;
      verification?: {
        token_delivery?: boolean;
        prompt?: string;
        method?: string;
        setup?: boolean;
      };
    } | null;

    // 2FA required — return tmp_id so the client can submit OTP
    if (erpBody?.tmp_id) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: true,
        role: userSession.user.role,
        metadata: { step: "2fa_required", erpUser: usr },
      });

      return Response.json({
        ok: true,
        data: {
          needs_otp: true,
          tmp_id: erpBody.tmp_id,
          prompt: erpBody.verification?.prompt ?? "Enter the verification code sent to your email.",
          method: erpBody.verification?.method ?? "Email",
        },
      });
    }

    if (!erpResponse.ok && erpResponse.status !== 302) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: `ERPNext login failed (${erpResponse.status})`,
        role: userSession.user.role,
      });
      return Response.json({ ok: false, error: "Wrong email or password." }, { status: 401 });
    }

    // No 2FA — extract sid directly
    const sid = extractSid(erpResponse);

    if (!sid) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: "No sid cookie returned from ERPNext.",
        role: userSession.user.role,
      });
      return Response.json(
        { ok: false, error: "Login succeeded but no session cookie was returned." },
        { status: 502 },
      );
    }

    await logAction({
      userId: userSession.user.id,
      action,
      success: true,
      role: userSession.user.role,
      metadata: { erpUser: usr, fullName: erpBody?.full_name },
    });

    return Response.json({
      ok: true,
      data: { sid, fullName: erpBody?.full_name ?? usr },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: msg });
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

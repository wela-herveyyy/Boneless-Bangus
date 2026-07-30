"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { loginErpnext, requestErpnext } from "@/lib/domain/services/erpnext.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import type {
  ErpnextLoginInput,
  ErpnextLoginOutput,
  ErpnextRequestInput,
  ErpnextRequestOutput,
  ErpnextResult,
} from "@/lib/entities/erpnext.type";
import { hasPermission } from "@/lib/entities/users.type";
import { erpPermissionForBaseUrl } from "@/lib/utils/erp-permission";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

export async function loginErpnextAction(
  input: ErpnextLoginInput,
): Promise<ErpnextResult<ErpnextLoginOutput>> {
  const action = "erpnext:login";
  const permission = erpPermissionForBaseUrl(input.baseUrl);

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({
        userId: "anonymous",
        action,
        success: false,
        error: "Authentication required.",
      });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasPermission(userSession.user.permissions, permission)) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: "Not authorized.",
        role: userSession.user.role,
      });
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await loginErpnext(input);

    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { baseUrl: input.baseUrl, usr: input.usr, permission },
    });

    return result;
  } catch (error) {
    const messageText = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: messageText });
    return { ok: false, error: messageText };
  }
}

export async function requestErpnextAction(
  input: ErpnextRequestInput,
): Promise<ErpnextResult<ErpnextRequestOutput>> {
  const action = "erpnext:request";
  const permission = erpPermissionForBaseUrl(input.baseUrl);

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({
        userId: "anonymous",
        action,
        success: false,
        error: "Authentication required.",
      });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasPermission(userSession.user.permissions, permission)) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: "Not authorized.",
        role: userSession.user.role,
      });
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await requestErpnext(input);

    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { permission },
    });

    return result;
  } catch (error) {
    const messageText = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: messageText });
    return { ok: false, error: messageText };
  }
}

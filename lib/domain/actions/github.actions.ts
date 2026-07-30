"use server";

import { auth } from "@/lib/domain/services/auth.service";
import {
  getGithubProfileService,
  verifyGithubTokenService,
} from "@/lib/domain/services/github.service";
import {
  deleteCredential,
  getCredential,
  saveCredential,
} from "@/lib/domain/services/mcp_credential.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import type {
  GithubAuthRecord,
  GithubProfileRecord,
  GithubResult,
} from "@/lib/entities/github.type";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

export async function getGithubAuthStatusAction(): Promise<
  GithubResult<GithubAuthRecord>
> {
  const action = "github:auth-status";
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

    const { role, permissions } = userSession.user;

    if (!hasPermission(permissions, USER_PERMISSION.GITHUB_MCP_ACCESS)) {
      return {
        ok: true,
        data: {
          isConnected: false,
          role,
          permissions,
        },
      };
    }

    const cred = await getCredential(userSession.user.id, "github");

    await logAction({
      userId: userSession.user.id,
      action,
      success: true,
      role,
    });
    return {
      ok: true,
      data: {
        isConnected: !!cred,
        role,
        permissions,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function saveGithubPatAction(
  pat: string,
): Promise<GithubResult<void>> {
  const action = "github:save-pat";
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

    if (!hasPermission(userSession.user.permissions, USER_PERMISSION.GITHUB_MCP_ACCESS)) {
      return { ok: false, error: "Role not authorized for GitHub MCP access." };
    }

    const trimmed = pat.trim();
    if (!trimmed) {
      return { ok: false, error: "Personal Access Token is required." };
    }

    await verifyGithubTokenService(trimmed);

    await saveCredential(userSession.user.id, "github", "GitHub PAT", trimmed);
    await logAction({
      userId: userSession.user.id,
      action,
      success: true,
      role: userSession.user.role,
    });
    return { ok: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function disconnectGithubAuthAction(): Promise<GithubResult<void>> {
  const action = "github:disconnect";
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

    if (!hasPermission(userSession.user.permissions, USER_PERMISSION.GITHUB_MCP_ACCESS)) {
      return { ok: false, error: "Role not authorized for GitHub MCP access." };
    }

    await deleteCredential(userSession.user.id, "github");
    await logAction({
      userId: userSession.user.id,
      action,
      success: true,
      role: userSession.user.role,
    });
    return { ok: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function getGithubProfileAction(): Promise<
  GithubResult<GithubProfileRecord>
> {
  const action = "github:profile";
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

    if (!hasPermission(userSession.user.permissions, USER_PERMISSION.GITHUB_MCP_ACCESS)) {
      return { ok: false, error: "Role not authorized for GitHub MCP access." };
    }

    const cred = await getCredential(userSession.user.id, "github");
    if (!cred) {
      return { ok: false, error: "Not connected to GitHub." };
    }

    const data = await getGithubProfileService(cred.plaintext.trim());
    await logAction({
      userId: userSession.user.id,
      action,
      success: true,
      role: userSession.user.role,
    });
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    try {
      const userSession = await auth();
      await logAction({
        userId: userSession?.user?.id ?? "unknown",
        action,
        success: false,
        error: message,
        role: userSession?.user?.role,
      });
    } catch {
      await logAction({ userId: "unknown", action, success: false, error: message });
    }
    return { ok: false, error: message };
  }
}

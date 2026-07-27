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
import { getProfile } from "@/lib/domain/usecases/profile/get_profile.usecase";
import type {
  GithubAuthRecord,
  GithubProfileRecord,
  GithubResult,
} from "@/lib/entities/github.type";
import type { UserRole } from "@/lib/entities/users.type";

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

    const cred = await getCredential(userSession.user.id, "github");
    const profile = await getProfile(userSession.user.id);

    await logAction({
      userId: userSession.user.id,
      action,
      success: true,
      role: userSession.user.role,
    });
    return {
      ok: true,
      data: {
        isConnected: !!cred,
        role: profile.role as UserRole,
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

    const trimmed = pat.trim();
    if (!trimmed) {
      return { ok: false, error: "Personal Access Token is required." };
    }

    // Validate token before saving (lightweight /user check)
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

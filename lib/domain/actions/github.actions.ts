"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import { getCredential, saveCredential, deleteCredential } from "@/lib/domain/services/mcp_credential.service";
import type { UserRole } from "@/lib/entities/users.type";

export type GithubAuthRecord = {
  isConnected: boolean;
  role: UserRole;
};

export async function getGithubAuthStatusAction(): Promise<{ ok: boolean; data?: GithubAuthRecord; error?: string }> {
  const action = "github:auth-status";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }

    const cred = await getCredential(userSession.user.id, "github");
    const profile = await import("@/lib/domain/usecases/profile/get_profile.usecase").then(m => m.getProfile(userSession.user.id));

    return {
      ok: true,
      data: {
        isConnected: !!cred,
        role: profile.role as UserRole,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return { ok: false, error: message };
  }
}

export async function saveGithubPatAction(pat: string): Promise<{ ok: boolean; error?: string }> {
  const action = "github:save-pat";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }

    await saveCredential(userSession.user.id, "github", "GitHub PAT", pat);
    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return { ok: false, error: message };
  }
}

export async function disconnectGithubAuthAction(): Promise<{ ok: boolean; error?: string }> {
  const action = "github:disconnect";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }

    await deleteCredential(userSession.user.id, "github");
    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return { ok: false, error: message };
  }
}

export type GithubProfileRecord = {
  username: string;
  avatarUrl: string;
  repoCount: number;
  repos: { name: string; html_url: string; private: boolean; updated_at: string }[];
  orgs: { login: string; avatar_url: string; description: string }[];
};

export async function getGithubProfileAction(): Promise<{ ok: boolean; data?: GithubProfileRecord; error?: string }> {
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }

    const cred = await getCredential(userSession.user.id, "github");
    if (!cred) {
      return { ok: false, error: "Not connected to GitHub." };
    }

    const headers = {
      Authorization: `Bearer ${cred.plaintext}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "BonelessBangusAI",
    };

    const userRes = await fetch("https://api.github.com/user", { headers });
    if (!userRes.ok) {
      return { ok: false, error: "Failed to fetch GitHub profile." };
    }
    const userData = await userRes.json();

    const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=5", { headers });
    const reposData = reposRes.ok ? await reposRes.json() : [];

    const repos = Array.isArray(reposData) ? reposData.map((r: any) => ({
      name: r.full_name,
      html_url: r.html_url,
      private: r.private,
      updated_at: r.updated_at,
    })) : [];

    const orgsRes = await fetch("https://api.github.com/user/orgs", { headers });
    const orgsData = orgsRes.ok ? await orgsRes.json() : [];
    
    const orgs = Array.isArray(orgsData) ? orgsData.map((o: any) => ({
      login: o.login,
      avatar_url: o.avatar_url,
      description: o.description,
    })) : [];

    return {
      ok: true,
      data: {
        username: userData.login,
        avatarUrl: userData.avatar_url,
        repoCount: userData.public_repos + (userData.total_private_repos || 0),
        repos,
        orgs,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return { ok: false, error: message };
  }
}

export async function getGithubOrgReposAction(org: string): Promise<{ ok: boolean; data?: any[]; error?: string }> {
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }

    const cred = await getCredential(userSession.user.id, "github");
    if (!cred) {
      return { ok: false, error: "Not connected to GitHub." };
    }

    const headers = {
      Authorization: `Bearer ${cred.plaintext}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "BonelessBangusAI",
    };

    const reposRes = await fetch(`https://api.github.com/orgs/${org}/repos?sort=updated&per_page=10`, { headers });
    if (!reposRes.ok) {
      return { ok: false, error: "Failed to fetch org repositories." };
    }
    const reposData = await reposRes.json();

    const repos = Array.isArray(reposData) ? reposData.map((r: any) => ({
      name: r.full_name,
      html_url: r.html_url,
      private: r.private,
      updated_at: r.updated_at,
    })) : [];

    return { ok: true, data: repos };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return { ok: false, error: message };
  }
}


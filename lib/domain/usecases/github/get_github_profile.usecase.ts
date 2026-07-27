import "server-only";
import type {
  GithubOrgSummary,
  GithubProfileRecord,
  GithubRepoSummary,
} from "@/lib/entities/github.type";
import { fetchGithubJsonPages } from "./fetch_github_json_pages.usecase";
import { githubHeaders } from "./github_headers.usecase";
import { mapGithubRepo } from "./map_github_repo.usecase";

async function listReposByAffiliation(
  token: string,
  affiliation: "owner" | "collaborator" | "organization_member",
): Promise<GithubRepoSummary[]> {
  const headers = githubHeaders(token);
  const url =
    `https://api.github.com/user/repos?affiliation=${affiliation}` +
    `&sort=updated&per_page=100&visibility=all`;
  try {
    const raw = await fetchGithubJsonPages<Record<string, unknown>>(url, headers, 2);
    return raw.map(mapGithubRepo);
  } catch {
    return [];
  }
}

/** Fallback for fine-grained PATs that don't support affiliation filters well. */
async function listAllAccessibleRepos(token: string): Promise<GithubRepoSummary[]> {
  const headers = githubHeaders(token);
  const url = "https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all";
  try {
    const raw = await fetchGithubJsonPages<Record<string, unknown>>(url, headers, 2);
    return raw.map(mapGithubRepo);
  } catch {
    return [];
  }
}

async function listOrgRepos(
  token: string,
  orgLogin: string,
): Promise<GithubRepoSummary[]> {
  const headers = githubHeaders(token);
  const url =
    `https://api.github.com/orgs/${encodeURIComponent(orgLogin)}/repos` +
    `?sort=updated&per_page=100&type=all`;
  try {
    const raw = await fetchGithubJsonPages<Record<string, unknown>>(url, headers, 2);
    return raw.map(mapGithubRepo);
  } catch {
    return [];
  }
}

/**
 * Load GitHub user + personal / collaborator / org repositories for the sidebar.
 */
export async function getGithubProfile(token: string): Promise<GithubProfileRecord> {
  const cleaned = token.trim();
  if (!cleaned) {
    throw new Error("GitHub PAT is empty. Disconnect and save a new token.");
  }

  const headers = githubHeaders(cleaned);

  const userRes = await fetch("https://api.github.com/user", {
    headers,
    cache: "no-store",
  });
  if (!userRes.ok) {
    const body = await userRes.text().catch(() => "");
    if (userRes.status === 401) {
      throw new Error(
        "GitHub rejected this PAT (401). Disconnect and save a new token — use a classic PAT with repo + read:org, or a fine-grained PAT with Contents/Metadata read (and Members read for orgs). If your org uses SAML SSO, authorize the token for that org.",
      );
    }
    throw new Error(
      `Failed to fetch GitHub profile (${userRes.status}): ${body.slice(0, 200)}`,
    );
  }
  const userData = (await userRes.json()) as {
    login?: string;
    avatar_url?: string;
  };
  const username = String(userData.login ?? "");
  if (!username) {
    throw new Error("GitHub profile returned no username.");
  }

  let [personalRepos, collaboratorRepos, orgMemberRepos, orgsRaw] =
    await Promise.all([
      listReposByAffiliation(cleaned, "owner"),
      listReposByAffiliation(cleaned, "collaborator"),
      listReposByAffiliation(cleaned, "organization_member"),
      fetchGithubJsonPages<Record<string, unknown>>(
        "https://api.github.com/user/orgs?per_page=100",
        headers,
        1,
      ).catch(() => [] as Record<string, unknown>[]),
    ]);

  // Fine-grained / limited PATs: affiliation filters may return empty — fall back.
  if (
    personalRepos.length === 0 &&
    collaboratorRepos.length === 0 &&
    orgMemberRepos.length === 0
  ) {
    const all = await listAllAccessibleRepos(cleaned);
    const me = username.toLowerCase();
    const orgSet = new Set(
      orgsRaw.map((o) => String(o.login ?? "").toLowerCase()).filter(Boolean),
    );
    personalRepos = all.filter((r) => r.ownerLogin.toLowerCase() === me);
    orgMemberRepos = all.filter((r) => orgSet.has(r.ownerLogin.toLowerCase()));
    collaboratorRepos = all.filter((r) => {
      const owner = r.ownerLogin.toLowerCase();
      return owner !== me && !orgSet.has(owner);
    });
  }

  const orgLogins = orgsRaw.map((o) => String(o.login ?? "")).filter(Boolean);
  const orgReposLists = await Promise.all(
    orgLogins.map((login) => listOrgRepos(cleaned, login)),
  );

  const organizations: GithubOrgSummary[] = orgLogins.map((login, i) => {
    const orgMeta = orgsRaw[i] ?? {};
    const fromOrgApi = orgReposLists[i] ?? [];
    const fromAffiliation = orgMemberRepos.filter(
      (r) => r.ownerLogin.toLowerCase() === login.toLowerCase(),
    );
    const byFullName = new Map<string, GithubRepoSummary>();
    for (const r of [...fromOrgApi, ...fromAffiliation]) {
      byFullName.set(r.fullName, r);
    }
    const repos = Array.from(byFullName.values()).sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
    return {
      login,
      avatarUrl: String(orgMeta.avatar_url ?? ""),
      description:
        typeof orgMeta.description === "string" ? orgMeta.description : null,
      repos,
    };
  });

  const knownOrgs = new Set(orgLogins.map((l) => l.toLowerCase()));
  const orphanOrgOwners = new Set(
    orgMemberRepos
      .map((r) => r.ownerLogin)
      .filter((login) => login && !knownOrgs.has(login.toLowerCase())),
  );
  for (const login of orphanOrgOwners) {
    const repos = orgMemberRepos
      .filter((r) => r.ownerLogin.toLowerCase() === login.toLowerCase())
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    organizations.push({
      login,
      avatarUrl: "",
      description: null,
      repos,
    });
  }

  organizations.sort((a, b) => a.login.localeCompare(b.login));

  return {
    username,
    avatarUrl: String(userData.avatar_url ?? ""),
    personalRepos,
    collaboratorRepos,
    organizations,
    totals: {
      personal: personalRepos.length,
      collaborator: collaboratorRepos.length,
      organization: organizations.reduce((n, o) => n + o.repos.length, 0),
    },
  };
}

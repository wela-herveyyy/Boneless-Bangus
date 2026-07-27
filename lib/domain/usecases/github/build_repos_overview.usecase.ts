import "server-only";
import type {
  GithubProfileRecord,
  GithubRepoSummary,
} from "@/lib/entities/github.type";
import { getGithubProfile } from "./get_github_profile.usecase";

function repoOverviewRow(r: GithubRepoSummary) {
  return {
    fullName: r.fullName,
    private: r.private,
    language: r.language,
    updatedAt: r.updatedAt,
    description: r.description,
    url: r.htmlUrl,
  };
}

export function buildReposOverview(
  profile: GithubProfileRecord,
  perSectionLimit: number,
) {
  const slice = (repos: GithubRepoSummary[]) => {
    const items = repos.slice(0, perSectionLimit).map(repoOverviewRow);
    return {
      total: repos.length,
      shown: items.length,
      truncated: repos.length > perSectionLimit,
      repos: items,
    };
  };

  return {
    username: profile.username,
    totals: profile.totals,
    personal: slice(profile.personalRepos),
    collaborator: slice(profile.collaboratorRepos),
    organizations: profile.organizations.map((org) => ({
      login: org.login,
      description: org.description,
      ...slice(org.repos),
    })),
    hint: "Each section is sorted by last updated. Pick a repo for commits, PRs, or file reads.",
  };
}

export async function listGithubReposOverview(
  token: string,
  perSectionLimit = 50,
) {
  const limit = Math.min(Math.max(perSectionLimit, 1), 100);
  const profile = await getGithubProfile(token);
  return buildReposOverview(profile, limit);
}

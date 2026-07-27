import "server-only";
import type { GithubRepoSummary } from "@/lib/entities/github.type";

export function mapGithubRepo(r: Record<string, unknown>): GithubRepoSummary {
  const owner = (r.owner as { login?: string } | undefined) ?? {};
  return {
    name: String(r.name ?? ""),
    fullName: String(r.full_name ?? r.name ?? ""),
    htmlUrl: String(r.html_url ?? ""),
    private: Boolean(r.private),
    updatedAt: String(r.updated_at ?? ""),
    description: typeof r.description === "string" ? r.description : null,
    language: typeof r.language === "string" ? r.language : null,
    ownerLogin: String(owner.login ?? ""),
  };
}

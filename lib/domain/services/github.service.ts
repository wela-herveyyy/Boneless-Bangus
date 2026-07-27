import "server-only";
import type { GithubProfileRecord } from "@/lib/entities/github.type";
import { getGithubProfile } from "../usecases/github/get_github_profile.usecase";
import { verifyGithubToken } from "../usecases/github/verify_github_token.usecase";

export async function verifyGithubTokenService(token: string) {
  return verifyGithubToken(token);
}

export async function getGithubProfileService(
  token: string,
): Promise<GithubProfileRecord> {
  return getGithubProfile(token);
}

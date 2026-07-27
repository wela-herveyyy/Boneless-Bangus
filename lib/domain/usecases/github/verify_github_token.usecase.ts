import "server-only";
import { githubHeaders } from "./github_headers.usecase";

/** Lightweight PAT check — hits `/user` only. */
export async function verifyGithubToken(token: string): Promise<{ login: string }> {
  const res: Response = await fetch("https://api.github.com/user", {
    headers: githubHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) {
    const body: string = await res.text().catch(() => "");
    throw new Error(
      res.status === 401
        ? "GitHub PAT is invalid or expired."
        : `GitHub token check failed (${res.status}): ${body.slice(0, 160)}`,
    );
  }
  const data = (await res.json()) as { login?: string };
  if (!data.login) throw new Error("GitHub token check returned no username.");
  return { login: data.login };
}

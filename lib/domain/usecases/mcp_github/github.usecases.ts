import { githubHeaders } from "../github/github_headers.usecase";

function getHeaders(token: string) {
  return {
    ...githubHeaders(token),
    "Content-Type": "application/json",
  };
}

export async function searchRepositoriesUseCase(token: string, query: string, perPage: number = 10, page: number = 1) {
  const params = new URLSearchParams({
    q: query,
    per_page: perPage.toString(),
    page: page.toString()
  });

  const res = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${await res.text()}`);
  return await res.json();
}

export async function getCurrentUserUseCase(token: string) {
  const res = await fetch(`https://api.github.com/user`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${await res.text()}`);
  return await res.json();
}

export async function getIssueUseCase(token: string, owner: string, repo: string, issueNumber: number) {
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${await res.text()}`);
  return await res.json();
}

export async function createIssueUseCase(token: string, owner: string, repo: string, title: string, body?: string, assignees?: string[], labels?: string[]) {
  const payload: any = { title };
  if (body) payload.body = body;
  if (assignees && assignees.length > 0) payload.assignees = assignees;
  if (labels && labels.length > 0) payload.labels = labels;

  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${await res.text()}`);
  return await res.json();
}

export async function listCommitsUseCase(token: string, owner: string, repo: string, perPage: number = 30, page: number = 1) {
  const params = new URLSearchParams({
    per_page: perPage.toString(),
    page: page.toString()
  });

  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${params.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${await res.text()}`);
  return await res.json();
}

export async function listPullRequestsUseCase(token: string, owner: string, repo: string, state: string = "open", perPage: number = 30, page: number = 1) {
  const params = new URLSearchParams({
    state,
    per_page: perPage.toString(),
    page: page.toString()
  });

  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?${params.toString()}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${await res.text()}`);
  return await res.json();
}

export async function getFileContentsUseCase(token: string, owner: string, repo: string, path: string, branch?: string) {
  const params = new URLSearchParams();
  if (branch) params.append("ref", branch);

  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}?${params.toString()}`, {
    headers: getHeaders(token),
  });
  
  if (!res.ok) throw new Error(`GitHub API error: ${await res.text()}`);
  const data = await res.json();

  if (Array.isArray(data)) {
    throw new Error("Target is a directory, not a file.");
  }

  if (data.encoding === "base64" && data.content) {
    data.decoded_content = Buffer.from(data.content, "base64").toString("utf-8");
  }

  return data;
}

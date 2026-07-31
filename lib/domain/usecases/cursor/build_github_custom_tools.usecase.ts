import type { SDKCustomTool, SDKJsonValue } from "@cursor/sdk";
import { getCredential } from "@/lib/domain/services/mcp_credential.service";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";
import { getUserAccess } from "../users/get_user_access.usecase";
import { listGithubReposOverview } from "../github/build_repos_overview.usecase";
import {
  createIssueUseCase,
  getCurrentUserUseCase,
  getFileContentsUseCase,
  getIssueUseCase,
  listCommitsUseCase,
  listPullRequestsUseCase,
  searchRepositoriesUseCase,
} from "../mcp_github/github.usecases";

function jsonResult(data: unknown): SDKJsonValue {
  return JSON.parse(JSON.stringify(data ?? null)) as SDKJsonValue;
}

function tool(
  description: string,
  inputSchema: Record<string, SDKJsonValue> | undefined,
  execute: SDKCustomTool["execute"],
): SDKCustomTool {
  return { description, inputSchema, execute };
}

function num(value: SDKJsonValue | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function str(value: SDKJsonValue | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * In-process Cursor custom tools backed by the user's saved GitHub PAT.
 * Cursor remote MCP configs do not receive this PAT — without these tools,
 * chat cannot list personal/collaborator/org repos from the sidebar connection.
 */
export async function buildGithubCustomTools(
  userId: string,
): Promise<Record<string, SDKCustomTool> | undefined> {
  const access = await getUserAccess(userId);
  if (!hasPermission(access?.permissions, USER_PERMISSION.GITHUB_MCP_ACCESS)) {
    return undefined;
  }

  const cred = await getCredential(userId, "github");
  if (!cred?.plaintext?.trim()) return undefined;

  const token = cred.plaintext.trim();

  const run = async (fn: () => Promise<unknown>) => {
    try {
      return jsonResult(await fn());
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: error instanceof Error ? error.message : "GitHub tool failed.",
          },
        ],
        isError: true,
      };
    }
  };

  return {
    github_list_my_repositories: tool(
      "List an overview of ALL repositories accessible via the user's saved GitHub PAT: personal, collaborator, and organization repos with counts. Use this when the user wants a portfolio-style summary across many repos (not a single-repo deep dive).",
      {
        type: "object",
        properties: {
          perSectionLimit: {
            type: "number",
            description:
              "Max repos per section (personal, collaborator, each org). Default 50.",
          },
        },
      },
      (args) =>
        run(() =>
          listGithubReposOverview(token, num(args.perSectionLimit, 50)),
        ),
    ),
    github_search_repositories: tool(
      "Search GitHub repositories with a query (e.g. org:my-org topic:ml).",
      {
        type: "object",
        properties: {
          query: { type: "string" },
          perPage: { type: "number" },
          page: { type: "number" },
        },
        required: ["query"],
      },
      (args) =>
        run(() =>
          searchRepositoriesUseCase(
            token,
            str(args.query),
            num(args.perPage, 10),
            num(args.page, 1),
          ),
        ),
    ),
    github_get_current_user: tool(
      "Get the authenticated GitHub user profile for the saved PAT.",
      { type: "object", properties: {} },
      () => run(() => getCurrentUserUseCase(token)),
    ),
    github_list_commits: tool(
      "List recent commits for a repository.",
      {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          perPage: { type: "number" },
          page: { type: "number" },
        },
        required: ["owner", "repo"],
      },
      (args) =>
        run(() =>
          listCommitsUseCase(
            token,
            str(args.owner),
            str(args.repo),
            num(args.perPage, 30),
            num(args.page, 1),
          ),
        ),
    ),
    github_list_pull_requests: tool(
      "List pull requests for a repository.",
      {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          state: { type: "string", description: "open | closed | all" },
          perPage: { type: "number" },
          page: { type: "number" },
        },
        required: ["owner", "repo"],
      },
      (args) =>
        run(() =>
          listPullRequestsUseCase(
            token,
            str(args.owner),
            str(args.repo),
            str(args.state, "open"),
            num(args.perPage, 30),
            num(args.page, 1),
          ),
        ),
    ),
    github_get_file_contents: tool(
      "Read a file from a GitHub repository.",
      {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          path: { type: "string" },
          branch: { type: "string" },
        },
        required: ["owner", "repo", "path"],
      },
      (args) =>
        run(() =>
          getFileContentsUseCase(
            token,
            str(args.owner),
            str(args.repo),
            str(args.path),
            args.branch ? str(args.branch) : undefined,
          ),
        ),
    ),
    github_get_issue: tool(
      "Get a GitHub issue by number.",
      {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          issueNumber: { type: "number" },
        },
        required: ["owner", "repo", "issueNumber"],
      },
      (args) =>
        run(() =>
          getIssueUseCase(
            token,
            str(args.owner),
            str(args.repo),
            num(args.issueNumber, 0),
          ),
        ),
    ),
    github_create_issue: tool(
      "Create a GitHub issue.",
      {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
          assignees: { type: "array", items: { type: "string" } },
          labels: { type: "array", items: { type: "string" } },
        },
        required: ["owner", "repo", "title"],
      },
      (args) =>
        run(() =>
          createIssueUseCase(
            token,
            str(args.owner),
            str(args.repo),
            str(args.title),
            args.body ? str(args.body) : undefined,
            Array.isArray(args.assignees) ? args.assignees.map(String) : undefined,
            Array.isArray(args.labels) ? args.labels.map(String) : undefined,
          ),
        ),
    ),
  };
}

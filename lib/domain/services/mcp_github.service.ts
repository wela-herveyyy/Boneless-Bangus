import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { listGithubReposOverview } from "../usecases/github/build_repos_overview.usecase";
import {
  searchRepositoriesUseCase,
  getCurrentUserUseCase,
  getIssueUseCase,
  createIssueUseCase,
  listCommitsUseCase,
  listPullRequestsUseCase,
  getFileContentsUseCase,
} from "../usecases/mcp_github/github.usecases";

export function createGithubMcpServer(token: string) {
  const server = new Server(
    {
      name: "github-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_repositories",
          description: "Search for GitHub repositories using a query string.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query (e.g., 'org:my-org topic:ml')" },
              perPage: { type: "number", description: "Results per page (default: 10)" },
              page: { type: "number", description: "Page number (default: 1)" },
            },
            required: ["query"],
          },
        },
        {
          name: "get_current_user",
          description: "Get the profile of the currently authenticated GitHub user. Use this to determine your GitHub username and identity before making queries that require it.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "list_my_repositories",
          description:
            "List an overview of all repositories accessible to the saved PAT: personal, collaborator, and organization repos with counts and recently updated entries. Use this when the user wants a portfolio-style summary across many repos, not a single-repo deep dive.",
          inputSchema: {
            type: "object",
            properties: {
              perSectionLimit: {
                type: "number",
                description:
                  "Max repos to include per section (personal, collaborator, each org). Default 50.",
              },
            },
          },
        },
        {
          name: "get_issue",
          description: "Retrieve a specific GitHub issue by its number.",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              issueNumber: { type: "number", description: "The issue number" },
            },
            required: ["owner", "repo", "issueNumber"],
          },
        },
        {
          name: "create_issue",
          description: "Create a new GitHub issue.",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              title: { type: "string", description: "Issue title" },
              body: { type: "string", description: "Issue body/description" },
              assignees: { type: "array", items: { type: "string" }, description: "Array of GitHub usernames to assign" },
              labels: { type: "array", items: { type: "string" }, description: "Array of label names" },
            },
            required: ["owner", "repo", "title"],
          },
        },
        {
          name: "list_commits",
          description: "List recent commits for a repository.",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              perPage: { type: "number", description: "Results per page (default: 30)" },
              page: { type: "number", description: "Page number (default: 1)" },
            },
            required: ["owner", "repo"],
          },
        },
        {
          name: "list_pull_requests",
          description: "List pull requests for a repository.",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              state: { type: "string", description: "State of the PRs: open, closed, or all (default: open)" },
              perPage: { type: "number", description: "Results per page (default: 30)" },
              page: { type: "number", description: "Page number (default: 1)" },
            },
            required: ["owner", "repo"],
          },
        },
        {
          name: "get_file_contents",
          description: "Retrieve the contents of a file from a repository.",
          inputSchema: {
            type: "object",
            properties: {
              owner: { type: "string", description: "Repository owner" },
              repo: { type: "string", description: "Repository name" },
              path: { type: "string", description: "Path to the file" },
              branch: { type: "string", description: "Branch or commit SHA (optional)" },
            },
            required: ["owner", "repo", "path"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "search_repositories": {
          const query = String(args?.query || "");
          const perPage = args?.perPage ? Number(args.perPage) : 10;
          const page = args?.page ? Number(args.page) : 1;
          const data = await searchRepositoriesUseCase(token, query, perPage, page);
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "get_current_user": {
          const data = await getCurrentUserUseCase(token);
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "list_my_repositories": {
          const perSectionLimit = args?.perSectionLimit
            ? Math.min(Math.max(Number(args.perSectionLimit), 1), 100)
            : 50;
          const data = await listGithubReposOverview(token, perSectionLimit);
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "get_issue": {
          const owner = String(args?.owner || "");
          const repo = String(args?.repo || "");
          const issueNumber = Number(args?.issueNumber);
          const data = await getIssueUseCase(token, owner, repo, issueNumber);
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "create_issue": {
          const owner = String(args?.owner || "");
          const repo = String(args?.repo || "");
          const title = String(args?.title || "");
          const body = args?.body ? String(args.body) : undefined;
          const assignees = Array.isArray(args?.assignees) ? args.assignees.map(String) : undefined;
          const labels = Array.isArray(args?.labels) ? args.labels.map(String) : undefined;
          const data = await createIssueUseCase(token, owner, repo, title, body, assignees, labels);
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "list_commits": {
          const owner = String(args?.owner || "");
          const repo = String(args?.repo || "");
          const perPage = args?.perPage ? Number(args.perPage) : 30;
          const page = args?.page ? Number(args.page) : 1;
          const data = await listCommitsUseCase(token, owner, repo, perPage, page);
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "list_pull_requests": {
          const owner = String(args?.owner || "");
          const repo = String(args?.repo || "");
          const state = args?.state ? String(args.state) : "open";
          const perPage = args?.perPage ? Number(args.perPage) : 30;
          const page = args?.page ? Number(args.page) : 1;
          const data = await listPullRequestsUseCase(token, owner, repo, state, perPage, page);
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "get_file_contents": {
          const owner = String(args?.owner || "");
          const repo = String(args?.repo || "");
          const path = String(args?.path || "");
          const branch = args?.branch ? String(args.branch) : undefined;
          const data = await getFileContentsUseCase(token, owner, repo, path, branch);
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        default:
          throw new Error(`Tool not found: ${name}`);
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  });

  return server;
}

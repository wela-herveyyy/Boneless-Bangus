import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  searchGmailThreadsUseCase,
  getGmailThreadUseCase,
  getGmailMessageUseCase,
  listGmailDraftsUseCase,
  createGmailDraftUseCase,
} from "../usecases/mcp_google_workspace/gmail.usecases";
import { createCalendarEventUseCase, listCalendarEventsUseCase } from "../usecases/mcp_google_workspace/calendar.usecases";

export function createGoogleWorkspaceMcpServer(token: string) {
  const server = new Server(
    {
      name: "google-workspace-mcp",
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
          name: "search_threads",
          description: "Search Gmail threads using standard Gmail query syntax.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "The search query (e.g., 'is:unread', 'from:boss@example.com')" },
              maxResults: { type: "number", description: "Max number of threads to return (default: 1)" },
            },
            required: ["query"],
          },
        },
        {
          name: "get_thread",
          description: "Retrieve a specific Gmail thread by ID.",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string", description: "The thread ID" },
              maxMessages: { type: "number", description: "Max number of recent messages to return from the thread to avoid context overflow (default: 5)" },
            },
            required: ["id"],
          },
        },
        {
          name: "get_message",
          description: "Retrieve a specific Gmail message by ID.",
          inputSchema: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
            required: ["id"],
          },
        },
        {
          name: "list_drafts",
          description: "List Gmail drafts (up to 20).",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "create_draft",
          description: "Create a new draft email.",
          inputSchema: {
            type: "object",
            properties: {
              to: { type: "string" },
              subject: { type: "string" },
              body: { type: "string" },
            },
            required: ["to", "subject", "body"],
          },
        },
        {
          name: "list_events",
          description: "List calendar events from the primary calendar.",
          inputSchema: {
            type: "object",
            properties: {
              timeMin: { type: "string", description: "ISO 8601 datetime for the lower bound (e.g. 2026-07-20T00:00:00Z)" },
              timeMax: { type: "string", description: "ISO 8601 datetime for the upper bound" },
              maxResults: { type: "number", description: "Max number of events to return" },
            },
          },
        },
        {
          name: "create_calendar_event",
          description: "Create a Google Calendar event on the primary calendar.",
          inputSchema: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Title of the event" },
              description: { type: "string" },
              start: { type: "string", description: "ISO 8601 datetime (e.g. 2026-07-20T10:00:00+08:00)" },
              end: { type: "string", description: "ISO 8601 datetime" },
              addGoogleMeet: { type: "boolean", description: "Generate a Google Meet link" },
            },
            required: ["summary", "start", "end"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "search_threads": {
          const query = String(args?.query || "");
          const maxResults = args?.maxResults ? Number(args.maxResults) : 1;
          const result = await searchGmailThreadsUseCase(token, query, maxResults);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        case "get_thread": {
          const id = String(args?.id || "");
          const maxMessages = args?.maxMessages ? Number(args.maxMessages) : 5;
          const result = await getGmailThreadUseCase(token, id, maxMessages);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        case "get_message": {
          const id = String(args?.id || "");
          const result = await getGmailMessageUseCase(token, id);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        case "list_drafts": {
          const result = await listGmailDraftsUseCase(token);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        case "create_draft": {
          const to = String(args?.to || "");
          const subject = String(args?.subject || "");
          const body = String(args?.body || "");
          const result = await createGmailDraftUseCase(token, to, subject, body);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        case "list_events": {
          const timeMin = args?.timeMin ? String(args.timeMin) : undefined;
          const timeMax = args?.timeMax ? String(args.timeMax) : undefined;
          const maxResults = args?.maxResults ? Number(args.maxResults) : undefined;
          const result = await listCalendarEventsUseCase(token, timeMin, timeMax, maxResults);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        case "create_calendar_event": {
          const summary = String(args?.summary || "");
          const description = String(args?.description || "");
          const start = String(args?.start || "");
          const end = String(args?.end || "");
          const addGoogleMeet = Boolean(args?.addGoogleMeet);
          
          const result = await createCalendarEventUseCase(token, summary, description, start, end, addGoogleMeet);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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

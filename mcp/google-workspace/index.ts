#!/usr/bin/env bun
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

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

function getHeaders() {
  const token = process.env.GOOGLE_WORKSPACE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing GOOGLE_WORKSPACE_ACCESS_TOKEN in environment.");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

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
            id: { type: "string" },
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
  const headers = getHeaders();
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_threads": {
        const query = String(args?.query || "");
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodeURIComponent(query)}&maxResults=10`,
          { headers }
        );
        if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
        return { content: [{ type: "text", text: JSON.stringify(await res.json(), null, 2) }] };
      }

      case "get_thread": {
        const id = String(args?.id || "");
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${encodeURIComponent(id)}`, { headers });
        if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
        return { content: [{ type: "text", text: JSON.stringify(await res.json(), null, 2) }] };
      }

      case "get_message": {
        const id = String(args?.id || "");
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`, { headers });
        if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
        return { content: [{ type: "text", text: JSON.stringify(await res.json(), null, 2) }] };
      }

      case "list_drafts": {
        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts?maxResults=20`, { headers });
        if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
        return { content: [{ type: "text", text: JSON.stringify(await res.json(), null, 2) }] };
      }

      case "create_draft": {
        const to = String(args?.to || "");
        const subject = String(args?.subject || "");
        const body = String(args?.body || "");

        let rawEmail = "";
        if (to) rawEmail += `To: ${to}\r\n`;
        if (subject) rawEmail += `Subject: ${subject}\r\n`;
        rawEmail += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`;

        const base64Encoded = Buffer.from(rawEmail, "utf-8")
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/drafts`, {
          method: "POST",
          headers,
          body: JSON.stringify({ message: { raw: base64Encoded } }),
        });
        if (!res.ok) throw new Error(`Gmail API error: ${await res.text()}`);
        return { content: [{ type: "text", text: JSON.stringify(await res.json(), null, 2) }] };
      }

      case "create_calendar_event": {
        const url = args?.addGoogleMeet
          ? "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1"
          : "https://www.googleapis.com/calendar/v3/calendars/primary/events";

        const bodyPayload = {
          summary: args?.summary,
          description: args?.description || "",
          start: { dateTime: args?.start },
          end: { dateTime: args?.end },
          ...(args?.addGoogleMeet ? {
            conferenceData: {
              createRequest: {
                requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            },
          } : {}),
        };

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(bodyPayload),
        });
        if (!res.ok) throw new Error(`Calendar API error: ${await res.text()}`);
        return { content: [{ type: "text", text: JSON.stringify(await res.json(), null, 2) }] };
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

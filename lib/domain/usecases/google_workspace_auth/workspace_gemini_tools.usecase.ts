import type { FunctionT } from "@/lib/entities/google_workspace_auth.type";

/** Shared Interactions API function declarations for Workspace chat tools. */
export const WORKSPACE_GEMINI_TOOLS: FunctionT[] = [
  {
    type: "function",
    name: "workspace_status",
    description:
      "Get Google Workspace connection status and enabled capabilities (calendar, email, meet).",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "list_recent_emails",
    description:
      "List recent Gmail inbox messages (subject, from, snippet, date). Requires email capability enabled.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "send_email",
    description:
      "Send an email via the user's connected Gmail. Requires email capability enabled.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string" },
        body: { type: "string", description: "Plain text body" },
        cc: { type: "string" },
        bcc: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    type: "function",
    name: "list_upcoming_calendar_events",
    description:
      "List upcoming Google Calendar events. Requires calendar capability enabled.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "create_calendar_event",
    description:
      "Create a Google Calendar event. start/end must be ISO 8601. Optionally add Google Meet.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string" },
        start: { type: "string", description: "ISO 8601 start datetime" },
        end: { type: "string", description: "ISO 8601 end datetime" },
        description: { type: "string" },
        addGoogleMeet: { type: "boolean" },
      },
      required: ["summary", "start", "end"],
    },
  },
  {
    type: "function",
    name: "create_google_meet",
    description:
      "Create a calendar event with a Google Meet link. Requires meet capability enabled.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string" },
        start: { type: "string", description: "ISO 8601 start datetime" },
        end: { type: "string", description: "ISO 8601 end datetime" },
      },
    },
  },
];

export const WORKSPACE_GEMINI_SYSTEM_HINT =
  "Google Workspace tools are available (Gmail, Calendar, Meet). Use the function tools when the user asks about email, calendar, or meetings. These are first-party app tools, not official Google remote MCP.";

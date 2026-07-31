import type { SDKCustomTool, SDKJsonValue } from "@cursor/sdk";
import {
  getGoogleWorkspaceAuthStatusService,
  runWorkspaceChatToolService,
} from "@/lib/domain/services/google_workspace_auth.service";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";
import { getUserAccess } from "../users/get_user_access.usecase";

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

/**
 * In-process Cursor custom tools backed by first-party Workspace services.
 * Not official Google remote MCP (*mcp.googleapis.com).
 */
export async function buildWorkspaceCustomTools(
  userId: string,
): Promise<Record<string, SDKCustomTool> | undefined> {
  const access = await getUserAccess(userId);
  if (!hasPermission(access?.permissions, USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS)) {
    return undefined;
  }

  const status = await getGoogleWorkspaceAuthStatusService(userId);
  if (!status.isConnected) return undefined;

  const run = async (name: string, args: Record<string, SDKJsonValue>) => {
    try {
      const data = await runWorkspaceChatToolService(userId, name, args);
      return jsonResult(data);
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: error instanceof Error ? error.message : "Workspace tool failed.",
          },
        ],
        isError: true,
      };
    }
  };

  return {
    workspace_status: tool(
      "Get Google Workspace connection status and enabled capabilities (calendar, email, meet).",
      { type: "object", properties: {} },
      (args) => run("workspace_status", args),
    ),
    list_recent_emails: tool(
      "List recent Gmail inbox messages (subject, from, snippet, date). Requires email capability enabled.",
      { type: "object", properties: {} },
      (args) => run("list_recent_emails", args),
    ),
    send_email: tool(
      "Send an email via the user's connected Gmail. Requires email capability enabled.",
      {
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
      (args) => run("send_email", args),
    ),
    list_upcoming_calendar_events: tool(
      "List upcoming Google Calendar events. Requires calendar capability enabled.",
      { type: "object", properties: {} },
      (args) => run("list_upcoming_calendar_events", args),
    ),
    create_calendar_event: tool(
      "Create a Google Calendar event. start/end must be ISO 8601. Optionally add Google Meet.",
      {
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
      (args) => run("create_calendar_event", args),
    ),
    create_google_meet: tool(
      "Create a calendar event with a Google Meet link. Requires meet capability enabled.",
      {
        type: "object",
        properties: {
          summary: { type: "string" },
          start: { type: "string", description: "ISO 8601 start datetime" },
          end: { type: "string", description: "ISO 8601 end datetime" },
        },
      },
      (args) => run("create_google_meet", args),
    ),
  };
}

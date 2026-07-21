import type {
  GenerateCalendarEventInput,
  GenerateEmailInput,
  GenerateMeetInput,
  WorkspaceChatToolName,
  WorkspaceChatToolResult,
} from "@/lib/entities/google_workspace_auth.type";
import { WORKSPACE_CHAT_TOOLS } from "@/lib/entities/google_workspace_auth.type";
import { getGoogleWorkspaceAuth } from "./get_google_workspace_auth.usecase";
import { getRecentEmails } from "./get_recent_emails.usecase";
import { executeEmailAction } from "./execute_email_action.usecase";
import { getRecentCalendarEvents } from "./get_recent_calendar_events.usecase";
import { executeCalendarAction } from "./execute_calendar_action.usecase";
import { executeMeetAction } from "./execute_meet_action.usecase";

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requireString(args: Record<string, unknown>, key: string): string {
  const value = asString(args[key]);
  if (!value) throw new Error(`Missing required argument: ${key}`);
  return value;
}

export async function runWorkspaceChatTool(
  userId: string,
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<WorkspaceChatToolResult> {
  if (!WORKSPACE_CHAT_TOOLS.includes(toolName as WorkspaceChatToolName)) {
    throw new Error(`Unknown Workspace chat tool: ${toolName}`);
  }

  const status = await getGoogleWorkspaceAuth(userId);
  if (!status.isConnected) {
    throw new Error("Google Workspace is not connected. Connect it in Settings → Integrations.");
  }

  switch (toolName as WorkspaceChatToolName) {
    case "workspace_status":
      return status;

    case "list_recent_emails":
      return getRecentEmails(userId);

    case "send_email": {
      const input: GenerateEmailInput = {
        to: requireString(args, "to"),
        subject: requireString(args, "subject"),
        body: requireString(args, "body"),
        cc: asString(args.cc),
        bcc: asString(args.bcc),
      };
      return executeEmailAction(userId, input);
    }

    case "list_upcoming_calendar_events":
      return getRecentCalendarEvents(userId);

    case "create_calendar_event": {
      const input: GenerateCalendarEventInput = {
        summary: requireString(args, "summary"),
        start: requireString(args, "start"),
        end: requireString(args, "end"),
        description: asString(args.description),
        addGoogleMeet: Boolean(args.addGoogleMeet),
      };
      return executeCalendarAction(userId, input);
    }

    case "create_google_meet": {
      const input: GenerateMeetInput = {
        summary: asString(args.summary) ?? "Instant Google Meet",
        start: asString(args.start),
        end: asString(args.end),
      };
      return executeMeetAction(userId, input);
    }
  }
}

import { getGoogleWorkspaceAuth } from "../usecases/google_workspace_auth/get_google_workspace_auth.usecase";
import { handleOAuthCallback } from "../usecases/google_workspace_auth/handle_oauth_callback.usecase";
import { disconnectGoogleWorkspaceAuth } from "../usecases/google_workspace_auth/disconnect_google_workspace_auth.usecase";
import { toggleGoogleWorkspaceCapability } from "../usecases/google_workspace_auth/toggle_google_workspace_capability.usecase";
import { executeCalendarAction } from "../usecases/google_workspace_auth/execute_calendar_action.usecase";
import { executeEmailAction } from "../usecases/google_workspace_auth/execute_email_action.usecase";
import { executeMeetAction } from "../usecases/google_workspace_auth/execute_meet_action.usecase";
import { getRecentCalendarEvents } from "../usecases/google_workspace_auth/get_recent_calendar_events.usecase";
import { getRecentEmails } from "../usecases/google_workspace_auth/get_recent_emails.usecase";
import { runWorkspaceChatTool } from "../usecases/google_workspace_auth/run_workspace_chat_tool.usecase";
import type {
  CalendarEventSummary,
  EmailMessageSummary,
  GenerateCalendarEventInput,
  GenerateEmailInput,
  GenerateMeetInput,
  GoogleWorkspaceAuthRecord,
  MeetSummary,
  WorkspaceCapability,
  WorkspaceChatToolResult,
} from "@/lib/entities/google_workspace_auth.type";

export async function getGoogleWorkspaceAuthStatusService(userId: string): Promise<GoogleWorkspaceAuthRecord> {
  return getGoogleWorkspaceAuth(userId);
}

export async function handleOAuthCallbackService(userId: string, code: string, redirectUri: string): Promise<void> {
  return handleOAuthCallback(userId, code, redirectUri);
}

export async function disconnectGoogleWorkspaceAuthService(userId: string): Promise<void> {
  return disconnectGoogleWorkspaceAuth(userId);
}

export async function toggleGoogleWorkspaceCapabilityService(
  userId: string,
  capability: WorkspaceCapability,
  enabled: boolean
): Promise<void> {
  return toggleGoogleWorkspaceCapability(userId, capability, enabled);
}

export async function generateCalendarEventService(userId: string, input: GenerateCalendarEventInput) {
  return executeCalendarAction(userId, input);
}

export async function generateEmailService(userId: string, input: GenerateEmailInput) {
  return executeEmailAction(userId, input);
}

export async function generateMeetService(userId: string, input: GenerateMeetInput): Promise<MeetSummary> {
  return executeMeetAction(userId, input);
}

export async function getRecentCalendarEventsService(userId: string, query?: string): Promise<CalendarEventSummary[]> {
  return getRecentCalendarEvents(userId, query);
}

export async function getRecentEmailsService(userId: string, query?: string): Promise<EmailMessageSummary[]> {
  return getRecentEmails(userId, query);
}

export async function runWorkspaceChatToolService(
  userId: string,
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<WorkspaceChatToolResult> {
  return runWorkspaceChatTool(userId, toolName, args);
}

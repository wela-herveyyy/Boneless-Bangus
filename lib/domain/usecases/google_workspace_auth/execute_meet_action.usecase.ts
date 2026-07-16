import type { GenerateMeetInput, MeetSummary } from "@/lib/entities/google_workspace_auth.type";
import { getGoogleWorkspaceAuth } from "./get_google_workspace_auth.usecase";
import { executeCalendarAction } from "./execute_calendar_action.usecase";

export async function executeMeetAction(
  userId: string,
  input: GenerateMeetInput
): Promise<MeetSummary> {
  const status = await getGoogleWorkspaceAuth(userId);
  if (!status.isConnected) {
    throw new Error("Google Workspace account is not connected.");
  }
  if (!status.meetEnabled) {
    throw new Error("Google Meet integration is disabled in Workspace Sidebar settings.");
  }

  const now = new Date();
  const startIso = input.start || now.toISOString();
  const endIso = input.end || new Date(now.getTime() + 60 * 60 * 1000).toISOString();

  const result = await executeCalendarAction(userId, {
    summary: input.summary || "Instant Google Meet",
    start: startIso,
    end: endIso,
    addGoogleMeet: true,
  });

  if (!result.hangoutLink) {
    throw new Error("Google Calendar API did not return a Google Meet conference link.");
  }

  return {
    id: result.id,
    summary: result.summary,
    hangoutLink: result.hangoutLink,
    start: startIso,
    end: endIso,
    htmlLink: result.htmlLink,
  };
}

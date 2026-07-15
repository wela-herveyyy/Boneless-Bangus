import type { GenerateCalendarEventInput } from "@/lib/entities/google_workspace_auth.type";
import { getGoogleWorkspaceAuth } from "./get_google_workspace_auth.usecase";
import { refreshAndGetAccessToken } from "./refresh_and_get_access_token.usecase";

export async function executeCalendarAction(
  userId: string,
  input: GenerateCalendarEventInput
): Promise<{ id: string; htmlLink?: string; summary: string }> {
  const status = await getGoogleWorkspaceAuth(userId);
  if (!status.isConnected) {
    throw new Error("Google Workspace account is not connected.");
  }
  if (!status.calendarEnabled) {
    throw new Error("Google Calendar integration is disabled in Workspace Sidebar settings.");
  }

  const accessToken = await refreshAndGetAccessToken(userId);

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: input.summary,
      description: input.description || "",
      start: { dateTime: input.start },
      end: { dateTime: input.end },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Google Calendar API error: ${data.error?.message || data.error_description || "Unknown calendar error"}`
    );
  }

  return {
    id: data.id,
    htmlLink: data.htmlLink,
    summary: data.summary || input.summary,
  };
}

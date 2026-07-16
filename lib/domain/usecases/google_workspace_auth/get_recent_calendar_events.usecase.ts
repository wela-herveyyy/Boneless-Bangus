import type { CalendarEventSummary } from "@/lib/entities/google_workspace_auth.type";
import { getGoogleWorkspaceAuth } from "./get_google_workspace_auth.usecase";
import { refreshAndGetAccessToken } from "./refresh_and_get_access_token.usecase";

export async function getRecentCalendarEvents(userId: string): Promise<CalendarEventSummary[]> {
  const status = await getGoogleWorkspaceAuth(userId);
  if (!status.isConnected || !status.calendarEnabled) {
    return [];
  }

  try {
    const accessToken = await refreshAndGetAccessToken(userId);
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&orderBy=startTime&singleEvents=true&maxResults=10`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch Google Calendar events:", res.statusText);
      return [];
    }

    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    return items.map((item: any) => ({
      id: item.id || Math.random().toString(),
      summary: item.summary || "(No Title)",
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
      htmlLink: item.htmlLink,
    }));
  } catch (error) {
    console.error("Error in getRecentCalendarEvents:", error);
    return [];
  }
}

import {
  generateCalendarEventService,
  getRecentCalendarEventsService,
} from "@/lib/domain/services/google_workspace_auth.service";
import type { GenerateCalendarEventInput } from "@/lib/entities/google_workspace_auth.type";
import {
  requireWorkspaceApiSession,
  workspaceApiError,
  workspaceApiOk,
} from "@/lib/domain/usecases/google_workspace_auth/workspace_api_auth.usecase";

export async function GET(request: Request) {
  try {
    const auth = await requireWorkspaceApiSession(request.headers);
    if ("response" in auth) return auth.response;

    const events = await getRecentCalendarEventsService(auth.session.user.id);
    return workspaceApiOk(events);
  } catch (error) {
    return workspaceApiError(
      error instanceof Error ? error.message : "Failed to list calendar events.",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireWorkspaceApiSession(request.headers);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as Partial<GenerateCalendarEventInput>;
    if (!body.summary?.trim() || !body.start?.trim() || !body.end?.trim()) {
      return workspaceApiError("summary, start, and end are required.", 400);
    }

    const result = await generateCalendarEventService(auth.session.user.id, {
      summary: body.summary.trim(),
      start: body.start.trim(),
      end: body.end.trim(),
      description: body.description,
      addGoogleMeet: body.addGoogleMeet,
    });
    return workspaceApiOk(result);
  } catch (error) {
    return workspaceApiError(
      error instanceof Error ? error.message : "Failed to create calendar event.",
      500,
    );
  }
}

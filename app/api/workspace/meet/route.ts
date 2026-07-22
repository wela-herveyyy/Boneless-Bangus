import { generateMeetService } from "@/lib/domain/services/google_workspace_auth.service";
import type { GenerateMeetInput } from "@/lib/entities/google_workspace_auth.type";
import {
  requireWorkspaceApiSession,
  workspaceApiError,
  workspaceApiOk,
} from "@/lib/domain/usecases/google_workspace_auth/workspace_api_auth.usecase";

export async function POST(request: Request) {
  try {
    const auth = await requireWorkspaceApiSession(request.headers);
    if ("response" in auth) return auth.response;

    const body = (await request.json().catch(() => ({}))) as Partial<GenerateMeetInput>;
    const result = await generateMeetService(auth.session.user.id, {
      summary: body.summary?.trim() || "Instant Google Meet",
      start: body.start,
      end: body.end,
    });
    return workspaceApiOk(result);
  } catch (error) {
    return workspaceApiError(
      error instanceof Error ? error.message : "Failed to create Google Meet.",
      500,
    );
  }
}

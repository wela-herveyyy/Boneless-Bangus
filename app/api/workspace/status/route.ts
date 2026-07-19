import {
  getGoogleWorkspaceAuthStatusService,
} from "@/lib/domain/services/google_workspace_auth.service";
import {
  requireWorkspaceApiSession,
  workspaceApiError,
  workspaceApiOk,
} from "@/lib/domain/usecases/google_workspace_auth/workspace_api_auth.usecase";

export async function GET(request: Request) {
  try {
    const auth = await requireWorkspaceApiSession(request.headers);
    if ("response" in auth) return auth.response;

    const status = await getGoogleWorkspaceAuthStatusService(auth.session.user.id);
    return workspaceApiOk(status);
  } catch (error) {
    return workspaceApiError(
      error instanceof Error ? error.message : "Failed to load Workspace status.",
      500,
    );
  }
}

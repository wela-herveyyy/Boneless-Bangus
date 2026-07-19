import { runWorkspaceChatToolService } from "@/lib/domain/services/google_workspace_auth.service";
import {
  requireWorkspaceApiSession,
  workspaceApiError,
  workspaceApiOk,
} from "@/lib/domain/usecases/google_workspace_auth/workspace_api_auth.usecase";

export async function POST(request: Request) {
  try {
    const auth = await requireWorkspaceApiSession(request.headers);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as {
      name?: string;
      arguments?: Record<string, unknown>;
    };

    const name = body.name?.trim();
    if (!name) {
      return workspaceApiError("Tool name is required.", 400);
    }

    const result = await runWorkspaceChatToolService(
      auth.session.user.id,
      name,
      body.arguments ?? {},
    );
    return workspaceApiOk(result);
  } catch (error) {
    return workspaceApiError(
      error instanceof Error ? error.message : "Workspace tool failed.",
      500,
    );
  }
}

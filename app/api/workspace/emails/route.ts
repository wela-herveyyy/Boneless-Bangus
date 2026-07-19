import {
  generateEmailService,
  getRecentEmailsService,
} from "@/lib/domain/services/google_workspace_auth.service";
import type { GenerateEmailInput } from "@/lib/entities/google_workspace_auth.type";
import {
  requireWorkspaceApiSession,
  workspaceApiError,
  workspaceApiOk,
} from "@/lib/domain/usecases/google_workspace_auth/workspace_api_auth.usecase";

export async function GET(request: Request) {
  try {
    const auth = await requireWorkspaceApiSession(request.headers);
    if ("response" in auth) return auth.response;

    const emails = await getRecentEmailsService(auth.session.user.id);
    return workspaceApiOk(emails);
  } catch (error) {
    return workspaceApiError(
      error instanceof Error ? error.message : "Failed to list emails.",
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireWorkspaceApiSession(request.headers);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as Partial<GenerateEmailInput>;
    if (!body.to?.trim() || !body.subject?.trim() || !body.body?.trim()) {
      return workspaceApiError("to, subject, and body are required.", 400);
    }

    const result = await generateEmailService(auth.session.user.id, {
      to: body.to.trim(),
      subject: body.subject.trim(),
      body: body.body,
      cc: body.cc,
      bcc: body.bcc,
    });
    return workspaceApiOk(result);
  } catch (error) {
    return workspaceApiError(
      error instanceof Error ? error.message : "Failed to send email.",
      500,
    );
  }
}

"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import {
  canManageGoogleWorkspaceAuth,
  type CalendarEventSummary,
  type EmailMessageSummary,
  type GenerateCalendarEventInput,
  type GenerateEmailInput,
  type GoogleWorkspaceAuthRecord,
  type GoogleWorkspaceResult,
  type WorkspaceCapability,
} from "@/lib/entities/google_workspace_auth.type";
import {
  disconnectGoogleWorkspaceAuthService,
  generateCalendarEventService,
  generateEmailService,
  getGoogleWorkspaceAuthStatusService,
  getRecentCalendarEventsService,
  getRecentEmailsService,
  toggleGoogleWorkspaceCapabilityService,
} from "@/lib/domain/services/google_workspace_auth.service";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error occurred.";
}

export async function getGoogleWorkspaceAuthStatusAction(): Promise<
  GoogleWorkspaceResult<GoogleWorkspaceAuthRecord>
> {
  const action = "google_workspace:status";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }

    if (!canManageGoogleWorkspaceAuth(userSession.user.role)) {
      return { ok: false, error: "You are not authorized to access Google Workspace settings." };
    }

    const status = await getGoogleWorkspaceAuthStatusService(userSession.user.id);
    return { ok: true, data: status };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function disconnectGoogleWorkspaceAuthAction(): Promise<GoogleWorkspaceResult> {
  const action = "google_workspace:disconnect";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!canManageGoogleWorkspaceAuth(userSession.user.role)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized." });
      return { ok: false, error: "Not authorized to modify Google Workspace connections." };
    }

    await disconnectGoogleWorkspaceAuthService(userSession.user.id);
    await logAction({ userId: userSession.user.id, action, success: true });
    return { ok: true, data: undefined };
  } catch (error) {
    const err = getErrorMessage(error);
    return { ok: false, error: err };
  }
}

export async function toggleGoogleWorkspaceCapabilityAction(
  capability: WorkspaceCapability,
  enabled: boolean
): Promise<GoogleWorkspaceResult> {
  const action = `google_workspace:toggle_${capability}`;
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!canManageGoogleWorkspaceAuth(userSession.user.role)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized." });
      return { ok: false, error: "Not authorized." };
    }

    await toggleGoogleWorkspaceCapabilityService(userSession.user.id, capability, enabled);
    await logAction({ userId: userSession.user.id, action, success: true });
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function generateCalendarEventAction(
  input: GenerateCalendarEventInput
): Promise<GoogleWorkspaceResult<{ id: string; htmlLink?: string; summary: string }>> {
  const action = "google_workspace:calendar_generate";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!canManageGoogleWorkspaceAuth(userSession.user.role)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized." });
      return { ok: false, error: "Not authorized." };
    }

    const res = await generateCalendarEventService(userSession.user.id, input);
    await logAction({ userId: userSession.user.id, action, success: true });
    return { ok: true, data: res };
  } catch (error) {
    const err = getErrorMessage(error);
    await logAction({ userId: "anonymous", action, success: false, error: err });
    return { ok: false, error: err };
  }
}

export async function generateEmailAction(
  input: GenerateEmailInput
): Promise<GoogleWorkspaceResult<{ id: string; threadId: string }>> {
  const action = "google_workspace:email_generate";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!canManageGoogleWorkspaceAuth(userSession.user.role)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized." });
      return { ok: false, error: "Not authorized." };
    }

    const res = await generateEmailService(userSession.user.id, input);
    await logAction({ userId: userSession.user.id, action, success: true });
    return { ok: true, data: res };
  } catch (error) {
    const err = getErrorMessage(error);
    return { ok: false, error: err };
  }
}

export async function getRecentCalendarEventsAction(): Promise<
  GoogleWorkspaceResult<CalendarEventSummary[]>
> {
  const action = "google_workspace:calendar_events_list";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }

    if (!canManageGoogleWorkspaceAuth(userSession.user.role)) {
      return { ok: false, error: "Not authorized." };
    }

    const events = await getRecentCalendarEventsService(userSession.user.id);
    return { ok: true, data: events };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function getRecentEmailsAction(): Promise<
  GoogleWorkspaceResult<EmailMessageSummary[]>
> {
  const action = "google_workspace:emails_list";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }

    if (!canManageGoogleWorkspaceAuth(userSession.user.role)) {
      return { ok: false, error: "Not authorized." };
    }

    const emails = await getRecentEmailsService(userSession.user.id);
    return { ok: true, data: emails };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

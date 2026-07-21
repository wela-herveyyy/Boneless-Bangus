"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/domain/services/auth.service";
import {
  createTeam,
  getManagedTeamId,
  listTeams,
  updateTeamApiKeys,
} from "@/lib/domain/services/team.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import type { CreateTeamInput, TeamListItem, TeamResult, TeamSelect } from "@/lib/entities/team.type";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

type ActionState = { ok: boolean; error?: string } | null;

function readField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function listTeamsAction(): Promise<TeamResult<TeamListItem[]>> {
  const action = "teams:list";
  const permission = USER_PERMISSION.TEAMS_MANAGE;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!hasPermission(userSession.user.role, permission)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await listTeams();
    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
    });
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function createTeamAction(
  input: Omit<CreateTeamInput, "managerId"> & { managerId?: string },
): Promise<TeamResult<TeamSelect>> {
  const action = "teams:create";
  const permission = USER_PERMISSION.TEAMS_MANAGE;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!hasPermission(userSession.user.role, permission)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await createTeam({
      name: input.name,
      description: input.description,
      managerId: input.managerId?.trim() || userSession.user.id,
    });

    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: result.ok ? { teamId: result.data.id, code: result.data.code } : undefined,
    });
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

/**
 * Team manager (or admin/owner) can set team Cursor / Gemini API keys.
 * Form fields: teamId (optional for manager), cursorApiKey, geminiApiKey.
 * Empty fields keep the existing key.
 */
export async function updateTeamApiKeysAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const action = "teams:update-api-keys";

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }

    const isAdmin = hasPermission(userSession.user.role, USER_PERMISSION.TEAMS_MANAGE);
    let teamId = readField(formData, "teamId");

    if (!teamId) {
      const managed = await getManagedTeamId(userSession.user.id);
      if (!managed.ok) return { ok: false, error: managed.error };
      teamId = managed.data ?? "";
    }

    if (!teamId) {
      return { ok: false, error: "No team found to update." };
    }

    if (!isAdmin) {
      const managed = await getManagedTeamId(userSession.user.id);
      if (!managed.ok) return { ok: false, error: managed.error };
      if (managed.data !== teamId) {
        return { ok: false, error: "Only the team manager can update this team's API keys." };
      }
    }

    const cursorRaw = formData.get("cursorApiKey");
    const geminiRaw = formData.get("geminiApiKey");

    const result = await updateTeamApiKeys({
      teamId,
      // undefined = leave unchanged; empty string also leaves unchanged in usecase when trimmed
      cursorApiKey: cursorRaw === null ? undefined : String(cursorRaw),
      geminiApiKey: geminiRaw === null ? undefined : String(geminiRaw),
    });

    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { teamId },
    });

    if (!result.ok) return { ok: false, error: result.error };

    revalidatePath("/workspace");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

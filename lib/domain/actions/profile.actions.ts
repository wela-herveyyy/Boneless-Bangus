"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { database } from "@/database";
import { userSettings, team, userTeam } from "@/database/schema";
import { auth, getSession } from "@/lib/domain/services/auth.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import { updateProfileService } from "@/lib/domain/services/profile.service";
import { activeMembershipWhere } from "@/lib/domain/usecases/team/active_membership.usecase";

type ActionState = { ok: boolean; error?: string } | null;

function readField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function updateApiKeysAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const action = "profile:update_keys";
  try {
    const userSession = await auth();
    if (!userSession) {
      await logAction({ userId: "anonymous", action, success: false, error: "Unauthorized" });
      return { ok: false, error: "Unauthorized" };
    }

    const cursorApiKey = readField(formData, "cursorApiKey");
    const geminiApiKey = readField(formData, "geminiApiKey");

    const existingSettings = await database.query.userSettings.findFirst({
      where: eq(userSettings.userId, userSession.user.id),
    });

    const finalCursorKey = cursorApiKey !== "" ? cursorApiKey : (existingSettings?.cursorApiKey ?? null);
    const finalGeminiKey = geminiApiKey !== "" ? geminiApiKey : (existingSettings?.geminiApiKey ?? null);

    if (existingSettings) {
      await database.update(userSettings)
        .set({
          cursorApiKey: finalCursorKey,
          geminiApiKey: finalGeminiKey,
        })
        .where(eq(userSettings.id, existingSettings.id));
    } else {
      await database.insert(userSettings).values({
        id: crypto.randomUUID(),
        userId: userSession.user.id,
        cursorApiKey: finalCursorKey,
        geminiApiKey: finalGeminiKey,
      });
    }

    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    revalidatePath("/workspace");
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function joinTeamAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const action = "profile:join_team";
  try {
    const userSession = await auth();
    if (!userSession) {
      await logAction({ userId: "anonymous", action, success: false, error: "Unauthorized" });
      return { ok: false, error: "Unauthorized" };
    }

    const teamCode = readField(formData, "teamCode");
    
    if (!teamCode || teamCode.length !== 6) {
      return { ok: false, error: "Invalid team code. Must be 6 characters." };
    }

    const existingTeam = await database.query.team.findFirst({
      where: eq(team.code, teamCode),
    });

    if (!existingTeam) {
      return { ok: false, error: "Team not found." };
    }

    const now = new Date();
    const activeOnTeam = await database.query.userTeam.findFirst({
      where: activeMembershipWhere(
        and(eq(userTeam.userId, userSession.user.id), eq(userTeam.teamId, existingTeam.id)),
      ),
    });

    if (!activeOnTeam) {
      // Archive any other active membership first.
      await database
        .update(userTeam)
        .set({ archived: true, leftAt: now })
        .where(activeMembershipWhere(eq(userTeam.userId, userSession.user.id)));

      const priorOnTeam = await database.query.userTeam.findFirst({
        where: and(eq(userTeam.userId, userSession.user.id), eq(userTeam.teamId, existingTeam.id)),
      });

      if (priorOnTeam) {
        await database
          .update(userTeam)
          .set({ archived: false, leftAt: null, joinedAt: now })
          .where(eq(userTeam.id, priorOnTeam.id));
      } else {
        await database.insert(userTeam).values({
          id: crypto.randomUUID(),
          userId: userSession.user.id,
          teamId: existingTeam.id,
          joinedAt: now,
          leftAt: null,
          archived: false,
        });
      }
    }

    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    revalidatePath("/workspace");
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function leaveTeamAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const action = "profile:leave_team";
  try {
    const userSession = await auth();
    if (!userSession) {
      await logAction({ userId: "anonymous", action, success: false, error: "Unauthorized" });
      return { ok: false, error: "Unauthorized" };
    }

    const activeTeamRelation = await database.query.userTeam.findFirst({
      where: activeMembershipWhere(eq(userTeam.userId, userSession.user.id)),
    });

    if (!activeTeamRelation) {
      return { ok: false, error: "You are not on a team." };
    }

    const managedTeam = await database.query.team.findFirst({
      where: eq(team.managerId, userSession.user.id),
      columns: { id: true },
    });

    if (managedTeam && managedTeam.id === activeTeamRelation.teamId) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: "Team leaders cannot leave their team",
        role: userSession.user.role,
      });
      return {
        ok: false,
        error: "Team leaders cannot leave their team. Ask an admin to reassign the leader first.",
      };
    }

    await database
      .update(userTeam)
      .set({ archived: true, leftAt: new Date() })
      .where(eq(userTeam.id, activeTeamRelation.id));

    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    revalidatePath("/workspace");
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function updatePersonalInfoAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const action = "profile:update_personal_info";
  try {
    const userSession = await auth();
    if (!userSession) {
      await logAction({ userId: "anonymous", action, success: false, error: "Unauthorized" });
      return { ok: false, error: "Unauthorized" };
    }

    const name = readField(formData, "name");
    const email = readField(formData, "email");

    const result = await updateProfileService(userSession.user.id, { name, email });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    revalidatePath("/workspace");
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function syncOnboardingProfileAction(name: string, role: string): Promise<ActionState> {
  const action = "profile:sync_onboarding";
  try {
    // Use getSession directly because newly registered accounts have a null database role, causing auth() to reject them
    const session = await getSession();
    if (!session) {
      await logAction({ userId: "anonymous", action, success: false, error: "Unauthorized" });
      return { ok: false, error: "Unauthorized" };
    }

    if (name && role) {
      const { user, role: roleTable } = await import("@/database/schema");
      const cleanRole = role.trim().toLowerCase();

      // Owner/admin are not onboarding-selectable — reject so they can't self-assign
      if (cleanRole === "owner" || cleanRole === "admin") {
        await logAction({
          userId: session.user.id,
          action,
          success: false,
          error: "Owner and admin roles cannot be set via onboarding",
        });
        return { ok: false, error: "That role cannot be selected during onboarding." };
      }

      let [targetRole] = await database
        .select({ id: roleTable.id })
        .from(roleTable)
        .where(eq(roleTable.value, cleanRole))
        .limit(1);

      if (!targetRole) {
        const newRoleId = crypto.randomUUID();
        const now = new Date();
        await database.insert(roleTable).values({
          id: newRoleId,
          value: cleanRole,
          label: cleanRole.charAt(0).toUpperCase() + cleanRole.slice(1),
          hint: `System auto-created role record for ${cleanRole}`,
          createdAt: now,
          updatedAt: now,
        });
        targetRole = { id: newRoleId };
      }

      await database
        .update(user)
        .set({ name, roleId: targetRole.id })
        .where(eq(user.id, session.user.id));
    }

    await logAction({ userId: session.user.id, action, success: true });
    revalidatePath("/workspace");
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function getCurrentUserRoleAction(): Promise<{ ok: boolean; role?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false };
    }
    const { getProfileService } = await import("@/lib/domain/services/profile.service");
    const profileData = await getProfileService(session.user.id);
    return { ok: true, role: profileData.role || "" };
  } catch {
    return { ok: false };
  }
}

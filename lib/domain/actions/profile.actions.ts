"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { database } from "@/database";
import { userSettings, team, userTeam } from "@/database/schema";
import { auth } from "@/lib/domain/services/auth.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";

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

    const alreadyInTeam = await database.query.userTeam.findFirst({
      where: (ut, { and, isNull }) => and(
        eq(ut.userId, userSession.user.id),
        eq(ut.teamId, existingTeam.id),
        isNull(ut.leftAt)
      ),
    });

    if (!alreadyInTeam) {
      await database.insert(userTeam).values({
        id: crypto.randomUUID(),
        userId: userSession.user.id,
        teamId: existingTeam.id,
      });
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
      where: (ut, { and, isNull }) => and(
        eq(ut.userId, userSession.user.id),
        isNull(ut.leftAt)
      ),
    });

    if (activeTeamRelation) {
      await database.update(userTeam)
        .set({ leftAt: new Date() as any })
        .where(eq(userTeam.id, activeTeamRelation.id));
    }

    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    revalidatePath("/workspace");
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

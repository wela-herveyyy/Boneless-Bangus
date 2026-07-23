import { eq, isNull, and } from "drizzle-orm";
import { database } from "@/database";
import { userSettings, userTeam, user } from "@/database/schema";

import type { ProfileData } from "@/lib/entities/profile.type";

export async function getProfile(userId: string): Promise<ProfileData> {
  const userRow = await database.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      role: true,
    }
  });

  const settingsRow = await database.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  const currentTeamRelation = await database.query.userTeam.findFirst({
    where: and(
      eq(userTeam.userId, userId),
      isNull(userTeam.leftAt)
    ),
    with: {
      team: true,
    }
  });

  return {
    settings: settingsRow ? {
      cursorApiKey: settingsRow.cursorApiKey,
      geminiApiKey: settingsRow.geminiApiKey,
    } : null,
    team: currentTeamRelation?.team ? {
      teamId: currentTeamRelation.team.id,
      teamCode: currentTeamRelation.team.code,
      teamName: currentTeamRelation.team.name,
      cursorApiKey: currentTeamRelation.team.cursorApiKey,
      geminiApiKey: currentTeamRelation.team.geminiApiKey,
      isManager: currentTeamRelation.team.managerId === userId,
    } : null,
    role: userRow?.role || "dev", // Default fallback
  };
}

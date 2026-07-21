import { count, eq, isNull } from "drizzle-orm";
import { database } from "@/database";
import { team, user, userTeam } from "@/database/schema";
import type { TeamListItem, TeamResult } from "@/lib/entities/team.type";

export async function listTeams(): Promise<TeamResult<TeamListItem[]>> {
  try {
    const rows = await database
      .select({
        id: team.id,
        name: team.name,
        description: team.description,
        code: team.code,
        managerId: team.managerId,
        managerName: user.name,
        managerEmail: user.email,
        cursorApiKey: team.cursorApiKey,
        geminiApiKey: team.geminiApiKey,
        createdAt: team.createdAt,
      })
      .from(team)
      .innerJoin(user, eq(team.managerId, user.id));

    const memberCounts = await database
      .select({
        teamId: userTeam.teamId,
        memberCount: count(userTeam.id),
      })
      .from(userTeam)
      .where(isNull(userTeam.leftAt))
      .groupBy(userTeam.teamId);

    const countByTeam = new Map(memberCounts.map((r) => [r.teamId, Number(r.memberCount)]));

    return {
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        code: row.code,
        managerId: row.managerId,
        managerName: row.managerName,
        managerEmail: row.managerEmail,
        memberCount: countByTeam.get(row.id) ?? 0,
        hasCursorApiKey: Boolean(row.cursorApiKey),
        hasGeminiApiKey: Boolean(row.geminiApiKey),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to list teams.",
    };
  }
}

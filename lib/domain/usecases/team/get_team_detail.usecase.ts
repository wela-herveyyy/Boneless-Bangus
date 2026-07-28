import { eq } from "drizzle-orm";
import { database } from "@/database";
import { team, user, userTeam, role as roleTable } from "@/database/schema";
import type { TeamDetail, TeamResult } from "@/lib/entities/team.type";
import { activeMembershipWhere } from "./active_membership.usecase";
import { getTeamApiUsage } from "./get_team_api_usage.usecase";

export async function getTeamDetail(teamId: string): Promise<TeamResult<TeamDetail>> {
  const id = teamId.trim();
  if (!id) {
    return { ok: false, error: "Team id is required." };
  }

  try {
    const [row] = await database
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
      .innerJoin(user, eq(team.managerId, user.id))
      .where(eq(team.id, id))
      .limit(1);

    if (!row) {
      return { ok: false, error: "Team not found." };
    }

    const memberRows = await database
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        roleValue: roleTable.value,
        joinedAt: userTeam.joinedAt,
      })
      .from(userTeam)
      .innerJoin(user, eq(userTeam.userId, user.id))
      .leftJoin(roleTable, eq(user.roleId, roleTable.id))
      .where(activeMembershipWhere(eq(userTeam.teamId, id)));

    const usageResult = await getTeamApiUsage(id);
    if (!usageResult.ok) {
      return usageResult;
    }

    return {
      ok: true,
      data: {
        id: row.id,
        name: row.name,
        description: row.description,
        code: row.code,
        managerId: row.managerId,
        managerName: row.managerName,
        managerEmail: row.managerEmail,
        hasCursorApiKey: Boolean(row.cursorApiKey),
        hasGeminiApiKey: Boolean(row.geminiApiKey),
        createdAt: row.createdAt.toISOString(),
        members: memberRows.map((m) => ({
          userId: m.userId,
          name: m.name,
          email: m.email,
          role: m.roleValue || "",
          isManager: m.userId === row.managerId,
          joinedAt: m.joinedAt.toISOString(),
        })),
        usage: usageResult.data,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load team detail.",
    };
  }
}

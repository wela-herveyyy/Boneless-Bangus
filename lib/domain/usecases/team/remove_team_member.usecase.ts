import { and, eq } from "drizzle-orm";
import { database } from "@/database";
import { team, userTeam } from "@/database/schema";
import type { TeamResult } from "@/lib/entities/team.type";
import { activeMembershipWhere } from "./active_membership.usecase";

export type RemoveTeamMemberInput = {
  teamId: string;
  userId: string;
};

/** Archive a member on the team roster (`archived=true` + leftAt). */
export async function removeTeamMember(
  input: RemoveTeamMemberInput,
): Promise<TeamResult<{ teamId: string; userId: string }>> {
  const teamId = input.teamId.trim();
  const userId = input.userId.trim();
  if (!teamId || !userId) {
    return { ok: false, error: "Team and user are required." };
  }

  try {
    const [teamRow] = await database
      .select({ id: team.id, managerId: team.managerId })
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    if (!teamRow) {
      return { ok: false, error: "Team not found." };
    }

    if (teamRow.managerId === userId) {
      return {
        ok: false,
        error: "Cannot archive the team leader. Reassign the leader first.",
      };
    }

    const [membership] = await database
      .select({ id: userTeam.id })
      .from(userTeam)
      .where(activeMembershipWhere(and(eq(userTeam.teamId, teamId), eq(userTeam.userId, userId))))
      .limit(1);

    if (!membership) {
      return { ok: false, error: "User is not an active member of this team." };
    }

    await database
      .update(userTeam)
      .set({ archived: true, leftAt: new Date() })
      .where(eq(userTeam.id, membership.id));

    return { ok: true, data: { teamId, userId } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to archive team member.",
    };
  }
}

import { and, eq, ne } from "drizzle-orm";
import { database } from "@/database";
import { team, user, userTeam } from "@/database/schema";
import type { TeamResult } from "@/lib/entities/team.type";
import { activeMembershipWhere } from "./active_membership.usecase";

export type ChangeTeamLeaderInput = {
  teamId: string;
  newManagerId: string;
};

/**
 * Reassign team.managerId. New leader is joined/reactivated on this team
 * (and archived off any other active team membership).
 */
export async function changeTeamLeader(
  input: ChangeTeamLeaderInput,
): Promise<TeamResult<{ teamId: string; managerId: string }>> {
  const teamId = input.teamId.trim();
  const newManagerId = input.newManagerId.trim();
  if (!teamId || !newManagerId) {
    return { ok: false, error: "Team and new leader are required." };
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

    if (teamRow.managerId === newManagerId) {
      return { ok: false, error: "That user is already the team leader." };
    }

    const [managerUser] = await database
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, newManagerId))
      .limit(1);

    if (!managerUser) {
      return { ok: false, error: "New leader user not found." };
    }

    const now = new Date();

    // Archive other active memberships (not this team).
    await database
      .update(userTeam)
      .set({ archived: true, leftAt: now })
      .where(activeMembershipWhere(and(eq(userTeam.userId, newManagerId), ne(userTeam.teamId, teamId))));

    const [existing] = await database
      .select({ id: userTeam.id, archived: userTeam.archived, leftAt: userTeam.leftAt })
      .from(userTeam)
      .where(and(eq(userTeam.teamId, teamId), eq(userTeam.userId, newManagerId)))
      .limit(1);

    if (existing) {
      if (existing.archived || existing.leftAt) {
        await database
          .update(userTeam)
          .set({ archived: false, leftAt: null, joinedAt: now })
          .where(eq(userTeam.id, existing.id));
      }
    } else {
      await database.insert(userTeam).values({
        id: crypto.randomUUID(),
        userId: newManagerId,
        teamId,
        joinedAt: now,
        leftAt: null,
        archived: false,
      });
    }

    await database
      .update(team)
      .set({ managerId: newManagerId, updatedAt: now })
      .where(eq(team.id, teamId));

    return { ok: true, data: { teamId, managerId: newManagerId } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to change team leader.",
    };
  }
}

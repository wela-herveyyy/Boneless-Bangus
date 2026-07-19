import { and, eq, isNull } from "drizzle-orm";
import { database } from "@/database";
import { team, user, userTeam } from "@/database/schema";
import type { CreateTeamInput, TeamResult, TeamSelect } from "@/lib/entities/team.type";

function randomTeamCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function createTeam(input: CreateTeamInput): Promise<TeamResult<TeamSelect>> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Team name is required." };
  }
  if (!input.managerId.trim()) {
    return { ok: false, error: "Team manager is required." };
  }

  try {
    const [manager] = await database
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, input.managerId))
      .limit(1);

    if (!manager) {
      return { ok: false, error: "Manager user not found." };
    }

    let code = randomTeamCode();
    for (let attempt = 0; attempt < 8; attempt++) {
      const [existing] = await database
        .select({ id: team.id })
        .from(team)
        .where(eq(team.code, code))
        .limit(1);
      if (!existing) break;
      code = randomTeamCode();
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const row = {
      id,
      name,
      description: input.description?.trim() || null,
      code,
      managerId: input.managerId,
      cursorApiKey: null,
      geminiApiKey: null,
      createdAt: now,
      updatedAt: now,
    };

    await database.insert(team).values(row);

    // Keep one active team membership: leave any current team first.
    await database
      .update(userTeam)
      .set({ leftAt: now })
      .where(and(eq(userTeam.userId, input.managerId), isNull(userTeam.leftAt)));

    await database.insert(userTeam).values({
      id: crypto.randomUUID(),
      userId: input.managerId,
      teamId: id,
      joinedAt: now,
      leftAt: null,
    });

    return { ok: true, data: row };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create team.",
    };
  }
}

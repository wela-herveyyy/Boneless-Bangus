import { eq } from "drizzle-orm";
import { database } from "@/database";
import { team } from "@/database/schema";
import type { TeamResult } from "@/lib/entities/team.type";

/** Returns the team id when the user is its manager. */
export async function getManagedTeamId(userId: string): Promise<TeamResult<string | null>> {
  try {
    const [row] = await database
      .select({ id: team.id })
      .from(team)
      .where(eq(team.managerId, userId))
      .limit(1);

    return { ok: true, data: row?.id ?? null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to resolve managed team.",
    };
  }
}

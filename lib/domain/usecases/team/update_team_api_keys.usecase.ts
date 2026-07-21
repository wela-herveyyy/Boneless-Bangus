import { eq } from "drizzle-orm";
import { database } from "@/database";
import { team } from "@/database/schema";
import type { TeamResult, UpdateTeamApiKeysInput } from "@/lib/entities/team.type";

/**
 * Update team Cursor/Gemini API keys.
 * Caller must already authorize: team manager, or admin/owner.
 */
export async function updateTeamApiKeys(
  input: UpdateTeamApiKeysInput,
): Promise<TeamResult<{ id: string }>> {
  const teamId = input.teamId.trim();
  if (!teamId) {
    return { ok: false, error: "Team id is required." };
  }

  try {
    const [existing] = await database
      .select({
        id: team.id,
        cursorApiKey: team.cursorApiKey,
        geminiApiKey: team.geminiApiKey,
      })
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Team not found." };
    }

    const cursorApiKey =
      input.cursorApiKey !== undefined && input.cursorApiKey.trim() !== ""
        ? input.cursorApiKey.trim()
        : existing.cursorApiKey;
    const geminiApiKey =
      input.geminiApiKey !== undefined && input.geminiApiKey.trim() !== ""
        ? input.geminiApiKey.trim()
        : existing.geminiApiKey;

    await database
      .update(team)
      .set({
        cursorApiKey,
        geminiApiKey,
        updatedAt: new Date(),
      })
      .where(eq(team.id, teamId));

    return { ok: true, data: { id: teamId } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update team API keys.",
    };
  }
}

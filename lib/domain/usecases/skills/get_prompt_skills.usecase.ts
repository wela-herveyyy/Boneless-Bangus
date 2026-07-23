import "server-only";
import { and, eq, or } from "drizzle-orm";
import { database } from "@/database";
import { skill, userInstalledSkill } from "@/database/schema";
import type { CursorSkill } from "@/lib/entities/cursor.type";
import { builtinSkillsAsCursorSkills } from "./builtin_skills";

/**
 * Skills to inject into Cursor prompts: built-ins + DB skills the user authored or installed.
 */
export async function getPromptSkills(userId: string): Promise<CursorSkill[]> {
  const byName = new Map<string, CursorSkill>();

  for (const s of builtinSkillsAsCursorSkills()) {
    byName.set(s.name, s);
  }

  try {
    const rows = await database
      .select({
        name: skill.name,
        instructions: skill.instructions,
      })
      .from(skill)
      .leftJoin(
        userInstalledSkill,
        and(eq(userInstalledSkill.skillId, skill.id), eq(userInstalledSkill.userId, userId)),
      )
      .where(or(eq(skill.authorId, userId), eq(userInstalledSkill.userId, userId)));

    for (const row of rows) {
      if (!row.name?.trim() || !row.instructions?.trim()) continue;
      byName.set(row.name, { name: row.name, content: row.instructions });
    }
  } catch (error) {
    console.warn("[getPromptSkills] Failed to load DB skills:", error);
  }

  return Array.from(byName.values());
}

export function mergePromptSkills(
  fromClient: CursorSkill[] | undefined,
  fromServer: CursorSkill[],
): CursorSkill[] {
  const byName = new Map<string, CursorSkill>();
  for (const s of fromServer) byName.set(s.name, s);
  for (const s of fromClient ?? []) {
    if (s?.name && s.content) byName.set(s.name, s);
  }
  return Array.from(byName.values());
}

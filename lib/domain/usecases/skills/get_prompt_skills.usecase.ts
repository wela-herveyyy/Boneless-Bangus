import "server-only";
import { and, eq, or } from "drizzle-orm";
import { database } from "@/database";
import { skill, userInstalledSkill } from "@/database/schema";
import type { CursorSkill } from "@/lib/entities/cursor.type";
import { BUILTIN_SKILLS } from "./builtin_skills";

const OMIT_FROM_PROMPT = new Set(
  BUILTIN_SKILLS.filter((s) => s.omitFromPrompt).map((s) => s.name),
);

/**
 * Skills for Cursor prompts: DB records the user can access (global / authored / installed).
 * Large template skills (`omitFromPrompt`) are listed by name only — load via skills MCP `get_skill`.
 * Code builtins are not the runtime source of truth after seed.
 */
export async function getPromptSkills(userId: string): Promise<CursorSkill[]> {
  const byName = new Map<string, CursorSkill>();

  try {
    const rows = await database
      .select({
        name: skill.name,
        instructions: skill.instructions,
        description: skill.description,
      })
      .from(skill)
      .leftJoin(
        userInstalledSkill,
        and(eq(userInstalledSkill.skillId, skill.id), eq(userInstalledSkill.userId, userId)),
      )
      .where(
        or(
          eq(skill.isGlobal, true),
          eq(skill.authorId, userId),
          eq(userInstalledSkill.userId, userId),
        ),
      );

    for (const row of rows) {
      if (!row.name?.trim()) continue;

      if (OMIT_FROM_PROMPT.has(row.name)) {
        byName.set(row.name, {
          name: row.name,
          content: [
            row.description?.trim() || "Large skill record.",
            "",
            `Do not invent this content. Call skills MCP get_skill (or skills_get_skill) with name="${row.name}" to load the full instructions.`,
          ].join("\n"),
        });
        continue;
      }

      if (!row.instructions?.trim()) continue;
      byName.set(row.name, { name: row.name, content: row.instructions });
    }
  } catch (error) {
    console.warn("[getPromptSkills] Failed to load DB skills:", error);
  }

  // Fallback stubs if DB empty (not yet seeded) — short code definitions only.
  if (byName.size === 0) {
    for (const s of BUILTIN_SKILLS) {
      if (s.omitFromPrompt || !s.content.trim()) continue;
      byName.set(s.name, { name: s.name, content: s.content });
    }
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

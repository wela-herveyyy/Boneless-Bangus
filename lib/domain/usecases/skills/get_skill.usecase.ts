import "server-only";
import { and, eq, or } from "drizzle-orm";
import { database } from "@/database";
import { skill, skillCategory, userInstalledSkill } from "@/database/schema";

export type SkillRecord = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  categoryName: string;
  isGlobal: boolean;
};

/**
 * Load one skill by exact name when the user may access it:
 * authored, installed, or global marketplace record.
 */
export async function getSkillByNameUsecase(
  userId: string,
  name: string,
): Promise<SkillRecord | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  try {
    const [row] = await database
      .select({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        instructions: skill.instructions,
        categoryName: skillCategory.name,
        isGlobal: skill.isGlobal,
        authorId: skill.authorId,
        installedId: userInstalledSkill.id,
      })
      .from(skill)
      .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
      .leftJoin(
        userInstalledSkill,
        and(eq(userInstalledSkill.skillId, skill.id), eq(userInstalledSkill.userId, userId)),
      )
      .where(eq(skill.name, trimmed))
      .limit(1);

    if (!row) return null;

    const allowed =
      row.isGlobal === true || row.authorId === userId || Boolean(row.installedId);
    if (!allowed) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      instructions: row.instructions,
      categoryName: row.categoryName,
      isGlobal: row.isGlobal,
    };
  } catch (error) {
    console.error("[getSkillByName]", error);
    return null;
  }
}

/** Catalog entries for MCP list (no instructions body). */
export async function listSkillCatalogUsecase(
  userId: string,
): Promise<
  Array<{
    id: string;
    name: string;
    description: string;
    categoryName: string;
    isGlobal: boolean;
    isInstalled: boolean;
    isAuthor: boolean;
  }>
> {
  try {
    const rows = await database
      .select({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        categoryName: skillCategory.name,
        isGlobal: skill.isGlobal,
        authorId: skill.authorId,
        installedId: userInstalledSkill.id,
      })
      .from(skill)
      .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
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

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      categoryName: r.categoryName,
      isGlobal: r.isGlobal,
      isInstalled: Boolean(r.installedId),
      isAuthor: r.authorId === userId,
    }));
  } catch (error) {
    console.error("[listSkillCatalog]", error);
    return [];
  }
}

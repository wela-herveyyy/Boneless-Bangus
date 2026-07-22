import { database } from "@/database";
import { skill, skillCategory, user, userInstalledSkill } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { SkillWithDetails } from "@/lib/entities/skills.type";

export async function getSkillsUsecase(userId: string): Promise<SkillWithDetails[]> {

  try {
    const skills = await database
      .select({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        instructions: skill.instructions,
        categoryId: skill.categoryId,
        authorId: skill.authorId,
        isGlobal: skill.isGlobal,
        createdAt: skill.createdAt,
        updatedAt: skill.updatedAt,
        category: {
          name: skillCategory.name,
        },
        author: {
          name: user.name,
        },
        isInstalled: userInstalledSkill.id,
      })
      .from(skill)
      .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
      .innerJoin(user, eq(skill.authorId, user.id))
      .leftJoin(userInstalledSkill, and(
        eq(userInstalledSkill.skillId, skill.id),
        eq(userInstalledSkill.userId, userId)
      ));
      
    return skills.map((s) => ({
      ...s,
      isInstalled: !!s.isInstalled,
      isAuthor: s.authorId === userId,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

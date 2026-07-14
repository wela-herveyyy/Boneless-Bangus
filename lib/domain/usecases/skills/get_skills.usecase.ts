import { cacheLife, cacheTag } from "next/cache";
import { database } from "@/database";
import { skill, skillCategory, user } from "@/database/schema";
import { eq } from "drizzle-orm";
import { SkillWithDetails } from "@/lib/entities/skills.type";

export async function getSkillsUsecase(): Promise<SkillWithDetails[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("skills");

  try {
    const skills = await database
      .select({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        instructions: skill.instructions,
        categoryId: skill.categoryId,
        authorId: skill.authorId,
        createdAt: skill.createdAt,
        updatedAt: skill.updatedAt,
        category: {
          name: skillCategory.name,
        },
        author: {
          name: user.name,
        },
      })
      .from(skill)
      .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
      .innerJoin(user, eq(skill.authorId, user.id));
      
    return skills;
  } catch (error) {
    console.error(error);
    return [];
  }
}

import "server-only";
import { database } from "@/database";
import { skill, skillCategory, userInstalledSkill } from "@/database/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidateTag } from "next/cache";
import { SkillInsert, SkillCategoryInsert } from "@/lib/entities/skills.type";

export type CreateSkillInput = {
  name: string;
  description: string;
  instructions: string;
  categoryName: string;
  authorId: string;
  isGlobal?: boolean;
};

export async function createSkillUsecase(input: CreateSkillInput): Promise<void> {
  const categories = await database.select().from(skillCategory).where(eq(skillCategory.name, input.categoryName));
  let category = categories[0];

  if (!category) {
    const newCategory: SkillCategoryInsert = {
      id: randomUUID(),
      name: input.categoryName,
    };
    await database.insert(skillCategory).values(newCategory);
    
    const createdCategories = await database.select().from(skillCategory).where(eq(skillCategory.name, input.categoryName));
    category = createdCategories[0];
    
    revalidateTag("skill-categories", "hours");
  }

  const newSkill: SkillInsert = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    instructions: input.instructions,
    categoryId: category.id,
    authorId: input.authorId,
    isGlobal: input.isGlobal ?? false,
  };

  await database.insert(skill).values(newSkill);

  // Automatically install the skill for the creator
  await database.insert(userInstalledSkill).values({
    id: randomUUID(),
    userId: input.authorId,
    skillId: newSkill.id,
  });

  revalidateTag("skills", "hours");
}

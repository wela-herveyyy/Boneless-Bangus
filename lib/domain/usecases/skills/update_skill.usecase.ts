import { database } from "@/database";
import { skill } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { skillCategory } from "@/database/schema";
import { randomUUID } from "crypto";
import { SkillCategoryInsert } from "@/lib/entities/skills.type";

export type UpdateSkillInput = {
  id: string;
  name?: string;
  description?: string;
  instructions?: string;
  categoryId?: string;
  categoryName?: string;
  authorId: string;
  isGlobal?: boolean;
};

export async function updateSkillUsecase(input: UpdateSkillInput): Promise<void> {
  const updates: Partial<typeof skill.$inferInsert> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.instructions !== undefined) updates.instructions = input.instructions;
  if (input.categoryId !== undefined) updates.categoryId = input.categoryId;
  
  if (input.categoryName !== undefined && input.categoryId === undefined) {
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
    updates.categoryId = category.id;
  }

  if (input.isGlobal !== undefined) updates.isGlobal = input.isGlobal;

  if (Object.keys(updates).length === 0) return;

  await database
    .update(skill)
    .set(updates)
    .where(and(eq(skill.id, input.id), eq(skill.authorId, input.authorId)));

  revalidateTag("skills", "hours");
}

import { database } from "@/database";
import { skill } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export type UpdateSkillInput = {
  id: string;
  name?: string;
  description?: string;
  instructions?: string;
  categoryId?: string;
  authorId: string;
};

export async function updateSkillUsecase(input: UpdateSkillInput): Promise<void> {
  const updates: Partial<typeof skill.$inferInsert> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.instructions !== undefined) updates.instructions = input.instructions;
  if (input.categoryId !== undefined) updates.categoryId = input.categoryId;

  if (Object.keys(updates).length === 0) return;

  await database
    .update(skill)
    .set(updates)
    .where(and(eq(skill.id, input.id), eq(skill.authorId, input.authorId)));

  revalidateTag("skills", {});
}

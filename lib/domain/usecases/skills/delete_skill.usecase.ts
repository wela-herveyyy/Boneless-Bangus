import { database } from "@/database";
import { skill } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export type DeleteSkillInput = {
  id: string;
  authorId: string;
};

export async function deleteSkillUsecase(input: DeleteSkillInput): Promise<void> {
  await database
    .delete(skill)
    .where(and(eq(skill.id, input.id), eq(skill.authorId, input.authorId)));

  revalidateTag("skills", "hours");
}

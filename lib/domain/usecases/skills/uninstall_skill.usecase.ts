import "server-only";
import { database } from "@/database";
import { userInstalledSkill } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export type UninstallSkillInput = {
  userId: string;
  skillId: string;
};

export async function uninstallSkillUsecase(input: UninstallSkillInput): Promise<void> {
  await database
    .delete(userInstalledSkill)
    .where(and(eq(userInstalledSkill.userId, input.userId), eq(userInstalledSkill.skillId, input.skillId)));

  revalidateTag("skills", "hours");
}

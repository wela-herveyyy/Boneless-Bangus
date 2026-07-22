import "server-only";
import { database } from "@/database";
import { userInstalledSkill, skill } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidateTag } from "next/cache";

export type InstallSkillInput = {
  userId: string;
  skillId: string;
};

export async function installSkillUsecase(input: InstallSkillInput): Promise<void> {
  const existingSkill = await database.query.skill.findFirst({
    where: eq(skill.id, input.skillId)
  });

  if (!existingSkill) {
    throw new Error("Skill not found");
  }

  if (!existingSkill.isGlobal) {
    throw new Error("Cannot install a private skill");
  }

  if (existingSkill.authorId === input.userId) {
    throw new Error("Cannot install your own skill");
  }

  const alreadyInstalled = await database.query.userInstalledSkill.findFirst({
    where: and(eq(userInstalledSkill.userId, input.userId), eq(userInstalledSkill.skillId, input.skillId))
  });

  if (alreadyInstalled) {
    return;
  }

  await database.insert(userInstalledSkill).values({
    id: randomUUID(),
    userId: input.userId,
    skillId: input.skillId,
  });

  revalidateTag("skills", "hours");
}

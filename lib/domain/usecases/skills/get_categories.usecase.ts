import { cacheLife, cacheTag } from "next/cache";
import { database } from "@/database";
import { skillCategory } from "@/database/schema";
import { SkillCategorySelect } from "@/lib/entities/skills.type";

export async function getCategoriesUsecase(): Promise<SkillCategorySelect[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("skill-categories");

  try {
    return await database.select().from(skillCategory);
  } catch (error) {
    console.error(error);
    return [];
  }
}

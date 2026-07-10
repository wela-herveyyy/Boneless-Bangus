import { getCategoriesUsecase } from "../usecases/skills/get_categories.usecase";
import { getSkillsUsecase } from "../usecases/skills/get_skills.usecase";
import { createSkillUsecase, CreateSkillInput } from "../usecases/skills/create_skill.usecase";
import { SkillCategorySelect, SkillWithDetails } from "@/lib/entities/skills.type";

export async function getSkills(): Promise<SkillWithDetails[]> {
  return await getSkillsUsecase();
}

export async function getSkillCategories(): Promise<SkillCategorySelect[]> {
  return await getCategoriesUsecase();
}

export async function createSkill(input: CreateSkillInput): Promise<void> {
  return await createSkillUsecase(input);
}

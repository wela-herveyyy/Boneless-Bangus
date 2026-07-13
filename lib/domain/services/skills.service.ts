import { getCategoriesUsecase } from "../usecases/skills/get_categories.usecase";
import { getSkillsUsecase } from "../usecases/skills/get_skills.usecase";
import { createSkillUsecase, CreateSkillInput } from "../usecases/skills/create_skill.usecase";
import { updateSkillUsecase, UpdateSkillInput } from "../usecases/skills/update_skill.usecase";
import { deleteSkillUsecase, DeleteSkillInput } from "../usecases/skills/delete_skill.usecase";
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

export async function updateSkill(input: UpdateSkillInput): Promise<void> {
  return await updateSkillUsecase(input);
}

export async function deleteSkill(input: DeleteSkillInput): Promise<void> {
  return await deleteSkillUsecase(input);
}

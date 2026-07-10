"use server";

import { auth } from "@/lib/domain/services/auth.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import { getSkills, getSkillCategories, createSkill } from "../services/skills.service";
import { hasSkillPermission, SKILL_PERMISSION, SkillResult, SkillWithDetails, SkillCategorySelect } from "@/lib/entities/skills.type";
import { CreateSkillInput } from "../usecases/skills/create_skill.usecase";
import { UserRole } from "@/lib/entities/users.type";

export async function getSkillsAction(): Promise<SkillResult<SkillWithDetails[]>> {
  const action = "skills:list";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasSkillPermission(userSession.user.role as UserRole, SKILL_PERMISSION.SKILLS_READ)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized.", role: userSession.user.role });
      return { ok: false, error: "You are not authorized for this action." };
    }

    const skills = await getSkills();

    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    return { ok: true, data: skills };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function getSkillCategoriesAction(): Promise<SkillResult<SkillCategorySelect[]>> {
  const action = "skills:categories";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasSkillPermission(userSession.user.role as UserRole, SKILL_PERMISSION.SKILLS_READ)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized.", role: userSession.user.role });
      return { ok: false, error: "You are not authorized for this action." };
    }

    const categories = await getSkillCategories();

    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    return { ok: true, data: categories };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function createSkillAction(input: Omit<CreateSkillInput, "authorId">): Promise<SkillResult<void>> {
  const action = "skills:create";
  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasSkillPermission(userSession.user.role as UserRole, SKILL_PERMISSION.SKILLS_CREATE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized.", role: userSession.user.role });
      return { ok: false, error: "You are not authorized for this action." };
    }

    await createSkill({
      ...input,
      authorId: userSession.user.id,
    });

    await logAction({ userId: userSession.user.id, action, success: true, role: userSession.user.role });
    return { ok: true, data: undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

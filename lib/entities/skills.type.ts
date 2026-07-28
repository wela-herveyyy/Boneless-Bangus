import { skill, skillCategory } from "@/database/schema";
import { UserRole, USER_ROLE } from "./users.type";

export type SkillSelect = typeof skill.$inferSelect;
export type SkillInsert = typeof skill.$inferInsert;

export type SkillCategorySelect = typeof skillCategory.$inferSelect;
export type SkillCategoryInsert = typeof skillCategory.$inferInsert;

export const SKILL_PERMISSION = {
  SKILLS_READ: "skills:read",
  SKILLS_CREATE: "skills:create",
  SKILLS_DELETE: "skills:delete",
} as const;

export type SkillPermission = (typeof SKILL_PERMISSION)[keyof typeof SKILL_PERMISSION];

export const ROLE_SKILL_PERMISSIONS: Record<UserRole, SkillPermission[]> = {
  [USER_ROLE.OWNER]: [SKILL_PERMISSION.SKILLS_READ, SKILL_PERMISSION.SKILLS_CREATE, SKILL_PERMISSION.SKILLS_DELETE],
  [USER_ROLE.ADMIN]: [SKILL_PERMISSION.SKILLS_READ, SKILL_PERMISSION.SKILLS_CREATE, SKILL_PERMISSION.SKILLS_DELETE],
  [USER_ROLE.TECH]: [SKILL_PERMISSION.SKILLS_READ, SKILL_PERMISSION.SKILLS_CREATE],
  [USER_ROLE.DEV]: [SKILL_PERMISSION.SKILLS_READ, SKILL_PERMISSION.SKILLS_CREATE],
  [USER_ROLE.SALES]: [SKILL_PERMISSION.SKILLS_READ],
  [USER_ROLE.QA]: [SKILL_PERMISSION.SKILLS_READ],
  [USER_ROLE.PO]: [SKILL_PERMISSION.SKILLS_READ, SKILL_PERMISSION.SKILLS_CREATE],
  [USER_ROLE.PM]: [SKILL_PERMISSION.SKILLS_READ, SKILL_PERMISSION.SKILLS_CREATE],
  [USER_ROLE.FINANCE]: [SKILL_PERMISSION.SKILLS_READ],
};

export function hasSkillPermission(role: UserRole, permission: SkillPermission): boolean {
  const perms = ROLE_SKILL_PERMISSIONS[role as keyof typeof ROLE_SKILL_PERMISSIONS] || [SKILL_PERMISSION.SKILLS_READ];
  return perms.includes(permission);
}


// Extends SkillSelect to include the category name and author name for the UI
export type SkillWithDetails = SkillSelect & {
  category: { name: string };
  author: { name: string };
  isInstalled?: boolean;
  isAuthor?: boolean;
};

export type SkillResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

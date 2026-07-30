import { role } from "@/database/schema";
import type { UserPermission } from "./users.type";

export type RoleSelect = typeof role.$inferSelect;
export type RoleInsert = typeof role.$inferInsert;

export type CreateRoleInput = {
  value: string;
  label: string;
  hint?: string;
  description?: string;
  permissions?: UserPermission[] | string[];
};

export type UpdateRoleInput = {
  id: string;
  value: string;
  label: string;
  hint?: string;
  description?: string;
  permissions?: UserPermission[] | string[];
};

export type DeleteRoleInput = {
  id: string;
};

export type RoleResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type MyAccess = {
  role: string;
  permissions: string[];
};

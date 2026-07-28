import { role } from "@/database/schema";

export type RoleSelect = typeof role.$inferSelect;
export type RoleInsert = typeof role.$inferInsert;

export type CreateRoleInput = {
  value: string;
  label: string;
  hint?: string;
  description?: string;
};

export type UpdateRoleInput = {
  id: string;
  value: string;
  label: string;
  hint?: string;
  description?: string;
};

export type DeleteRoleInput = {
  id: string;
};

export type RoleResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

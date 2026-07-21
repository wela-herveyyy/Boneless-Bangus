import { team } from "@/database/schema";
import type { UserRole } from "./users.type";

export type TeamSelect = typeof team.$inferSelect;
export type TeamInsert = typeof team.$inferInsert;

export type TeamResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CreateTeamInput = {
  name: string;
  description?: string;
  managerId: string;
};

export type TeamListItem = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  managerId: string;
  managerName: string;
  managerEmail: string;
  memberCount: number;
  hasCursorApiKey: boolean;
  hasGeminiApiKey: boolean;
  createdAt: string;
};

export type UpdateTeamApiKeysInput = {
  teamId: string;
  cursorApiKey?: string;
  geminiApiKey?: string;
};

export function canManageTeams(role?: UserRole | string): boolean {
  return role === "owner" || role === "admin";
}

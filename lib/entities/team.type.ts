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

export type TeamMemberItem = {
  userId: string;
  name: string;
  email: string;
  role: string;
  isManager: boolean;
  joinedAt: string;
};

export type TeamUsageBucket = {
  promptCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: string;
};

export type TeamApiUsage = {
  conversationCount: number;
  promptCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: string;
  byKeySource: {
    personal: TeamUsageBucket;
    team: TeamUsageBucket;
    system: TeamUsageBucket;
    unknown: TeamUsageBucket;
  };
};

export type TeamDetail = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  managerId: string;
  managerName: string;
  managerEmail: string;
  hasCursorApiKey: boolean;
  hasGeminiApiKey: boolean;
  createdAt: string;
  members: TeamMemberItem[];
  usage: TeamApiUsage;
};

export function canManageTeams(role?: UserRole | string): boolean {
  const key = String(role ?? "").trim().toLowerCase();
  return key === "owner" || key === "admin";
}

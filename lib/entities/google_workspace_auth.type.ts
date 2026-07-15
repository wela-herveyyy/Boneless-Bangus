import { googleWorkspaceAuth } from "@/database/schema";
import type { UserRole } from "./users.type";

export type GoogleWorkspaceAuthSelect = typeof googleWorkspaceAuth.$inferSelect;
export type GoogleWorkspaceAuthInsert = typeof googleWorkspaceAuth.$inferInsert;

export type GoogleWorkspaceAuthRecord = {
  isConnected: boolean;
  email?: string;
  calendarEnabled: boolean;
  emailEnabled: boolean;
  meetEnabled: boolean;
  tokenExpiresAt?: Date | null;
};

export type WorkspaceCapability = "calendar" | "email" | "meet";

export const GOOGLE_WORKSPACE_PERMISSION = {
  WORKSPACE_MANAGE: "workspace:manage",
} as const;

export type GoogleWorkspacePermission = (typeof GOOGLE_WORKSPACE_PERMISSION)[keyof typeof GOOGLE_WORKSPACE_PERMISSION];

export const WORKSPACE_ROLE_PERMISSIONS: Record<UserRole, GoogleWorkspacePermission[]> = {
  owner: ["workspace:manage"],
  admin: ["workspace:manage"],
  tech: ["workspace:manage"],
  sales: ["workspace:manage"],
  dev: ["workspace:manage"],
  qa: ["workspace:manage"],
  po: ["workspace:manage"],
  pm: ["workspace:manage"],
  finance: ["workspace:manage"],
};

export function canManageGoogleWorkspaceAuth(role?: UserRole | string): boolean {
  if (!role) return false;
  const perms = WORKSPACE_ROLE_PERMISSIONS[role as UserRole];
  return perms ? perms.includes("workspace:manage") : true;
}

export type ToggleGoogleWorkspaceCapabilityInput = {
  capability: WorkspaceCapability;
  enabled: boolean;
};

export type GenerateCalendarEventInput = {
  summary: string;
  description?: string;
  start: string; // ISO 8601 string
  end: string; // ISO 8601 string
  addGoogleMeet?: boolean;
};

export type GenerateMeetInput = {
  summary: string;
  start?: string; // ISO 8601 string
  end?: string; // ISO 8601 string
};

export type MeetSummary = {
  id: string;
  summary: string;
  hangoutLink: string;
  start: string;
  end: string;
  htmlLink?: string;
};

export type GenerateEmailInput = {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
};

export type CalendarEventSummary = {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink?: string;
};

export type EmailMessageSummary = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
};

export type GoogleWorkspaceResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

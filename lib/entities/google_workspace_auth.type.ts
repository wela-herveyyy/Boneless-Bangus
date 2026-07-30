import { googleWorkspaceAuth } from "@/database/schema";
import { hasPermission, USER_PERMISSION } from "./users.type";

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

/** Prefer `hasPermission(permissions, USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS)`. */
export function canManageGoogleWorkspaceAuth(
  permissions?: readonly string[] | null,
): boolean {
  return hasPermission(permissions, USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS);
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

/** First-party Workspace tools exposed to Cursor chat (not official Google MCP). */
export const WORKSPACE_CHAT_TOOLS = [
  "workspace_status",
  "list_recent_emails",
  "send_email",
  "list_upcoming_calendar_events",
  "create_calendar_event",
  "create_google_meet",
] as const;

export type WorkspaceChatToolName = (typeof WORKSPACE_CHAT_TOOLS)[number];

export type WorkspaceChatToolArgs = Record<string, unknown>;

export type WorkspaceChatToolResult = unknown;

/** Gemini Interactions API client-side function tool shape. */
export type FunctionT = {
  type: "function";
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
};

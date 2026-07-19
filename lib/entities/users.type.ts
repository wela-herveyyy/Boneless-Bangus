import { user } from "@/database/schema";

export type UserSelect = typeof user.$inferSelect;
export type UserInsert = typeof user.$inferInsert;

export const USER_ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
  TECH: "tech",
  SALES: "sales",
  DEV: "dev",
  QA: "qa",
  PO: "po",
  PM: "pm",
  FINANCE: "finance",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

const USER_ROLE_VALUES = new Set<string>(Object.values(USER_ROLE));

export function isUserRole(value: string): value is UserRole {
  return USER_ROLE_VALUES.has(value);
}

export const USER_PERMISSION = {
  USERS_READ: "users:read",
  USERS_DELETE: "users:delete",
  USERS_MANAGE: "users:manage",
  USERS_AUDIT: "users:audit",
  TEAMS_MANAGE: "teams:manage",
  CURSOR_PROMPT: "cursor:prompt",
  GOOGLE_AI_INTERACT: "google_ai:interact",
  ERPNEXT_ACCESS: "erpnext:access",
  AI_CONVERSATIONS: "ai:conversations",
} as const;

export type UserPermission = (typeof USER_PERMISSION)[keyof typeof USER_PERMISSION];

const CHAT_PERMS: UserPermission[] = [
  USER_PERMISSION.USERS_READ,
  USER_PERMISSION.CURSOR_PROMPT,
  USER_PERMISSION.GOOGLE_AI_INTERACT,
  USER_PERMISSION.ERPNEXT_ACCESS,
  USER_PERMISSION.AI_CONVERSATIONS,
];

const ADMIN_PERMS: UserPermission[] = [
  USER_PERMISSION.USERS_READ,
  USER_PERMISSION.USERS_DELETE,
  USER_PERMISSION.USERS_MANAGE,
  USER_PERMISSION.USERS_AUDIT,
  USER_PERMISSION.TEAMS_MANAGE,
  USER_PERMISSION.CURSOR_PROMPT,
  USER_PERMISSION.GOOGLE_AI_INTERACT,
  USER_PERMISSION.ERPNEXT_ACCESS,
  USER_PERMISSION.AI_CONVERSATIONS,
];

export const ROLE_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  [USER_ROLE.OWNER]: ADMIN_PERMS,
  [USER_ROLE.ADMIN]: ADMIN_PERMS,
  [USER_ROLE.TECH]: CHAT_PERMS,
  [USER_ROLE.SALES]: CHAT_PERMS,
  [USER_ROLE.DEV]: CHAT_PERMS,
  [USER_ROLE.QA]: CHAT_PERMS,
  [USER_ROLE.PO]: CHAT_PERMS,
  [USER_ROLE.PM]: CHAT_PERMS,
  [USER_ROLE.FINANCE]: CHAT_PERMS,
};

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: USER_ROLE.OWNER, label: "Owner" },
  { value: USER_ROLE.ADMIN, label: "Admin" },
  { value: USER_ROLE.TECH, label: "Tech" },
  { value: USER_ROLE.SALES, label: "Sales" },
  { value: USER_ROLE.DEV, label: "Dev" },
  { value: USER_ROLE.QA, label: "QA" },
  { value: USER_ROLE.PO, label: "PO" },
  { value: USER_ROLE.PM, label: "PM" },
  { value: USER_ROLE.FINANCE, label: "Finance" },
];

export type UpdateUserRoleInput = {
  userId: string;
  role: UserRole;
};

export type UserApiUsage = {
  conversationCount: number;
  promptCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: string;
};

export type AdminUserDetail = {
  user: UserSelect;
  team: {
    teamCode: string;
    teamName: string;
  } | null;
  hasPersonalCursorKey: boolean;
  hasPersonalGeminiKey: boolean;
  usage: UserApiUsage;
};

export function hasPermission(role: UserRole, permission: UserPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export type UserResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type DeleteUserInput = {
  id: string;
};

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
  CURSOR_PROMPT: "cursor:prompt",
  GOOGLE_AI_INTERACT: "google_ai:interact",
} as const;

export type UserPermission = (typeof USER_PERMISSION)[keyof typeof USER_PERMISSION];

const CHAT_PERMS: UserPermission[] = [
  USER_PERMISSION.USERS_READ,
  USER_PERMISSION.CURSOR_PROMPT,
  USER_PERMISSION.GOOGLE_AI_INTERACT,
];

export const ROLE_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  [USER_ROLE.OWNER]: [
    USER_PERMISSION.USERS_READ,
    USER_PERMISSION.USERS_DELETE,
    USER_PERMISSION.CURSOR_PROMPT,
    USER_PERMISSION.GOOGLE_AI_INTERACT,
  ],
  [USER_ROLE.ADMIN]: [
    USER_PERMISSION.USERS_READ,
    USER_PERMISSION.USERS_DELETE,
    USER_PERMISSION.CURSOR_PROMPT,
    USER_PERMISSION.GOOGLE_AI_INTERACT,
  ],
  [USER_ROLE.TECH]: CHAT_PERMS,
  [USER_ROLE.SALES]: CHAT_PERMS,
  [USER_ROLE.DEV]: CHAT_PERMS,
  [USER_ROLE.QA]: CHAT_PERMS,
  [USER_ROLE.PO]: CHAT_PERMS,
  [USER_ROLE.PM]: CHAT_PERMS,
  [USER_ROLE.FINANCE]: CHAT_PERMS,
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

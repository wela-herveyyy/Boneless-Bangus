import { user } from "@/database/schema";

export type UserTableSelect = typeof user.$inferSelect;
export type UserSelect = UserTableSelect & {
  role: string;
};
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

export type UserRole = string;

export function isUserRole(value: string): value is UserRole {
  return Boolean(value && value.trim().length > 0);
}

export const USER_PERMISSION = {
  USERS_READ: "users:read",
  USERS_DELETE: "users:delete",
  USERS_MANAGE: "users:manage",
  USERS_AUDIT: "users:audit",
  TEAMS_MANAGE: "teams:manage",
  CURSOR_PROMPT: "cursor:prompt",
  GOOGLE_AI_INTERACT: "google_ai:interact",
  /** @deprecated use ERPNEXT_LIVRO_ACCESS / ERPNEXT_SCHOOL_ACCESS */
  ERPNEXT_ACCESS: "erpnext:access",
  ERPNEXT_LIVRO_ACCESS: "erpnext:livro",
  ERPNEXT_SCHOOL_ACCESS: "erpnext:school",
  AI_CONVERSATIONS: "ai:conversations",
  GITHUB_MCP_ACCESS: "github_mcp:access",
  GOOGLE_WORKSPACE_ACCESS: "google_workspace:access",
  /** Composer Tools menu — Frappe / document Output modes */
  OUTPUT_WEBFORM: "output:webform",
  OUTPUT_WEBPAGE: "output:webpage",
  OUTPUT_PRINT_FORMAT: "output:print_format",
  OUTPUT_DOCUMENT_EDITOR: "output:document_editor",
} as const;

export type UserPermission = (typeof USER_PERMISSION)[keyof typeof USER_PERMISSION];

const OUTPUT_BASE: UserPermission[] = [
  USER_PERMISSION.OUTPUT_WEBFORM,
  USER_PERMISSION.OUTPUT_WEBPAGE,
  USER_PERMISSION.OUTPUT_PRINT_FORMAT,
  USER_PERMISSION.OUTPUT_DOCUMENT_EDITOR,
];

const CHAT_BASE: UserPermission[] = [
  USER_PERMISSION.USERS_READ,
  USER_PERMISSION.CURSOR_PROMPT,
  USER_PERMISSION.GOOGLE_AI_INTERACT,
  USER_PERMISSION.AI_CONVERSATIONS,
];

const ADMIN_BASE: UserPermission[] = [
  ...CHAT_BASE,
  ...OUTPUT_BASE,
  USER_PERMISSION.USERS_DELETE,
  USER_PERMISSION.USERS_MANAGE,
  USER_PERMISSION.USERS_AUDIT,
  USER_PERMISSION.TEAMS_MANAGE,
  USER_PERMISSION.GITHUB_MCP_ACCESS,
  USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS,
  USER_PERMISSION.ERPNEXT_LIVRO_ACCESS,
  USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS,
];

/** Seed defaults only — runtime reads `role.permissions` from DB. */
export const ROLE_PERMISSION_DEFAULTS: Record<string, UserPermission[]> = {
  [USER_ROLE.OWNER]: ADMIN_BASE,
  [USER_ROLE.ADMIN]: ADMIN_BASE,
  [USER_ROLE.TECH]: [
    ...CHAT_BASE,
    ...OUTPUT_BASE,
    USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS,
    USER_PERMISSION.ERPNEXT_LIVRO_ACCESS,
    USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS,
  ],
  [USER_ROLE.SALES]: [
    ...CHAT_BASE,
    ...OUTPUT_BASE,
    USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS,
    USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS,
  ],
  [USER_ROLE.PM]: [
    ...CHAT_BASE,
    ...OUTPUT_BASE,
    USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS,
    USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS,
  ],
  [USER_ROLE.FINANCE]: [
    ...CHAT_BASE,
    ...OUTPUT_BASE,
    USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS,
    USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS,
  ],
  [USER_ROLE.DEV]: [
    ...CHAT_BASE,
    ...OUTPUT_BASE,
    USER_PERMISSION.GITHUB_MCP_ACCESS,
    USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS,
    USER_PERMISSION.ERPNEXT_LIVRO_ACCESS,
    USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS,
  ],
  [USER_ROLE.QA]: [
    ...CHAT_BASE,
    ...OUTPUT_BASE,
    USER_PERMISSION.GITHUB_MCP_ACCESS,
    USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS,
    USER_PERMISSION.ERPNEXT_LIVRO_ACCESS,
    USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS,
  ],
  [USER_ROLE.PO]: [
    ...CHAT_BASE,
    ...OUTPUT_BASE,
    USER_PERMISSION.GITHUB_MCP_ACCESS,
    USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS,
    USER_PERMISSION.ERPNEXT_LIVRO_ACCESS,
    USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS,
  ],
};

/** Permissions Admin can toggle on a role (labels for UI). */
export const ASSIGNABLE_PERMISSION_OPTIONS: {
  value: UserPermission;
  label: string;
  group: "tools" | "admin" | "chat" | "output";
}[] = [
  { value: USER_PERMISSION.GITHUB_MCP_ACCESS, label: "GitHub MCP", group: "tools" },
  { value: USER_PERMISSION.GOOGLE_WORKSPACE_ACCESS, label: "Google Workspace", group: "tools" },
  { value: USER_PERMISSION.ERPNEXT_LIVRO_ACCESS, label: "Livro ERP MCP", group: "tools" },
  { value: USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS, label: "School ERP MCP", group: "tools" },
  { value: USER_PERMISSION.USERS_READ, label: "Users read", group: "admin" },
  { value: USER_PERMISSION.USERS_MANAGE, label: "Users manage", group: "admin" },
  { value: USER_PERMISSION.USERS_DELETE, label: "Users delete", group: "admin" },
  { value: USER_PERMISSION.USERS_AUDIT, label: "Users audit", group: "admin" },
  { value: USER_PERMISSION.TEAMS_MANAGE, label: "Teams manage", group: "admin" },
  { value: USER_PERMISSION.CURSOR_PROMPT, label: "Cursor chat", group: "chat" },
  { value: USER_PERMISSION.GOOGLE_AI_INTERACT, label: "Google AI", group: "chat" },
  { value: USER_PERMISSION.AI_CONVERSATIONS, label: "AI conversations", group: "chat" },
  { value: USER_PERMISSION.OUTPUT_WEBFORM, label: "Web Form", group: "output" },
  { value: USER_PERMISSION.OUTPUT_WEBPAGE, label: "Web page", group: "output" },
  { value: USER_PERMISSION.OUTPUT_PRINT_FORMAT, label: "Print format", group: "output" },
  { value: USER_PERMISSION.OUTPUT_DOCUMENT_EDITOR, label: "Document Editor", group: "output" },
];

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
    teamId: string;
    teamCode: string;
    teamName: string;
  } | null;
  hasPersonalCursorKey: boolean;
  hasPersonalGeminiKey: boolean;
  usage: UserApiUsage;
};

/** Check a permission against a role's permission list from the DB. */
export function hasPermission(
  permissions: readonly string[] | null | undefined,
  permission: UserPermission,
): boolean {
  if (!permissions?.length) return false;
  return permissions.includes(permission);
}

/** Catalog guard for Admin saves. */
export function isAssignablePermission(value: string): value is UserPermission {
  return ASSIGNABLE_PERMISSION_OPTIONS.some((o) => o.value === value);
}

export function normalizePermissionList(raw: unknown): UserPermission[] {
  if (!Array.isArray(raw)) return [];
  const out: UserPermission[] = [];
  for (const item of raw) {
    if (typeof item === "string" && isAssignablePermission(item)) {
      out.push(item);
    }
  }
  return [...new Set(out)];
}

export type UserResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type DeleteUserInput = {
  id: string;
};

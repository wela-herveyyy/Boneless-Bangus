import type { UserRole } from "@/lib/entities/users.type";

export type SignInInput = {
  email: string;
  password: string;
  callbackURL?: string;
  rememberMe?: boolean;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  image?: string;
  callbackURL?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export type AuthSession = {
  user: AuthUser;
};

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ActionSession = {
  user: AuthUser & { role: UserRole };
  expired: boolean;
};

export type ActionLogEntry = {
  userId: string;
  action: string;
  success: boolean;
  error?: string;
  role?: string;
  metadata?: Record<string, unknown>;
};


// ── Tool / Skill command registry ──────────────────────────────

type ErpNextCommands = "comment_doctype" | "leave-application" | "get-user-info";
type GwsCommands = "send-email" | "list-inbox";

interface ToolSkillMap {
  "erp-next": ErpNextCommands;
  "gws": GwsCommands;
}

export type ToolSkill<T extends keyof ToolSkillMap = keyof ToolSkillMap> =
  T extends unknown
  ? { commandName: T; subCommand: ToolSkillMap[T] }
  : never;
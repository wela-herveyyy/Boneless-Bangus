export type ProfileData = {
  settings: {
    cursorApiKey: string | null;
    geminiApiKey: string | null;
  } | null;
  team: {
    teamId: string;
    teamCode: string;
    teamName: string;
    cursorApiKey: string | null;
    geminiApiKey: string | null;
    /** True when the current user is this team's manager (team head). */
    isManager: boolean;
  } | null;
  role: import("./users.type").UserRole | string;
};

export type UpdateProfileInput = {
  name: string;
  email: string;
};

export type UpdateProfileOutput =
  | { ok: true }
  | { ok: false; error: string };

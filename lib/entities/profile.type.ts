export type ProfileData = {
  settings: {
    cursorApiKey: string | null;
    geminiApiKey: string | null;
  } | null;
  team: {
    teamCode: string;
    teamName: string;
    cursorApiKey: string | null;
    geminiApiKey: string | null;
  } | null;
};

export type UpdateProfileInput = {
  name: string;
  email: string;
};

export type UpdateProfileOutput =
  | { ok: true }
  | { ok: false; error: string };

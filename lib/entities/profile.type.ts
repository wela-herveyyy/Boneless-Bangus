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

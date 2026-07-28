import { getProfile } from "@/lib/domain/usecases/profile/get_profile.usecase";
import { AI_PROVIDER, type AiKeySource, type AiProvider } from "@/lib/entities/ai.type";

export type ResolvedApiKey =
  | { ok: true; apiKey: string; source: AiKeySource }
  | { ok: false; error: string };

const FALLBACK_ORDER: AiKeySource[] = ["personal", "team", "system"];

function labelFor(source: AiKeySource): string {
  switch (source) {
    case "personal":
      return "Personal key";
    case "team":
      return "Team key";
    case "system":
      return "System key";
  }
}

/** Pick API key for a provider. When `preferred` is set, that source must exist. */
export async function resolveApiKey(
  userId: string | undefined,
  provider: AiProvider,
  preferred?: AiKeySource | null,
): Promise<ResolvedApiKey> {
  const systemKey =
    provider === AI_PROVIDER.CURSOR
      ? process.env.CURSOR_API_KEY
      : (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY);

  let personal: string | null | undefined;
  let team: string | null | undefined;

  if (userId) {
    const profile = await getProfile(userId);
    if (provider === AI_PROVIDER.CURSOR) {
      personal = profile.settings?.cursorApiKey;
      team = profile.team?.cursorApiKey;
    } else {
      personal = profile.settings?.geminiApiKey;
      team = profile.team?.geminiApiKey;
    }
  }

  const bySource: Record<AiKeySource, string | undefined> = {
    personal: personal?.trim() || undefined,
    team: team?.trim() || undefined,
    system: systemKey?.trim() || undefined,
  };

  if (preferred) {
    const apiKey = bySource[preferred];
    if (!apiKey) {
      return {
        ok: false,
        error: `${labelFor(preferred)} is not configured for this model.`,
      };
    }
    return { ok: true, apiKey, source: preferred };
  }

  for (const source of FALLBACK_ORDER) {
    const apiKey = bySource[source];
    if (apiKey) return { ok: true, apiKey, source };
  }

  return {
    ok: false,
    error:
      provider === AI_PROVIDER.CURSOR
        ? "CURSOR_API_KEY is not set in environment or your profile."
        : "GEMINI_API_KEY is not set in environment or your profile.",
  };
}

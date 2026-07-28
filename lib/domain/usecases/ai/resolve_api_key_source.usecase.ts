import { getProfile } from "@/lib/domain/usecases/profile/get_profile.usecase";
import { AI_PROVIDER, type AiKeySource, type AiProvider } from "@/lib/entities/ai.type";

/** Resolve which key would fund a prompt (personal → team → system). */
export async function resolveApiKeySource(
  userId: string,
  provider: AiProvider,
): Promise<AiKeySource> {
  const profile = await getProfile(userId);

  if (provider === AI_PROVIDER.CURSOR) {
    if (profile.settings?.cursorApiKey) return "personal";
    if (profile.team?.cursorApiKey) return "team";
    return "system";
  }

  if (profile.settings?.geminiApiKey) return "personal";
  if (profile.team?.geminiApiKey) return "team";
  return "system";
}

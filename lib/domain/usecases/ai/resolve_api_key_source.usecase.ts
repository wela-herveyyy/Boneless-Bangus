import { resolveApiKey } from "@/lib/domain/usecases/ai/resolve_api_key.usecase";
import type { AiKeySource, AiProvider } from "@/lib/entities/ai.type";

/** Resolve which key would fund a prompt (preferred, else personal → team → system). */
export async function resolveApiKeySource(
  userId: string,
  provider: AiProvider,
  preferred?: AiKeySource | null,
): Promise<AiKeySource> {
  const resolved = await resolveApiKey(userId, provider, preferred);
  if (resolved.ok) return resolved.source;
  return preferred ?? "system";
}

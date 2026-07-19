import { eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpCredential } from "@/database/schema";
import { encryptCredential, decryptCredential } from "@/lib/utils/credentialCrypto";
import type { McpAuth } from "@/lib/domain/schemas/mcp_server_config.schema";

const oauthTokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

/**
 * Encrypts with AES-256-GCM and stores a new sensitive credential in MySQL.
 * Returns the opaque credentialRef ID.
 */
export async function saveCredential(
  userId: string,
  slug: string,
  label: string,
  plaintext: string
): Promise<string> {
  if (!plaintext || !userId || !slug) {
    throw new Error("Missing required fields for saving credential.");
  }

  const encrypted = encryptCredential(plaintext);
  const id = crypto.randomUUID();

  await database.insert(mcpCredential).values({
    id,
    userId,
    slug,
    label: label.trim() || "API Key",
    encryptedValue: encrypted.ciphertext,
    iv: encrypted.iv,
    createdAt: new Date(),
  });

  return id;
}

/**
 * Retrieves and decrypts a credential given its opaque reference ID.
 * Enforces strong ownership check (userId MUST match). Never logs secret values.
 */
export async function resolveCredential(ref: string, userId: string): Promise<string> {
  if (!ref || typeof ref !== "string") return "";

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  if (!isUuid) {
    return ref;
  }

  const rows = await database
    .select()
    .from(mcpCredential)
    .where(eq(mcpCredential.id, ref))
    .limit(1);

  if (rows.length === 0) {
    return ref;
  }

  const row = rows[0];
  if (row.userId !== userId) {
    throw new Error("Unauthorized: credential does not belong to current user.");
  }

  return decryptCredential(row.encryptedValue, row.iv, 1);
}

/**
 * Dispatches on auth.type to construct runtime HTTP headers / stdio environment variables.
 */
export async function resolveAuthHeaders(
  auth: McpAuth | undefined,
  userId: string,
  slug: string = "default"
): Promise<Record<string, string>> {
  if (!auth || auth.type === "none") {
    return {};
  }

  if (auth.type === "bearer") {
    const token = await resolveCredential(auth.credentialRef, userId);
    return { Authorization: `Bearer ${token}` };
  }

  if (auth.type === "api-key") {
    const secret = await resolveCredential(auth.credentialRef, userId);
    return { [auth.headerName]: secret };
  }

  if (auth.type === "oauth-refresh") {
    const cacheKey = `${slug}:${userId}`;
    const cached = oauthTokenCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt - 30_000) {
      return { Authorization: `Bearer ${cached.accessToken}` };
    }

    const [clientId, clientSecret, refreshToken] = await Promise.all([
      resolveCredential(auth.clientIdRef, userId),
      resolveCredential(auth.clientSecretRef, userId),
      resolveCredential(auth.refreshTokenRef, userId),
    ]);

    console.log("[resolveAuthHeaders:oauth-refresh]", {
      slug,
      userId,
      clientIdRef: auth.clientIdRef,
      resolvedClientId: clientId?.slice(0, 20),
      resolvedClientSecret: clientSecret?.slice(0, 6),
      resolvedRefreshToken: refreshToken?.slice(0, 15),
    });

    const res = await fetch(auth.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      throw new Error(`Failed to refresh OAuth token for ${slug}: HTTP ${res.status} ${errText}`);
    }

    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      throw new Error(`OAuth refresh response did not contain access_token for ${slug}`);
    }

    oauthTokenCache.set(cacheKey, {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600_000),
    });

    return { Authorization: `Bearer ${data.access_token}` };
  }

  return {};
}

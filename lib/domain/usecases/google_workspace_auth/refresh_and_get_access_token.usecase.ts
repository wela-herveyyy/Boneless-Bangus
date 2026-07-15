import { eq } from "drizzle-orm";
import { database } from "@/database";
import { googleWorkspaceAuth } from "@/database/schema";
import { decryptCredential, encryptCredential } from "@/lib/utils/credentialCrypto";

export async function refreshAndGetAccessToken(userId: string): Promise<string> {
  const rows = await database
    .select()
    .from(googleWorkspaceAuth)
    .where(eq(googleWorkspaceAuth.userId, userId))
    .limit(1);

  const record = rows[0];
  if (!record) {
    throw new Error("Google Workspace account is not connected.");
  }

  // Check if current access token is still valid (at least 60 seconds buffer)
  if (
    record.accessTokenEnc &&
    record.accessTokenIv &&
    record.tokenExpiresAt &&
    record.tokenExpiresAt.getTime() > Date.now() + 60000
  ) {
    try {
      return decryptCredential(
        record.accessTokenEnc,
        record.accessTokenIv,
        record.encryptionKeyVersion
      );
    } catch {
      // If decryption fails or auth tag mismatch, fall through to token refresh
    }
  }

  const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google Workspace OAuth client credentials are not configured on the server.");
  }

  const plaintextRefreshToken = decryptCredential(
    record.refreshTokenEnc,
    record.refreshTokenIv,
    record.encryptionKeyVersion
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: plaintextRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Failed to refresh Google access token: ${data.error_description || data.error || "Unknown OAuth refresh error"}`
    );
  }

  const newAccessToken = data.access_token;
  if (!newAccessToken) {
    throw new Error("Google token refresh did not return an access token.");
  }

  const encryptedAccess = encryptCredential(newAccessToken);
  const tokenExpiresAt = data.expires_in
    ? new Date(Date.now() + Number(data.expires_in) * 1000)
    : new Date(Date.now() + 3600 * 1000);

  await database
    .update(googleWorkspaceAuth)
    .set({
      accessTokenEnc: encryptedAccess.ciphertext,
      accessTokenIv: encryptedAccess.iv,
      tokenExpiresAt,
    })
    .where(eq(googleWorkspaceAuth.userId, userId));

  return newAccessToken;
}

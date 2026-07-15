import { eq } from "drizzle-orm";
import { database } from "@/database";
import { googleWorkspaceAuth } from "@/database/schema";
import { encryptCredential } from "@/lib/utils/credentialCrypto";
import crypto from "crypto";

export async function handleOAuthCallback(
  userId: string,
  code: string,
  redirectUri: string
): Promise<void> {
  const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google Workspace OAuth credentials (GOOGLE_WORKSPACE_CLIENT_ID / CLIENT_SECRET) are not configured on the server."
    );
  }

  // 1. Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || tokenData.error) {
    throw new Error(
      `Google token exchange failed: ${tokenData.error_description || tokenData.error || "Unknown error"}`
    );
  }

  const { access_token, refresh_token, expires_in } = tokenData;
  if (!access_token) {
    throw new Error("Google did not return an access token.");
  }

  // 2. Check if we have an existing row to reuse refresh_token if Google didn't return a new one
  const existingRows = await database
    .select()
    .from(googleWorkspaceAuth)
    .where(eq(googleWorkspaceAuth.userId, userId))
    .limit(1);
  const existingRow = existingRows[0];

  let finalRefreshTokenEnc = existingRow?.refreshTokenEnc;
  let finalRefreshTokenIv = existingRow?.refreshTokenIv;
  let finalKeyVersion = existingRow?.encryptionKeyVersion || 1;

  if (refresh_token) {
    const encryptedRefresh = encryptCredential(refresh_token);
    finalRefreshTokenEnc = encryptedRefresh.ciphertext;
    finalRefreshTokenIv = encryptedRefresh.iv;
    finalKeyVersion = encryptedRefresh.keyVersion;
  } else if (!finalRefreshTokenEnc || !finalRefreshTokenIv) {
    throw new Error(
      "Google did not return a refresh token. Please revoke the app access in your Google Account security settings and reconnect to allow offline access."
    );
  }

  // 3. Fetch user email via Google userinfo endpoint
  const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const userinfoData = await userinfoRes.json();
  const email = userinfoData.email || existingRow?.email || "unknown@gmail.com";

  // 4. Encrypt access token
  const encryptedAccess = encryptCredential(access_token);
  const tokenExpiresAt = expires_in
    ? new Date(Date.now() + Number(expires_in) * 1000)
    : new Date(Date.now() + 3600 * 1000);

  // 5. Upsert row
  if (existingRow) {
    await database
      .update(googleWorkspaceAuth)
      .set({
        email,
        refreshTokenEnc: finalRefreshTokenEnc,
        refreshTokenIv: finalRefreshTokenIv,
        accessTokenEnc: encryptedAccess.ciphertext,
        accessTokenIv: encryptedAccess.iv,
        encryptionKeyVersion: finalKeyVersion,
        tokenExpiresAt,
      })
      .where(eq(googleWorkspaceAuth.userId, userId));
  } else {
    await database.insert(googleWorkspaceAuth).values({
      id: crypto.randomUUID(),
      userId,
      email,
      refreshTokenEnc: finalRefreshTokenEnc,
      refreshTokenIv: finalRefreshTokenIv,
      accessTokenEnc: encryptedAccess.ciphertext,
      accessTokenIv: encryptedAccess.iv,
      encryptionKeyVersion: finalKeyVersion,
      tokenExpiresAt,
      calendarEnabled: true,
      emailEnabled: true,
    });
  }
}

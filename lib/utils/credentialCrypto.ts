import crypto from "crypto";

const CURRENT_KEY_VERSION = 1;
const DEFAULT_DEV_KEY = "bbai-workspace-oauth-secret-dev-key-fallback";

/**
 * Derives a strict 32-byte Buffer from whatever secret string is stored in the versioned env var.
 */
function getKeyForVersion(version: number): Buffer {
  const envVar = `WORKSPACE_CRED_ENCRYPTION_KEY_V${version}`;
  const rawKey = process.env[envVar] || process.env.WORKSPACE_CRED_ENCRYPTION_KEY || DEFAULT_DEV_KEY;
  return crypto.createHash("sha256").update(rawKey).digest();
}

export type EncryptedCredential = {
  ciphertext: string; // base64 encoded payload + 16-byte auth tag
  iv: string; // hex encoded 12-byte initialization vector
  keyVersion: number;
};

/**
 * Encrypts sensitive string (e.g., refresh_token, access_token) using AES-256-GCM.
 */
export function encryptCredential(plaintext: string): EncryptedCredential {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty credential.");
  }

  const keyVersion = CURRENT_KEY_VERSION;
  const keyBuffer = getKeyForVersion(keyVersion);
  const ivBuffer = crypto.randomBytes(12); // 12 bytes recommended for GCM

  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, ivBuffer);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // Append authTag to ciphertext before base64 encoding
  const combined = Buffer.concat([encrypted, authTag]).toString("base64");

  return {
    ciphertext: combined,
    iv: ivBuffer.toString("hex"),
    keyVersion,
  };
}

/**
 * Decrypts sensitive base64 string using AES-256-GCM and stored IV + keyVersion.
 */
export function decryptCredential(
  ciphertextBase64: string,
  ivHex: string,
  keyVersion: number = CURRENT_KEY_VERSION
): string {
  if (!ciphertextBase64 || !ivHex) {
    throw new Error("Cannot decrypt missing ciphertext or IV.");
  }

  const keyBuffer = getKeyForVersion(keyVersion);
  const ivBuffer = Buffer.from(ivHex, "hex");
  const combined = Buffer.from(ciphertextBase64, "base64");

  if (combined.length < 16) {
    throw new Error("Invalid ciphertext: too short for GCM authentication tag.");
  }

  // Extract auth tag (last 16 bytes) and actual ciphertext (remaining bytes)
  const authTag = combined.subarray(combined.length - 16);
  const encryptedData = combined.subarray(0, combined.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, ivBuffer);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (error) {
    throw new Error(`Failed to decrypt credential (authentication tag mismatch or invalid key version ${keyVersion}): ${(error as Error).message}`);
  }
}

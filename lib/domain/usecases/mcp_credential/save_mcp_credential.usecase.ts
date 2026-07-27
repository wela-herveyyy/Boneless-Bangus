import { and, eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpCredential } from "@/database/schema";

/**
 * Upsert credential for (userId, slug) — replace any previous row so
 * "Update PAT" does not leave a stale token that get-by-slug still reads.
 */
export async function saveMcpCredential(
  id: string,
  userId: string,
  slug: string,
  label: string,
  encryptedValue: string,
  iv: string,
): Promise<void> {
  await database
    .delete(mcpCredential)
    .where(and(eq(mcpCredential.userId, userId), eq(mcpCredential.slug, slug)));

  await database.insert(mcpCredential).values({
    id,
    userId,
    slug,
    label,
    encryptedValue,
    iv,
    createdAt: new Date(),
  });
}

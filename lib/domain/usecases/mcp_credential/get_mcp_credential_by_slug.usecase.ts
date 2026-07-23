import { and, eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpCredential } from "@/database/schema";

export async function getMcpCredentialBySlug(userId: string, slug: string) {
  const rows = await database
    .select()
    .from(mcpCredential)
    .where(
      and(
        eq(mcpCredential.userId, userId),
        eq(mcpCredential.slug, slug)
      )
    )
    .limit(1);

  if (rows.length === 0) {
    return null;
  }
  
  return rows[0];
}

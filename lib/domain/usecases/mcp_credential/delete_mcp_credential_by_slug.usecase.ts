import { and, eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpCredential } from "@/database/schema";

export async function deleteMcpCredentialBySlug(userId: string, slug: string) {
  await database
    .delete(mcpCredential)
    .where(
      and(
        eq(mcpCredential.userId, userId),
        eq(mcpCredential.slug, slug)
      )
    );
}

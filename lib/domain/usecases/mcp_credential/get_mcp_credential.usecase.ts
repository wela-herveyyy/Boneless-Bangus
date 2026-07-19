import { eq } from "drizzle-orm";
import { database } from "@/database";
import { mcpCredential } from "@/database/schema";

export async function getMcpCredentialById(id: string) {
  const rows = await database
    .select()
    .from(mcpCredential)
    .where(eq(mcpCredential.id, id))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }
  
  return rows[0];
}

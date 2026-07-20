import { database } from "@/database";
import { mcpCredential } from "@/database/schema";

export async function saveMcpCredential(
  id: string,
  userId: string,
  slug: string,
  label: string,
  encryptedValue: string,
  iv: string
): Promise<void> {
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

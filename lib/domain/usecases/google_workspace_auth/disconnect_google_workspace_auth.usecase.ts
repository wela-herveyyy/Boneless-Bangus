import { eq } from "drizzle-orm";
import { database } from "@/database";
import { googleWorkspaceAuth } from "@/database/schema";

export async function disconnectGoogleWorkspaceAuth(userId: string): Promise<void> {
  await database
    .delete(googleWorkspaceAuth)
    .where(eq(googleWorkspaceAuth.userId, userId));
}

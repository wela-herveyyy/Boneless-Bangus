import { eq } from "drizzle-orm";
import { database } from "@/database";
import { googleWorkspaceAuth } from "@/database/schema";
import type { WorkspaceCapability } from "@/lib/entities/google_workspace_auth.type";

export async function toggleGoogleWorkspaceCapability(
  userId: string,
  capability: WorkspaceCapability,
  enabled: boolean
): Promise<void> {
  const updateData: Partial<typeof googleWorkspaceAuth.$inferInsert> =
    capability === "calendar"
      ? { calendarEnabled: enabled }
      : capability === "email"
      ? { emailEnabled: enabled }
      : { meetEnabled: enabled };

  await database
    .update(googleWorkspaceAuth)
    .set(updateData)
    .where(eq(googleWorkspaceAuth.userId, userId));
}

import { eq } from "drizzle-orm";
import { database } from "@/database";
import { googleWorkspaceAuth } from "@/database/schema";
import type { GoogleWorkspaceAuthRecord } from "@/lib/entities/google_workspace_auth.type";

export async function getGoogleWorkspaceAuth(userId: string): Promise<GoogleWorkspaceAuthRecord> {
  try {
    const rows = await database
      .select({
        email: googleWorkspaceAuth.email,
        calendarEnabled: googleWorkspaceAuth.calendarEnabled,
        emailEnabled: googleWorkspaceAuth.emailEnabled,
        meetEnabled: googleWorkspaceAuth.meetEnabled,
        tokenExpiresAt: googleWorkspaceAuth.tokenExpiresAt,
      })
      .from(googleWorkspaceAuth)
      .where(eq(googleWorkspaceAuth.userId, userId))
      .limit(1);

    const record = rows[0];
    if (!record) {
      return {
        isConnected: false,
        calendarEnabled: true,
        emailEnabled: true,
        meetEnabled: true,
        tokenExpiresAt: null,
      };
    }

    return {
      isConnected: true,
      email: record.email,
      calendarEnabled: record.calendarEnabled,
      emailEnabled: record.emailEnabled,
      meetEnabled: record.meetEnabled ?? true,
      tokenExpiresAt: record.tokenExpiresAt,
    };
  } catch (error) {
    console.error("Failed to fetch Google Workspace auth status:", error);
    return {
      isConnected: false,
      calendarEnabled: true,
      emailEnabled: true,
      meetEnabled: true,
      tokenExpiresAt: null,
    };
  }
}

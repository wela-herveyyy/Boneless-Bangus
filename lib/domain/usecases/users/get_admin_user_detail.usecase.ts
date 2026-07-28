import { and, eq, isNull } from "drizzle-orm";
import { database } from "@/database";
import { user, userSettings, userTeam, role as roleTable } from "@/database/schema";
import type { AdminUserDetail, UserResult } from "@/lib/entities/users.type";
import { EMPTY_USAGE, getUserApiUsage } from "./get_user_api_usage.usecase";

export async function getAdminUserDetail(userId: string): Promise<UserResult<AdminUserDetail>> {
  const id = userId.trim();
  if (!id) {
    return { ok: false, error: "User id is required." };
  }

  try {
    const [row] = await database
      .select({
        user: user,
        roleValue: roleTable.value,
      })
      .from(user)
      .leftJoin(roleTable, eq(user.roleId, roleTable.id))
      .where(eq(user.id, id))
      .limit(1);

    if (!row) {
      return { ok: false, error: "User not found." };
    }

    const userData = { ...row.user, role: row.roleValue || "" };

    const settings = await database.query.userSettings.findFirst({
      where: eq(userSettings.userId, id),
    });

    const membership = await database.query.userTeam.findFirst({
      where: and(eq(userTeam.userId, id), isNull(userTeam.leftAt)),
      with: { team: true },
    });

    const usageResult = await getUserApiUsage(id);
    const usage = usageResult.ok ? usageResult.data : EMPTY_USAGE;

    return {
      ok: true,
      data: {
        user: userData,
        team: membership?.team
          ? {
              teamId: membership.team.id,
              teamCode: membership.team.code,
              teamName: membership.team.name,
            }
          : null,
        hasPersonalCursorKey: Boolean(settings?.cursorApiKey),
        hasPersonalGeminiKey: Boolean(settings?.geminiApiKey),
        usage,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load user detail.",
    };
  }
}

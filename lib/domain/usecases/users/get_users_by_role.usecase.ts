import { cacheLife, cacheTag } from "next/cache";
import { eq } from "drizzle-orm";
import { database } from "@/database";
import { user, role as roleTable } from "@/database/schema";
import type { UserRole, UserSelect } from "@/lib/entities/users.type";

export async function getUsersByRole(role: UserRole): Promise<UserSelect[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("users");
  cacheTag(`users-role-${role}`);

  try {
    const rows = await database
      .select({
        user: user,
        roleValue: roleTable.value,
      })
      .from(user)
      .innerJoin(roleTable, eq(user.roleId, roleTable.id))
      .where(eq(roleTable.value, role));

    return rows.map((r) => ({
      ...r.user,
      role: r.roleValue || "",
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

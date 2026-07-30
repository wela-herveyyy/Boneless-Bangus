import { eq } from "drizzle-orm";
import { database } from "@/database";
import { user, role as roleTable } from "@/database/schema";
import { isUserRole, normalizePermissionList, type UserRole } from "@/lib/entities/users.type";

export type UserAccess = {
  role: UserRole;
  permissions: string[];
};

export async function getUserAccess(userId: string): Promise<UserAccess | null> {
  try {
    const rows = await database
      .select({
        roleValue: roleTable.value,
        permissions: roleTable.permissions,
      })
      .from(user)
      .leftJoin(roleTable, eq(user.roleId, roleTable.id))
      .where(eq(user.id, userId))
      .limit(1);

    const roleValue = rows[0]?.roleValue;
    if (!roleValue || !isUserRole(roleValue)) return null;

    return {
      role: roleValue,
      permissions: normalizePermissionList(rows[0]?.permissions),
    };
  } catch (error) {
    console.error("[getUserAccess]", error);
    return null;
  }
}

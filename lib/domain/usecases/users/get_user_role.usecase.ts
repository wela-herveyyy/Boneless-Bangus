import { eq } from "drizzle-orm";
import { database } from "@/database";
import { user, role as roleTable } from "@/database/schema";
import { isUserRole, type UserRole } from "@/lib/entities/users.type";

export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const rows = await database
      .select({ roleValue: roleTable.value })
      .from(user)
      .leftJoin(roleTable, eq(user.roleId, roleTable.id))
      .where(eq(user.id, userId))
      .limit(1);

    const roleValue = rows[0]?.roleValue;

    if (roleValue && isUserRole(roleValue)) {
      return roleValue;
    }

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

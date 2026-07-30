import { eq } from "drizzle-orm";
import { database } from "@/database";
import { role } from "@/database/schema";
import { normalizePermissionList } from "@/lib/entities/users.type";

export async function getRolePermissionsByValue(roleValue: string): Promise<string[]> {
  const key = roleValue.trim().toLowerCase();
  if (!key) return [];

  try {
    const [row] = await database
      .select({ permissions: role.permissions })
      .from(role)
      .where(eq(role.value, key))
      .limit(1);

    return normalizePermissionList(row?.permissions);
  } catch (error) {
    console.error("[getRolePermissionsByValue]", error);
    return [];
  }
}

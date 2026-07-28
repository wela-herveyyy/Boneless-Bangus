import { cacheLife, cacheTag } from "next/cache";
import { eq } from "drizzle-orm";
import { database } from "@/database";
import type { UserSelect } from "@/lib/entities/users.type";
import { user, role as roleTable } from "@/database/schema";

export async function getUsers(): Promise<UserSelect[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("users");

  try {
    const rows = await database
      .select({
        user: user,
        roleValue: roleTable.value,
      })
      .from(user)
      .leftJoin(roleTable, eq(user.roleId, roleTable.id));

    return rows.map((r) => ({
      ...r.user,
      role: r.roleValue || "",
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

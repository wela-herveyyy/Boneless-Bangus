import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { database } from "@/database";
import { user, role as roleTable } from "@/database/schema";
import {
  isUserRole,
  type UpdateUserRoleInput,
  type UserResult,
  type UserSelect,
} from "@/lib/entities/users.type";

export async function updateUserRole(input: UpdateUserRoleInput): Promise<UserResult<UserSelect>> {
  if (!input.userId.trim()) {
    return { ok: false, error: "User id is required." };
  }
  if (!isUserRole(input.role)) {
    return { ok: false, error: "Invalid role." };
  }

  try {
    const [existing] = await database
      .select()
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "User not found." };
    }

    const cleanRole = input.role.trim().toLowerCase();
    const [dbRoleMatch] = await database
      .select()
      .from(roleTable)
      .where(eq(roleTable.value, cleanRole))
      .limit(1);

    let targetRole: typeof roleTable.$inferSelect | undefined = dbRoleMatch;
    if (!targetRole) {
      const allRoles = await database.select().from(roleTable);
      targetRole = allRoles.find(
        (r) =>
          r.id === input.role ||
          r.value.toLowerCase() === cleanRole ||
          r.label.toLowerCase() === cleanRole,
      );
    }

    if (!targetRole) {
      const newRoleId = crypto.randomUUID();
      const now = new Date();
      const newRoleRecord: typeof roleTable.$inferSelect = {
        id: newRoleId,
        value: cleanRole,
        label: input.role,
        hint: `Assigned via admin control center`,
        description: null,
        permissions: null,
        createdAt: now,
        updatedAt: now,
      };
      await database.insert(roleTable).values(newRoleRecord);
      targetRole = newRoleRecord;
    }

    await database
      .update(user)
      .set({ roleId: targetRole.id, updatedAt: new Date() })
      .where(eq(user.id, input.userId));

    updateTag("users");

    return {
      ok: true,
      data: { ...existing, roleId: targetRole.id, role: targetRole.value },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update role.",
    };
  }
}

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { database } from "@/database";
import { user } from "@/database/schema";
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

    await database
      .update(user)
      .set({ role: input.role, updatedAt: new Date() })
      .where(eq(user.id, input.userId));

    updateTag("users");

    return {
      ok: true,
      data: { ...existing, role: input.role },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update role.",
    };
  }
}

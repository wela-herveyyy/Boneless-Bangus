import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { database } from "@/database";
import { role, user } from "@/database/schema";
import type { DeleteRoleInput, RoleResult } from "@/lib/entities/roles.type";

export async function deleteRole(input: DeleteRoleInput): Promise<RoleResult> {
  if (!input.id.trim()) {
    return { ok: false, error: "Role ID is required." };
  }

  try {
    const [targetRole] = await database
      .select()
      .from(role)
      .where(eq(role.id, input.id))
      .limit(1);

    if (!targetRole) {
      return { ok: false, error: "Role not found." };
    }

    if (targetRole.value === "owner" || targetRole.value === "admin") {
      return { ok: false, error: "System administrative roles (owner/admin) cannot be deleted." };
    }

    const [assignedUser] = await database
      .select({ id: user.id })
      .from(user)
      .where(eq(user.roleId, input.id))
      .limit(1);

    if (assignedUser) {
      return { ok: false, error: "Cannot delete role while users are still assigned to it." };
    }

    await database.delete(role).where(eq(role.id, input.id));
    updateTag("roles");
    updateTag("users");

    return { ok: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete role.";
    return { ok: false, error: message };
  }
}

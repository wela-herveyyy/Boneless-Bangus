import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { database } from "@/database";
import { role } from "@/database/schema";
import type { UpdateRoleInput, RoleResult, RoleSelect } from "@/lib/entities/roles.type";

export async function updateRole(input: UpdateRoleInput): Promise<RoleResult<RoleSelect>> {
  if (!input.id.trim()) {
    return { ok: false, error: "Role ID is required." };
  }
  if (!input.value.trim() || !input.label.trim()) {
    return { ok: false, error: "Role value and label are required." };
  }

  try {
    const [existing] = await database
      .select()
      .from(role)
      .where(eq(role.id, input.id))
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Role not found." };
    }

    const updated = {
      value: input.value.trim().toLowerCase(),
      label: input.label.trim(),
      hint: input.hint?.trim() || null,
      description: input.description?.trim() || null,
      updatedAt: new Date(),
    };

    await database
      .update(role)
      .set(updated)
      .where(eq(role.id, input.id));

    updateTag("roles");
    updateTag("users");

    return { ok: true, data: { ...existing, ...updated } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update role.";
    return { ok: false, error: message };
  }
}

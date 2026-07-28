import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { database } from "@/database";
import { role } from "@/database/schema";
import type { CreateRoleInput, RoleResult, RoleSelect } from "@/lib/entities/roles.type";

export async function createRole(input: CreateRoleInput): Promise<RoleResult<RoleSelect>> {
  if (!input.value.trim() || !input.label.trim()) {
    return { ok: false, error: "Role value and label are required." };
  }

  try {
    const id = randomUUID();
    const newRole = {
      id,
      value: input.value.trim().toLowerCase(),
      label: input.label.trim(),
      hint: input.hint?.trim() || null,
      description: input.description?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await database.insert(role).values(newRole);
    updateTag("roles");
    updateTag("users");

    return { ok: true, data: newRole };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create role.";
    return { ok: false, error: message };
  }
}

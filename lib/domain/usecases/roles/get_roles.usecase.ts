import { database } from "@/database";
import { role } from "@/database/schema";
import type { RoleSelect } from "@/lib/entities/roles.type";

export async function getRoles(): Promise<RoleSelect[]> {
  try {
    return await database.select().from(role);
  } catch (error) {
    console.error("Failed to get roles:", error);
    return [];
  }
}

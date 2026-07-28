import type { CreateRoleInput, DeleteRoleInput, RoleResult, RoleSelect, UpdateRoleInput } from "@/lib/entities/roles.type";
import { createRole as createRoleUseCase } from "../usecases/roles/create_role.usecase";
import { deleteRole as deleteRoleUseCase } from "../usecases/roles/delete_role.usecase";
import { getRoles as getRolesUseCase } from "../usecases/roles/get_roles.usecase";
import { updateRole as updateRoleUseCase } from "../usecases/roles/update_role.usecase";

export async function getRoles(): Promise<RoleSelect[]> {
  return getRolesUseCase();
}

export async function createRole(input: CreateRoleInput): Promise<RoleResult<RoleSelect>> {
  return createRoleUseCase(input);
}

export async function updateRole(input: UpdateRoleInput): Promise<RoleResult<RoleSelect>> {
  return updateRoleUseCase(input);
}

export async function deleteRole(input: DeleteRoleInput): Promise<RoleResult> {
  return deleteRoleUseCase(input);
}

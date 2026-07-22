import { getUsers as getUsersUseCase } from "../usecases/users/get_users.usecase";
import { getUsersByRole } from "../usecases/users/get_users_by_role.usecase";
import { deleteUser as deleteUserUseCase } from "../usecases/users/delete_user.usecase";
import { updateUserRole as updateUserRoleUseCase } from "../usecases/users/update_user_role.usecase";
import { getAdminUserDetail as getAdminUserDetailUseCase } from "../usecases/users/get_admin_user_detail.usecase";
import { getUserApiUsage as getUserApiUsageUseCase } from "../usecases/users/get_user_api_usage.usecase";
import {
  USER_ROLE,
  type AdminUserDetail,
  type DeleteUserInput,
  type UpdateUserRoleInput,
  type UserApiUsage,
  type UserResult,
  type UserSelect,
} from "@/lib/entities/users.type";

export async function getUsers(): Promise<UserSelect[]> {
  return getUsersUseCase();
}

export async function getDevUsers(): Promise<UserSelect[]> {
  return getUsersByRole(USER_ROLE.DEV);
}

export async function deleteUser(input: DeleteUserInput): Promise<UserResult> {
  return deleteUserUseCase(input);
}

export async function updateUserRole(
  input: UpdateUserRoleInput,
): Promise<UserResult<UserSelect>> {
  return updateUserRoleUseCase(input);
}

export async function getAdminUserDetail(
  userId: string,
): Promise<UserResult<AdminUserDetail>> {
  return getAdminUserDetailUseCase(userId);
}

export async function getUserApiUsage(userId: string): Promise<UserResult<UserApiUsage>> {
  return getUserApiUsageUseCase(userId);
}

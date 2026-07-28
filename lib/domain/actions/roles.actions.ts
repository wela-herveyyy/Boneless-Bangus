"use server";

import { auth, getSession } from "@/lib/domain/services/auth.service";
import { createRole, deleteRole, getRoles, updateRole } from "@/lib/domain/services/roles.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import { hasPermission, USER_PERMISSION, USER_ROLE } from "@/lib/entities/users.type";
import type { CreateRoleInput, DeleteRoleInput, RoleResult, RoleSelect, UpdateRoleInput } from "@/lib/entities/roles.type";

export async function getRolesAction(): Promise<RoleResult<RoleSelect[]>> {
  const action = "roles:list";

  try {
    const session = await getSession();
    const userId = session?.user?.id || "anonymous";

    const roles = await getRoles();

    // 2. Accounting
    await logAction({ userId, action, success: true });

    return { ok: true, data: roles };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function createRoleAction(input: CreateRoleInput): Promise<RoleResult<RoleSelect>> {
  const action = "roles:create";

  try {
    // 1. Authentication
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    // 2. Authorization (Only Owner and Admin accounts can create roles)
    if (userSession.user.role !== USER_ROLE.OWNER && userSession.user.role !== USER_ROLE.ADMIN && !hasPermission(userSession.user.role, USER_PERMISSION.USERS_MANAGE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized.", role: userSession.user.role });
      return { ok: false, error: "Only Owner or Admin accounts can create role records." };
    }

    const result = await createRole(input);

    // 3. Accounting
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function updateRoleAction(input: UpdateRoleInput): Promise<RoleResult<RoleSelect>> {
  const action = "roles:update";

  try {
    // 1. Authentication
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    // 2. Authorization (Only Owner and Admin accounts can modify roles)
    if (userSession.user.role !== USER_ROLE.OWNER && userSession.user.role !== USER_ROLE.ADMIN && !hasPermission(userSession.user.role, USER_PERMISSION.USERS_MANAGE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized.", role: userSession.user.role });
      return { ok: false, error: "Only Owner or Admin accounts can update role records." };
    }

    const result = await updateRole(input);

    // 3. Accounting
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function deleteRoleAction(input: DeleteRoleInput): Promise<RoleResult> {
  const action = "roles:delete";

  try {
    // 1. Authentication
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({ userId: "anonymous", action, success: false, error: "Authentication required." });
      return { ok: false, error: "Authentication required." };
    }

    // 2. Authorization (Only Owner and Admin accounts can delete roles)
    if (userSession.user.role !== USER_ROLE.OWNER && userSession.user.role !== USER_ROLE.ADMIN && !hasPermission(userSession.user.role, USER_PERMISSION.USERS_MANAGE)) {
      await logAction({ userId: userSession.user.id, action, success: false, error: "Not authorized.", role: userSession.user.role });
      return { ok: false, error: "Only Owner or Admin accounts can delete role records." };
    }

    const result = await deleteRole(input);

    // 3. Accounting
    await logAction({ userId: userSession.user.id, action, success: result.ok, role: userSession.user.role, error: result.ok ? undefined : result.error });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

"use server";

/**
 * AAA action template — copy this pattern into every protected action.
 *
 * try {
 *   const userSession = await auth();                         // Authentication
 *   if (!userSession || userSession.expired) { log + error }
 *
 *   if (!hasPermission(userSession.user.role, PERMISSION)) {  // Authorization
 *     log + error
 *   }
 *
 *   const data = await someService();
 *
 *   await logAction({ ... });                                 // Accounting
 *   return { ok: true, data };
 * } catch (error) {
 *   await logAction({ ... });
 *   return { ok: false, error: message };
 * }
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/domain/services/auth.service";
import {
  deleteUser,
  getAdminUserDetail,
  getDevUsers,
  getUsers,
  updateUserRole,
} from "@/lib/domain/services/users.service";
import {
  listConversationMessages,
  listConversations,
} from "@/lib/domain/services/ai_conversation.service";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import type { AiConversationListItem, AiMessagePage } from "@/lib/entities/ai.type";
import {
  hasPermission,
  isUserRole,
  USER_PERMISSION,
  USER_ROLE,
  type AdminUserDetail,
  type UserResult,
  type UserRole,
  type UserSelect,
} from "@/lib/entities/users.type";

function readField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error.";
}

/** Owner/admin audit, or the user viewing their own profile. */
function canViewUserProfile(
  sessionUserId: string,
  sessionRole: UserRole,
  targetUserId: string,
): boolean {
  if (sessionUserId === targetUserId) return true;
  return hasPermission(sessionRole, USER_PERMISSION.USERS_AUDIT);
}

/** Reference example — list all users (read permission). */
export async function getUsersAction(): Promise<UserResult<UserSelect[]>> {
  const action = "users:list";
  const permission = USER_PERMISSION.USERS_READ;

  try {
    // 1. Authentication
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({
        userId: "anonymous",
        action,
        success: false,
        error: "Authentication required.",
      });
      return { ok: false, error: "Authentication required." };
    }

    // 2. Authorization
    if (!hasPermission(userSession.user.role, permission)) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: "Not authorized.",
        role: userSession.user.role,
      });
      return { ok: false, error: "You are not authorized for this action." };
    }

    const users = await getUsers();

    // 3. Accounting
    await logAction({
      userId: userSession.user.id,
      action,
      success: true,
      role: userSession.user.role,
    });

    return { ok: true, data: users };
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

/** Same AAA template — list dev role users only. */
export async function getDevUsersAction(): Promise<UserResult<UserSelect[]>> {
  const action = "users:list-dev";
  const permission = USER_PERMISSION.USERS_READ;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({
        userId: "anonymous",
        action,
        success: false,
        error: "Authentication required.",
      });
      return { ok: false, error: "Authentication required." };
    }

    if (!hasPermission(userSession.user.role, permission)) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: "Not authorized.",
        role: userSession.user.role,
      });
      return { ok: false, error: "You are not authorized for this action." };
    }

    const devs = await getDevUsers();

    await logAction({
      userId: userSession.user.id,
      action,
      success: true,
      role: userSession.user.role,
    });

    return { ok: true, data: devs };
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({ userId: "unknown", action, success: false, error: message });
    return { ok: false, error: message };
  }
}

export async function updateUserRoleAction(input: {
  userId: string;
  role: string;
}): Promise<UserResult<UserSelect>> {
  const action = "users:update-role";
  const permission = USER_PERMISSION.USERS_MANAGE;

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!hasPermission(userSession.user.role, permission)) {
      return { ok: false, error: "You are not authorized for this action." };
    }
    if (!isUserRole(input.role)) {
      return { ok: false, error: "Invalid role." };
    }

    // Only owners can assign the owner role.
    if (input.role === USER_ROLE.OWNER && userSession.user.role !== USER_ROLE.OWNER) {
      return { ok: false, error: "Only an owner can assign the owner role." };
    }

    // Admins cannot demote/change owners.
    if (userSession.user.role !== USER_ROLE.OWNER) {
      const users = await getUsers();
      const target = users.find((u) => u.id === input.userId);
      if (target?.role === USER_ROLE.OWNER) {
        return { ok: false, error: "Only an owner can change another owner's role." };
      }
    }

    const result = await updateUserRole({
      userId: input.userId,
      role: input.role as UserRole,
    });

    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { targetUserId: input.userId, role: input.role },
    });
    if (result.ok) {
      revalidatePath("/workspace");
      revalidatePath("/admin");
    }
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function getAdminUserDetailAction(
  userId: string,
): Promise<UserResult<AdminUserDetail>> {
  const action = "users:audit-detail";
  const targetId = userId.trim();

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!canViewUserProfile(userSession.user.id, userSession.user.role, targetId)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await getAdminUserDetail(targetId);
    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { targetUserId: targetId },
    });
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function getAdminUserConversationsAction(
  userId: string,
): Promise<UserResult<AiConversationListItem[]>> {
  const action = "users:audit-conversations";
  const targetId = userId.trim();

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!canViewUserProfile(userSession.user.id, userSession.user.role, targetId)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await listConversations(targetId);
    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { targetUserId: targetId },
    });
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

export async function getAdminUserConversationMessagesAction(
  userId: string,
  conversationId: string,
  opts?: { limit?: number; before?: number },
): Promise<UserResult<AiMessagePage>> {
  const action = "users:audit-messages";
  const targetId = userId.trim();

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return { ok: false, error: "Authentication required." };
    }
    if (!canViewUserProfile(userSession.user.id, userSession.user.role, targetId)) {
      return { ok: false, error: "You are not authorized for this action." };
    }

    const result = await listConversationMessages(targetId, conversationId, opts);
    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      error: result.ok ? undefined : result.error,
      role: userSession.user.role,
      metadata: { targetUserId: targetId, conversationId },
    });
    return result;
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

/** Same AAA template — mutation uses redirect instead of return. */
export async function deleteUserAction(formData: FormData) {
  const action = "users:delete";
  const permission = USER_PERMISSION.USERS_DELETE;
  const id = readField(formData, "id");
  const redirectTo = readField(formData, "redirectTo") || "/users";

  if (!id) {
    redirect(`${redirectTo}?error=${encodeURIComponent("User id is required")}`);
  }

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      await logAction({
        userId: "anonymous",
        action,
        success: false,
        error: "Authentication required.",
        metadata: { targetUserId: id },
      });
      redirect(`${redirectTo}?error=${encodeURIComponent("Authentication required.")}`);
    }

    if (!hasPermission(userSession.user.role, permission)) {
      await logAction({
        userId: userSession.user.id,
        action,
        success: false,
        error: "Not authorized.",
        role: userSession.user.role,
        metadata: { targetUserId: id },
      });
      redirect(`${redirectTo}?error=${encodeURIComponent("You are not authorized for this action.")}`);
    }

    const result = await deleteUser({ id });

    await logAction({
      userId: userSession.user.id,
      action,
      success: result.ok,
      role: userSession.user.role,
      error: result.ok ? undefined : result.error,
      metadata: { targetUserId: id },
    });

    if (!result.ok) {
      redirect(`${redirectTo}?error=${encodeURIComponent(result.error)}`);
    }

    redirect(redirectTo);
  } catch (error) {
    const message = getErrorMessage(error);
    await logAction({
      userId: "unknown",
      action,
      success: false,
      error: message,
      metadata: { targetUserId: id },
    });
    redirect(`${redirectTo}?error=${encodeURIComponent(message)}`);
  }
}

import {
  FRAPPE_TOOL_MODE,
  FRAPPE_TOOL_OPTIONS,
  type FrappeToolMode,
} from "@/lib/entities/frappe_output.type";
import { hasPermission, USER_PERMISSION, type UserPermission } from "@/lib/entities/users.type";

/** RBAC permission required for each composer Tools mode (Off is always allowed). */
export function permissionForFrappeToolMode(
  mode: FrappeToolMode,
): UserPermission | null {
  switch (mode) {
    case FRAPPE_TOOL_MODE.WEBFORM:
      return USER_PERMISSION.OUTPUT_WEBFORM;
    case FRAPPE_TOOL_MODE.WEBPAGE:
      return USER_PERMISSION.OUTPUT_WEBPAGE;
    case FRAPPE_TOOL_MODE.PRINT_FORMAT:
      return USER_PERMISSION.OUTPUT_PRINT_FORMAT;
    case FRAPPE_TOOL_MODE.DOCUMENT_EDITOR:
      return USER_PERMISSION.OUTPUT_DOCUMENT_EDITOR;
    case FRAPPE_TOOL_MODE.OFF:
      return null;
    default: {
      const _never: never = mode;
      return _never;
    }
  }
}

export function canUseFrappeToolMode(
  permissions: readonly string[] | null | undefined,
  mode: FrappeToolMode,
): boolean {
  const required = permissionForFrappeToolMode(mode);
  if (!required) return true;
  return hasPermission(permissions, required);
}

/** Tools menu options visible for this role (always includes Off). */
export function filterFrappeToolOptions(
  permissions: readonly string[] | null | undefined,
): typeof FRAPPE_TOOL_OPTIONS {
  return FRAPPE_TOOL_OPTIONS.filter((option) =>
    canUseFrappeToolMode(permissions, option.id),
  );
}

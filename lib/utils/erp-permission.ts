import { isLivroParent } from "@/lib/utils/erp-embed";
import { USER_PERMISSION, type UserPermission } from "@/lib/entities/users.type";

/** Pick Livro vs School ERP permission from an ERP base URL. */
export function erpPermissionForBaseUrl(baseUrl: string | null | undefined): UserPermission {
  return isLivroParent(baseUrl)
    ? USER_PERMISSION.ERPNEXT_LIVRO_ACCESS
    : USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS;
}

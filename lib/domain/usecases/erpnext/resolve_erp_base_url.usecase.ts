import {
  ERP_BASE_URL,
  normalizeErpBaseUrl,
} from "@/lib/entities/erpnext.type";

/** Prefer request `baseUrl`, else env default. */
export function resolveErpBaseUrl(raw?: string | null): string | null {
  return normalizeErpBaseUrl(raw || ERP_BASE_URL);
}

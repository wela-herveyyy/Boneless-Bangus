import type { ErpnextResult } from "@/lib/entities/erpnext.type";
import { normalizeErpnextBaseUrl } from "./erpnext_http.usecase";
import { getErpLoggedUser } from "./get_logged_user.usecase";

export type ErpUserProfile = {
  /** User.name — usually the email, e.g. worldcupteacher@gmail.com */
  userName: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  userImage?: string | null;
  /** Desk path equivalent: /app/user/{urlencoded name} */
  userPath: string;
};

function erpHeaders(sid: string): HeadersInit {
  return {
    Accept: "application/json",
    Cookie: `sid=${sid}`,
  };
}

/**
 * Resolve the logged-in Frappe user the same way Desk does:
 * 1) sid → frappe.auth.get_logged_user  (who am I)
 * 2) GET /api/resource/User/{name}     (same as /app/user/worldcupteacher%40gmail.com)
 */
export async function getErpUserProfile(
  baseUrl: string,
  sid: string,
): Promise<ErpnextResult<ErpUserProfile>> {
  const site = normalizeErpnextBaseUrl(baseUrl);
  if (!site) return { ok: false, error: "Invalid ERPNext base URL." };

  const logged = await getErpLoggedUser(site, sid);
  if (!logged.ok) return logged;

  const userName = logged.data.email;
  if (!userName || userName === "Guest") {
    return { ok: false, error: "Session expired." };
  }

  try {
    // Desk: /app/user/worldcupteacher%40gmail.com → REST resource User
    const userUrl = `${site}/api/resource/User/${encodeURIComponent(userName)}`;
    const res = await fetch(userUrl, {
      headers: erpHeaders(sid),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      // Fall back to logged-in identity if User read is restricted
      if (res.status === 403 || res.status === 404) {
        return {
          ok: true,
          data: {
            userName,
            email: userName.includes("@") ? userName : `${userName}@erp.local`,
            fullName: userName,
            userPath: `/app/user/${encodeURIComponent(userName)}`,
          },
        };
      }
      return {
        ok: false,
        error:
          res.status >= 500
            ? "ERP unreachable while loading User."
            : `Could not load User (${res.status}).`,
      };
    }

    const json = (await res.json()) as {
      data?: {
        name?: string;
        email?: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
        user_image?: string | null;
      };
    };

    const doc = json.data;
    if (!doc) {
      return { ok: false, error: "User document empty." };
    }

    const email = (doc.email || doc.name || userName).trim();
    const fullName =
      (doc.full_name || [doc.first_name, doc.last_name].filter(Boolean).join(" ") || email).trim();

    return {
      ok: true,
      data: {
        userName: (doc.name || userName).trim(),
        email,
        fullName,
        firstName: doc.first_name || undefined,
        lastName: doc.last_name || undefined,
        userImage: doc.user_image ?? null,
        userPath: `/app/user/${encodeURIComponent(doc.name || userName)}`,
      },
    };
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return { ok: false, error: `ERP at ${site} timed out while loading User.` };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load ERP User profile.",
    };
  }
}

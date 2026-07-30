import type { ErpnextResult } from "@/lib/entities/erpnext.type";
import { normalizeErpnextBaseUrl } from "./erpnext_http.usecase";

export type SchoolTeacherContext = {
  /** Frappe User has Role "Teacher" (case-insensitive). */
  isTeacher: boolean;
  /** Non-empty school_code from General Settings. */
  schoolCode: string | null;
  /**
   * Teacher + school_code → School MCP is wired from embed SID;
   * hide the School ERP login UI.
   */
  autoSchoolMcp: boolean;
  erpRoles: string[];
};

function erpHeaders(sid: string): HeadersInit {
  return {
    Accept: "application/json",
    Cookie: `sid=${sid}`,
  };
}

function pickSchoolCode(doc: Record<string, unknown> | null): string | null {
  if (!doc) return null;
  for (const key of ["school_code", "code", "branch_code", "company_code"]) {
    const value = doc[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function extractRoles(userDoc: Record<string, unknown> | null): string[] {
  const raw = userDoc?.roles;
  if (!Array.isArray(raw)) return [];
  const roles: string[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const role = (row as { role?: unknown }).role;
    if (typeof role === "string" && role.trim()) roles.push(role.trim());
  }
  return roles;
}

/**
 * For school ERP embed SID: Teacher role + General Settings.school_code
 * means School MCP should already be connected in the background.
 */
export async function getSchoolTeacherContext(
  baseUrl: string,
  sid: string,
  userName: string,
): Promise<ErpnextResult<SchoolTeacherContext>> {
  const site = normalizeErpnextBaseUrl(baseUrl);
  if (!site) return { ok: false, error: "Invalid ERPNext base URL." };

  try {
    const [userRes, settingsRes] = await Promise.all([
      fetch(`${site}/api/resource/User/${encodeURIComponent(userName)}`, {
        headers: erpHeaders(sid),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      }),
      fetch(
        `${site}/api/resource/${encodeURIComponent("General Settings")}/${encodeURIComponent("General Settings")}`,
        {
          headers: erpHeaders(sid),
          cache: "no-store",
          signal: AbortSignal.timeout(8_000),
        },
      ),
    ]);

    let userDoc: Record<string, unknown> | null = null;
    if (userRes.ok) {
      const json = (await userRes.json()) as { data?: Record<string, unknown> };
      userDoc = json.data ?? null;
    }

    let settingsDoc: Record<string, unknown> | null = null;
    if (settingsRes.ok) {
      const json = (await settingsRes.json()) as { data?: Record<string, unknown> };
      settingsDoc = json.data ?? null;
    } else if (settingsRes.status === 404) {
      // Some sites use the Single name equal to the doctype only
      const alt = await fetch(
        `${site}/api/resource/${encodeURIComponent("General Settings")}`,
        {
          headers: erpHeaders(sid),
          cache: "no-store",
          signal: AbortSignal.timeout(8_000),
        },
      );
      if (alt.ok) {
        const json = (await alt.json()) as { data?: Record<string, unknown> };
        settingsDoc = json.data ?? null;
      }
    }

    const erpRoles = extractRoles(userDoc);
    const isTeacher = erpRoles.some((r) => r.toLowerCase() === "teacher");
    const schoolCode = pickSchoolCode(settingsDoc);

    return {
      ok: true,
      data: {
        isTeacher,
        schoolCode,
        autoSchoolMcp: isTeacher && Boolean(schoolCode),
        erpRoles,
      },
    };
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return { ok: false, error: `ERP at ${site} timed out while loading school context.` };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load school teacher context.",
    };
  }
}

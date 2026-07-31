export type ErpnextResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ErpnextLoginInput = {
  /** Site origin, e.g. https://example.frappe.cloud */
  baseUrl: string;
  usr: string;
  pwd: string;
};

export type ErpnextLoginOutput = {
  baseUrl: string;
  sid: string;
  fullName?: string;
};

export type ErpnextRequestInput = {
  baseUrl: string;
  sid: string;
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export type ErpnextRequestOutput = {
  status: number;
  data: unknown;
};

export type ErpSession = {
  sid: string;
  fullName: string;
  email: string;
  /** Site origin used for login + MCP `X-ERPNext-URL`. */
  baseUrl: string;
};

export type ErpOtpState = {
  tmp_id: string;
  prompt: string;
  method: string;
  usr: string;
};

export type ErpLoginResponse =
  | { ok: true; data: { sid: string; fullName: string } }
  | { ok: true; data: { needs_otp: true; tmp_id: string; prompt: string; method: string } }
  | { ok: false; error: string };

export type ErpProxyQuery = {
  sid: string;
  doctype: string;
  fields?: string[];
  filters?: unknown[];
  limit?: number;
  orderBy?: string;
};

export type SprintBacklogItem = {
  name: string;
  subject: string;
  status: string;
  sprint_assign: string;
  priority: string;
  type: string;
  module: string;
  current_assignee: string;
  dev_assignee_name: string;
  sprint_points: string;
  exp_end_date: string;
};

/* ── Dashboard ──────────────────────────────────────────── */

export type ErpDashboard = {
  avgHoursPerWeek: number;
  avgTasksPerWeek: number;
  totalTimesheets: number;
  totalTasks: number;
  sprintBacklogs: SprintBacklogItem[];
  loading: boolean;
};

/** School ERP overview (not Livro timesheets / sprint). */
export type SchoolErpOverview = {
  loading: boolean;
  schoolYear: string | null;
  schoolCode: string | null;
  schoolName: string | null;
  studentsBed: number;
  studentsCollege: number;
  teachers: number;
  classes: number;
  /** Extra General / School Settings fields to show. */
  settings: { label: string; value: string }[];
};

/* ── Livro ERPNext (fixed site) ─────────────────────────── */

export const ERP_BASE_URL = process.env.NEXT_PUBLIC_ERP_BASE_URL ?? "";
export const ERP_MCP_URL = process.env.NEXT_PUBLIC_ERP_MCP_URL ?? "";
export const ERP_MCP_SERVER_KEY = process.env.NEXT_PUBLIC_ERP_MCP_SERVER_KEY ?? "erpnext";

/* ── School ERP (dynamic site via X-ERPNext-URL) ─────────── */

export const SCHOOL_ERP_MCP_URL =
  process.env.NEXT_PUBLIC_SCHOOL_ERP_MCP_URL || ERP_MCP_URL;
export const SCHOOL_ERP_MCP_SERVER_KEY =
  process.env.NEXT_PUBLIC_SCHOOL_ERP_MCP_SERVER_KEY ?? "school_erpnext";

/** Sent when school SID exists but no remote MCP URL — custom tools still work. */
export const SCHOOL_ERP_SESSION_PLACEHOLDER_URL = "bbai://school-erp-session";

/** Optional comma-separated school ERP origins for the login URL picker. */
export const SCHOOL_ERP_URL_PRESETS = (process.env.NEXT_PUBLIC_SCHOOL_ERP_URL_PRESETS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export type ErpMcpServerConfig = {
  type: "http";
  url: string;
  headers: Record<string, string>;
};

/** Strip trailing slash; reject non-http(s). */
export function normalizeErpBaseUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** School-site presets for the login URL picker. */
export function listSchoolErpUrlPresets(): string[] {
  const values = SCHOOL_ERP_URL_PRESETS.map((value) => normalizeErpBaseUrl(value)).filter(
    (value): value is string => Boolean(value),
  );
  return [...new Set(values)];
}

function buildMcpConfig(
  sid: string | null,
  baseUrl: string | null | undefined,
  mcpUrl: string,
): ErpMcpServerConfig | null {
  const siteUrl = normalizeErpBaseUrl(baseUrl || "");
  if (!sid || !mcpUrl || !siteUrl) return null;
  return {
    type: "http",
    url: mcpUrl,
    headers: {
      Authorization: `Bearer ${sid}`,
      // Some ERP MCP gateways read Cookie; desk APIs always use sid cookie
      Cookie: `sid=${sid}`,
      "X-ERPNext-URL": siteUrl,
    },
  };
}

/** Livro internal ERPNext MCP — always uses `NEXT_PUBLIC_ERP_BASE_URL`. */
export function buildErpMcpConfig(sid: string | null): ErpMcpServerConfig | null {
  return buildMcpConfig(sid, ERP_BASE_URL, ERP_MCP_URL);
}

/** School ERP MCP — `baseUrl` becomes dynamic `X-ERPNext-URL`. */
export function buildSchoolErpMcpConfig(
  sid: string | null,
  baseUrl: string | null | undefined,
): ErpMcpServerConfig | null {
  // Keep config even without a remote MCP URL so Cursor custom tools can use the SID.
  return buildMcpConfig(
    sid,
    baseUrl,
    SCHOOL_ERP_MCP_URL || SCHOOL_ERP_SESSION_PLACEHOLDER_URL,
  );
}

/** Same SID/baseUrl School MCP custom tools read from `Authorization` + `X-ERPNext-URL`. */
export function extractSchoolErpSessionFromMcpHeaders(
  headers: Record<string, string> | undefined | null,
): { sid: string; baseUrl: string } | null {
  if (!headers) return null;
  const auth = headers.Authorization || headers.authorization || "";
  const sid = auth.replace(/^Bearer\s+/i, "").trim();
  const baseUrl = normalizeErpBaseUrl(
    headers["X-ERPNext-URL"] || headers["x-erpnext-url"] || "",
  );
  if (!sid || !baseUrl) return null;
  return { sid, baseUrl };
}

/**
 * Browser: School MCP session only (never Livro `bbai_erp_sid`).
 * Order: school localStorage keys → school MCP server headers in `bbai_mcp`.
 */
export function readSchoolErpMcpSessionFromBrowser(): {
  sid: string;
  baseUrl: string;
} | null {
  if (typeof window === "undefined") return null;

  const sid =
    localStorage.getItem("bbai_school_erp_sid")?.trim() ||
    sessionStorage.getItem("bbai_school_erp_sid")?.trim() ||
    "";
  const baseUrl = normalizeErpBaseUrl(
    localStorage.getItem("bbai_school_erp_base_url") ||
      sessionStorage.getItem("bbai_school_erp_base_url") ||
      "",
  );
  if (sid && baseUrl) return { sid, baseUrl };

  // Fall back to whatever chat injected as school_erpnext MCP headers
  try {
    const raw = localStorage.getItem("bbai_mcp");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as
      | Record<string, { headers?: Record<string, string> }>
      | { mcpServers?: Record<string, { headers?: Record<string, string> }> };
    const servers =
      "mcpServers" in parsed && parsed.mcpServers ? parsed.mcpServers : parsed;
    const cfg = servers?.[SCHOOL_ERP_MCP_SERVER_KEY];
    return extractSchoolErpSessionFromMcpHeaders(cfg?.headers);
  } catch {
    return null;
  }
}

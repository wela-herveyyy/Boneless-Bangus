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


export const ERP_BASE_URL = process.env.NEXT_PUBLIC_ERP_BASE_URL ?? "";
export const ERP_MCP_URL = process.env.NEXT_PUBLIC_ERP_MCP_URL ?? "";
export const ERP_MCP_SERVER_KEY = process.env.NEXT_PUBLIC_ERP_MCP_SERVER_KEY ?? "erpnext";

export type ErpMcpServerConfig = {
  type: "http";
  url: string;
  headers: Record<string, string>;
};

/**
 * Build the MCP server entry for ERPNext from an active session sid.
 * Returns `null` when sid is falsy or ERP env URLs are missing.
 */
export function buildErpMcpConfig(sid: string | null): ErpMcpServerConfig | null {
  if (!sid || !ERP_MCP_URL || !ERP_BASE_URL) return null;
  return {
    type: "http",
    url: ERP_MCP_URL,
    headers: {
      Authorization: `Bearer ${sid}`,
      "X-ERPNext-URL": ERP_BASE_URL,
    },
  };
}

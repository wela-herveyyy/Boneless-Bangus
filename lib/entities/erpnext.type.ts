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

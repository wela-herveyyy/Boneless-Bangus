"use client";

import { useCallback, useEffect, useState } from "react";
import { useRightSidebar } from "@/components/molecules/RightSidebar/RightSidebar";
import {
  ERP_BASE_URL,
  ERP_MCP_SERVER_KEY,
  SCHOOL_ERP_MCP_SERVER_KEY,
  normalizeErpBaseUrl,
  type ErpSession,
  type ErpOtpState,
  type ErpDashboard,
  type SchoolErpOverview,
  type ErpLoginResponse,
  type SprintBacklogItem,
} from "@/lib/entities/erpnext.type";

export type ErpToolKind = "erpnext" | "school_erpnext";

export type ErpToolStorage = {
  sidKey: string;
  userKey: string;
  emailKey: string;
  baseUrlKey: string;
  eventName: string;
};

export type ErpToolConfig = {
  kind: ErpToolKind;
  sidebarId: string;
  storage: ErpToolStorage;
  /** When set, login always uses this site (no URL picker). */
  fixedBaseUrl: string | null;
  mcpServerKey: string;
};

export const LIVRO_ERP_TOOL: ErpToolConfig = {
  kind: "erpnext",
  sidebarId: "tools",
  storage: {
    sidKey: "bbai_erp_sid",
    userKey: "bbai_erp_user",
    emailKey: "bbai_erp_email",
    baseUrlKey: "bbai_erp_base_url",
    eventName: "bbai-erp-session",
  },
  fixedBaseUrl: normalizeErpBaseUrl(ERP_BASE_URL),
  mcpServerKey: ERP_MCP_SERVER_KEY,
};

export const SCHOOL_ERP_TOOL: ErpToolConfig = {
  kind: "school_erpnext",
  sidebarId: "school-erp",
  storage: {
    sidKey: "bbai_school_erp_sid",
    userKey: "bbai_school_erp_user",
    emailKey: "bbai_school_erp_email",
    baseUrlKey: "bbai_school_erp_base_url",
    eventName: "bbai-school-erp-session",
  },
  fixedBaseUrl: null,
  mcpServerKey: SCHOOL_ERP_MCP_SERVER_KEY,
};

function readStoredSession(config: ErpToolConfig): ErpSession | null {
  if (typeof window === "undefined") return null;
  const sid = localStorage.getItem(config.storage.sidKey)?.trim();
  if (!sid) return null;

  const baseUrl =
    config.fixedBaseUrl ||
    normalizeErpBaseUrl(localStorage.getItem(config.storage.baseUrlKey) ?? "");
  if (!baseUrl) return null;

  return {
    sid,
    fullName: localStorage.getItem(config.storage.userKey)?.trim() || "User",
    email: localStorage.getItem(config.storage.emailKey)?.trim() || "",
    baseUrl,
  };
}

function notifySessionChanged(config: ErpToolConfig) {
  window.dispatchEvent(new Event(config.storage.eventName));
}

/** Persist session; only fires event when values actually change (avoids restore loops). */
function writeStoredSession(
  config: ErpToolConfig,
  session: ErpSession,
  options?: { notify?: boolean },
) {
  const notify = options?.notify !== false;
  const prev = {
    sid: localStorage.getItem(config.storage.sidKey) ?? "",
    fullName: localStorage.getItem(config.storage.userKey) ?? "",
    email: localStorage.getItem(config.storage.emailKey) ?? "",
    baseUrl: localStorage.getItem(config.storage.baseUrlKey) ?? "",
  };
  const changed =
    prev.sid !== session.sid ||
    prev.fullName !== session.fullName ||
    prev.email !== session.email ||
    prev.baseUrl !== session.baseUrl;

  localStorage.setItem(config.storage.sidKey, session.sid);
  localStorage.setItem(config.storage.userKey, session.fullName);
  localStorage.setItem(config.storage.emailKey, session.email);
  localStorage.setItem(config.storage.baseUrlKey, session.baseUrl);

  // Keep embed parent aligned with the active school site so a stale localhost
  // parent from old desk embeds cannot win on the next refresh.
  if (config.kind === "school_erpnext" && session.baseUrl) {
    try {
      localStorage.setItem("bbai_erp_embed_parent", session.baseUrl);
      sessionStorage.setItem("bbai_erp_embed_parent", session.baseUrl);
    } catch {
      /* ignore */
    }
    // Bind School MCP SID into Output mini-browser cookie (same session as MCP tools).
    void fetch("/api/erp/output/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sid: session.sid, baseUrl: session.baseUrl }),
    }).catch(() => {
      /* ignore */
    });
  }

  if (notify && changed) notifySessionChanged(config);
  return changed;
}

function clearStoredSession(config: ErpToolConfig) {
  const hadSid = Boolean(localStorage.getItem(config.storage.sidKey));
  localStorage.removeItem(config.storage.sidKey);
  localStorage.removeItem(config.storage.userKey);
  localStorage.removeItem(config.storage.emailKey);
  localStorage.removeItem(config.storage.baseUrlKey);
  if (hadSid) notifySessionChanged(config);
}

type SidCheck =
  | { status: "valid"; email: string }
  | { status: "expired" }
  | { status: "unknown" };

async function readErpLoginJson(res: Response): Promise<ErpLoginResponse | null> {
  const text = await res.text();
  if (!text || text.trimStart().startsWith("<")) return null;
  try {
    return JSON.parse(text) as ErpLoginResponse;
  } catch {
    return null;
  }
}

async function validateErpSid(sid: string, baseUrl: string): Promise<SidCheck> {
  try {
    const res = await fetch("/api/erp/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sid, baseUrl }),
    });
    const json = (await res.json()) as {
      ok: boolean;
      error?: string;
      data?: { email: string };
    };
    if (json.ok && json.data?.email) {
      return { status: "valid", email: json.data.email };
    }
    if (json.error === "Session expired.") {
      return { status: "expired" };
    }
    return { status: "unknown" };
  } catch {
    return { status: "unknown" };
  }
}

async function erpQuery<T = Record<string, unknown>>(
  sid: string,
  baseUrl: string,
  doctype: string,
  options?: { fields?: string[]; filters?: unknown[]; limit?: number; orderBy?: string },
): Promise<T[]> {
  const res = await fetch("/api/erp/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sid, baseUrl, doctype, action: "list", ...options }),
  });
  const json = (await res.json()) as { ok: boolean; data?: T[]; error?: string };
  return json.ok ? (json.data ?? []) : [];
}

async function erpCount(
  sid: string,
  baseUrl: string,
  doctype: string,
  filters?: unknown,
): Promise<number> {
  try {
    const res = await fetch("/api/erp/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sid, baseUrl, doctype, action: "count", filters: filters ?? [] }),
    });
    const json = (await res.json()) as { ok: boolean; data?: number };
    return json.ok && typeof json.data === "number" ? json.data : 0;
  } catch {
    return 0;
  }
}

async function erpGet(
  sid: string,
  baseUrl: string,
  doctype: string,
  name?: string,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("/api/erp/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sid, baseUrl, doctype, action: "get", name }),
    });
    const json = (await res.json()) as { ok: boolean; data?: Record<string, unknown> | null };
    return json.ok && json.data && typeof json.data === "object" ? json.data : null;
  } catch {
    return null;
  }
}

const EMPTY_SCHOOL_OVERVIEW: SchoolErpOverview = {
  loading: false,
  schoolYear: null,
  schoolCode: null,
  schoolName: null,
  studentsBed: 0,
  studentsCollege: 0,
  teachers: 0,
  classes: 0,
  settings: [],
};

function pickSetting(
  doc: Record<string, unknown> | null,
  keys: string[],
): string | null {
  if (!doc) return null;
  for (const key of keys) {
    const value = doc[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

function settingsFromDoc(
  doc: Record<string, unknown> | null,
  labels: { key: string; label: string }[],
): { label: string; value: string }[] {
  if (!doc) return [];
  const rows: { label: string; value: string }[] = [];
  for (const { key, label } of labels) {
    const raw = doc[key];
    if (raw === null || raw === undefined || raw === "") continue;
    const value = typeof raw === "string" || typeof raw === "number" ? String(raw) : null;
    if (!value) continue;
    rows.push({ label, value });
  }
  return rows;
}

function weeksSpanned(rows: { start_date?: string; creation?: string }[]): number {
  if (rows.length === 0) return 1;
  const dates = rows
    .map((r) => new Date(r.start_date ?? r.creation ?? "").getTime())
    .filter((t) => !isNaN(t));
  if (dates.length === 0) return 1;
  const range = Math.max(...dates) - Math.min(...dates);
  return Math.max(1, Math.round(range / (7 * 24 * 60 * 60 * 1000)) || 1);
}

export function useErpLogin(config: ErpToolConfig) {
  const [erpSession, setErpSession] = useState<ErpSession | null>(null);
  const [sessionRestoring, setSessionRestoring] = useState(false);
  const [otpState, setOtpState] = useState<ErpOtpState | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<ErpDashboard>({
    avgHoursPerWeek: 0,
    avgTasksPerWeek: 0,
    totalTimesheets: 0,
    totalTasks: 0,
    sprintBacklogs: [],
    loading: false,
  });
  const [schoolOverview, setSchoolOverview] = useState<SchoolErpOverview>(EMPTY_SCHOOL_OVERVIEW);

  const fetchLivroDashboard = useCallback(async (sid: string, email: string, baseUrl: string) => {
    setDashboard((d) => ({ ...d, loading: true }));

    try {
      const [timesheets, tasks, backlogs] = await Promise.all([
        erpQuery<{ name: string; total_hours: number; start_date: string }>(sid, baseUrl, "Timesheet", {
          fields: ["name", "total_hours", "start_date"],
          filters: [["docstatus", "=", 1]],
          limit: 200,
          orderBy: "start_date desc",
        }),
        erpQuery<{ name: string; status: string; creation: string }>(sid, baseUrl, "Task", {
          fields: ["name", "status", "creation"],
          filters: [["status", "=", "Completed"]],
          limit: 200,
          orderBy: "creation desc",
        }),
        erpQuery<SprintBacklogItem>(sid, baseUrl, "Sprint Backlogs", {
          fields: [
            "name", "subject", "status", "sprint_assign", "priority",
            "type", "module", "current_assignee", "dev_assignee_name",
            "sprint_points", "exp_end_date",
          ],
          filters: email ? [["current_assignee", "=", email]] : [],
          limit: 50,
          orderBy: "creation desc",
        }),
      ]);

      const totalHours = timesheets.reduce((s, t) => s + (t.total_hours || 0), 0);
      const tsWeeks = weeksSpanned(timesheets);
      const taskWeeks = weeksSpanned(tasks);

      setDashboard({
        avgHoursPerWeek: Math.round((totalHours / tsWeeks) * 10) / 10,
        avgTasksPerWeek: Math.round((tasks.length / taskWeeks) * 10) / 10,
        totalTimesheets: timesheets.length,
        totalTasks: tasks.length,
        sprintBacklogs: backlogs,
        loading: false,
      });
    } catch {
      setDashboard((d) => ({ ...d, loading: false }));
    }
  }, []);

  const fetchSchoolOverview = useCallback(async (sid: string, baseUrl: string) => {
    setSchoolOverview((prev) => ({ ...prev, loading: true }));

    try {
      const schoolYears = await erpQuery<{ name: string; year?: string; is_current?: number }>(
        sid,
        baseUrl,
        "School Year",
        {
          fields: ["name", "year", "is_current"],
          filters: [["is_current", "=", 1]],
          limit: 1,
        },
      );
      let schoolYear =
        schoolYears[0]?.name ||
        schoolYears[0]?.year ||
        null;

      if (!schoolYear) {
        const anyYear = await erpQuery<{ name: string; year?: string }>(sid, baseUrl, "School Year", {
          fields: ["name", "year"],
          limit: 1,
          orderBy: "modified desc",
        });
        schoolYear = anyYear[0]?.name || anyYear[0]?.year || null;
      }

      const yearFilters = schoolYear ? [["school_year", "=", schoolYear]] : [];
      const enrolledFilters = schoolYear
        ? [
            ["school_year", "=", schoolYear],
            ["officially_enrolled", "=", "Yes"],
          ]
        : [["officially_enrolled", "=", "Yes"]];

      const [
        studentsBed,
        studentsCollege,
        teachersBed,
        teachersCollege,
        classesBed,
        classesCollege,
        schoolSettings,
        generalSettings,
      ] = await Promise.all([
        erpCount(sid, baseUrl, "Enrollees", enrolledFilters),
        erpCount(sid, baseUrl, "College Enrollees", enrolledFilters),
        erpCount(sid, baseUrl, "Teacher", yearFilters),
        erpCount(sid, baseUrl, "College Faculty", []),
        erpCount(sid, baseUrl, "Class", yearFilters),
        erpCount(sid, baseUrl, "College Classes", yearFilters),
        erpGet(sid, baseUrl, "School Settings"),
        erpGet(sid, baseUrl, "General Settings"),
      ]);

      const settingsDoc = schoolSettings || generalSettings;
      const schoolCode = pickSetting(settingsDoc, [
        "school_code",
        "code",
        "branch_code",
        "company_code",
      ]);
      const schoolName = pickSetting(settingsDoc, [
        "school_name",
        "school",
        "company",
        "branch_name",
        "name",
      ]);

      const settings = settingsFromDoc(settingsDoc, [
        { key: "school_year", label: "School year" },
        { key: "current_school_year", label: "Current school year" },
        { key: "school_code", label: "School code" },
        { key: "code", label: "Code" },
        { key: "school_name", label: "School name" },
        { key: "region", label: "Region" },
        { key: "division", label: "Division" },
        { key: "district", label: "District" },
        { key: "address", label: "Address" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "website", label: "Website" },
      ]);

      if (schoolYear && !settings.some((row) => row.label === "School year")) {
        settings.unshift({ label: "School year", value: schoolYear });
      }
      if (schoolCode && !settings.some((row) => row.label.toLowerCase().includes("code"))) {
        settings.unshift({ label: "School code", value: schoolCode });
      }

      setSchoolOverview({
        loading: false,
        schoolYear,
        schoolCode,
        schoolName,
        studentsBed,
        studentsCollege,
        teachers: teachersBed + teachersCollege,
        classes: classesBed + classesCollege,
        settings,
      });
    } catch {
      setSchoolOverview((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const fetchDashboard = useCallback(
    async (sid: string, email: string, baseUrl: string) => {
      if (config.kind === "school_erpnext") {
        await fetchSchoolOverview(sid, baseUrl);
        return;
      }
      await fetchLivroDashboard(sid, email, baseUrl);
    },
    [config.kind, fetchLivroDashboard, fetchSchoolOverview],
  );

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let lastFetchedSid: string | null = null;

    const restore = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        const stored = readStoredSession(config);
        if (!stored) {
          if (!cancelled) {
            setErpSession(null);
            setSessionRestoring(false);
          }
          lastFetchedSid = null;
          return;
        }

        if (!cancelled) {
          setSessionRestoring(true);
          setErpSession(stored);
        }

        let check = await validateErpSid(stored.sid, stored.baseUrl);
        if (check.status === "unknown") {
          await new Promise((r) => setTimeout(r, 400));
          if (cancelled) return;
          check = await validateErpSid(stored.sid, stored.baseUrl);
        }
        if (cancelled) return;

        if (check.status === "expired") {
          clearStoredSession(config);
          setErpSession(null);
          setSessionRestoring(false);
          lastFetchedSid = null;
          return;
        }

        if (check.status === "valid") {
          const session: ErpSession = {
            sid: stored.sid,
            fullName: stored.fullName || check.email,
            email: stored.email || check.email,
            baseUrl: stored.baseUrl,
          };
          // Silent write — notifying here re-enters restore forever
          writeStoredSession(config, session, { notify: false });
          setErpSession(session);
          setSessionRestoring(false);
          if (lastFetchedSid !== session.sid) {
            lastFetchedSid = session.sid;
            void fetchDashboard(session.sid, session.email, session.baseUrl);
          }
          return;
        }

        // Unknown / proxy glitch — still use stored SID for MCP (embed desk session)
        setErpSession(stored);
        setSessionRestoring(false);
        if (lastFetchedSid !== stored.sid) {
          lastFetchedSid = stored.sid;
          void fetchDashboard(stored.sid, stored.email, stored.baseUrl);
        }
      } finally {
        inFlight = false;
      }
    };

    void restore();

    // Embed /sign-in may write SID after this hook mounts
    const onSession = () => {
      void restore();
    };
    window.addEventListener(config.storage.eventName, onSession);

    return () => {
      cancelled = true;
      window.removeEventListener(config.storage.eventName, onSession);
    };
  }, [config, fetchDashboard]);

  const saveSession = useCallback(
    (session: ErpSession) => {
      writeStoredSession(config, session);
      setErpSession(session);
      void fetchDashboard(session.sid, session.email, session.baseUrl);
    },
    [config, fetchDashboard],
  );

  const loginErp = useCallback(
    async (usr: string, pwd: string, baseUrl?: string) => {
      setLoginLoading(true);
      setLoginError(null);

      const siteUrl =
        config.fixedBaseUrl || normalizeErpBaseUrl(baseUrl ?? "");
      if (!siteUrl) {
        setLoginError("Invalid ERP URL.");
        setLoginLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/erp/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ usr, pwd, baseUrl: siteUrl }),
        });

        const json = await readErpLoginJson(res);
        if (!json) {
          setLoginError(
            res.status === 401
              ? "Sign in to BBAI first, then connect School ERP."
              : `School login failed (HTTP ${res.status}).`,
          );
          return;
        }

        if (!json.ok) {
          setLoginError(json.error);
          return;
        }

        if ("needs_otp" in json.data) {
          setOtpState({
            tmp_id: json.data.tmp_id,
            prompt: json.data.prompt,
            method: json.data.method,
            usr,
          });
          localStorage.setItem(config.storage.baseUrlKey, siteUrl);
          return;
        }

        saveSession({
          sid: json.data.sid,
          fullName: json.data.fullName,
          email: usr,
          baseUrl: siteUrl,
        });
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : "Login failed.");
      } finally {
        setLoginLoading(false);
      }
    },
    [config, saveSession],
  );

  const verifyOtp = useCallback(
    async (otp: string) => {
      if (!otpState) return;
      setLoginLoading(true);
      setLoginError(null);

      const siteUrl =
        config.fixedBaseUrl ||
        normalizeErpBaseUrl(localStorage.getItem(config.storage.baseUrlKey) ?? "");
      if (!siteUrl) {
        setLoginError("Invalid ERP URL.");
        setLoginLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/erp/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tmp_id: otpState.tmp_id,
            otp,
            usr: otpState.usr,
            baseUrl: siteUrl,
          }),
        });

        const json = await readErpLoginJson(res);
        if (!json) {
          setLoginError(
            res.status === 401
              ? "Sign in to BBAI first, then connect School ERP."
              : `School login failed (HTTP ${res.status}).`,
          );
          return;
        }

        if (!json.ok) {
          setLoginError(json.error);
          return;
        }

        if ("sid" in json.data) {
          saveSession({
            sid: json.data.sid,
            fullName: json.data.fullName,
            email: otpState.usr,
            baseUrl: siteUrl,
          });
          setOtpState(null);
        }
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : "Verification failed.");
      } finally {
        setLoginLoading(false);
      }
    },
    [config, otpState, saveSession],
  );

  const cancelOtp = useCallback(() => {
    setOtpState(null);
    setLoginError(null);
  }, []);

  const logoutErp = useCallback(() => {
    clearStoredSession(config);
    setErpSession(null);
    setOtpState(null);
    setLoginError(null);
    setDashboard({
      avgHoursPerWeek: 0,
      avgTasksPerWeek: 0,
      totalTimesheets: 0,
      totalTasks: 0,
      sprintBacklogs: [],
      loading: false,
    });
    setSchoolOverview(EMPTY_SCHOOL_OVERVIEW);
  }, [config]);

  return {
    erpSession,
    sessionRestoring,
    otpState,
    loginErp,
    verifyOtp,
    cancelOtp,
    logoutErp,
    loginLoading,
    loginError,
    dashboard,
    schoolOverview,
    refreshDashboard: () =>
      erpSession && fetchDashboard(erpSession.sid, erpSession.email, erpSession.baseUrl),
  };
}

export function useToolsSidebar() {
  return useRightSidebar("tools", { bodyClass: "bbai-livro-sidebar-open" });
}

export function useSchoolErpSidebar() {
  return useRightSidebar("school-erp", { bodyClass: "bbai-school-erp-sidebar-open" });
}

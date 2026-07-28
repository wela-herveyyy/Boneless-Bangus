"use client";

import { useCallback, useEffect, useState } from "react";
import { useRightSidebar } from "@/components/molecules/RightSidebar/RightSidebar";
import type {
  ErpSession,
  ErpOtpState,
  ErpDashboard,
  ErpLoginResponse,
  SprintBacklogItem,
} from "@/lib/entities/erpnext.type";

const ERP_SID_KEY = "bbai_erp_sid";
const ERP_USER_KEY = "bbai_erp_user";
const ERP_EMAIL_KEY = "bbai_erp_email";

function readStoredSession(): ErpSession | null {
  if (typeof window === "undefined") return null;
  const sid = localStorage.getItem(ERP_SID_KEY)?.trim();
  if (!sid) return null;
  return {
    sid,
    fullName: localStorage.getItem(ERP_USER_KEY)?.trim() || "User",
    email: localStorage.getItem(ERP_EMAIL_KEY)?.trim() || "",
  };
}

function writeStoredSession(session: ErpSession) {
  localStorage.setItem(ERP_SID_KEY, session.sid);
  localStorage.setItem(ERP_USER_KEY, session.fullName);
  localStorage.setItem(ERP_EMAIL_KEY, session.email);
}

function clearStoredSession() {
  localStorage.removeItem(ERP_SID_KEY);
  localStorage.removeItem(ERP_USER_KEY);
  localStorage.removeItem(ERP_EMAIL_KEY);
}

type SidCheck =
  | { status: "valid"; email: string }
  | { status: "expired" }
  | { status: "unknown" }; // BBAI not ready / network — keep stored sid

async function validateErpSid(sid: string): Promise<SidCheck> {
  try {
    const res = await fetch("/api/erp/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sid }),
    });
    const json = (await res.json()) as {
      ok: boolean;
      error?: string;
      data?: { email: string };
    };
    if (json.ok && json.data?.email) {
      return { status: "valid", email: json.data.email };
    }
    // Only wipe when ERP explicitly says Guest / bad sid
    if (json.error === "Session expired.") {
      return { status: "expired" };
    }
    // BBAI auth not ready, no permission yet, ERP blip, 5xx — keep SID
    return { status: "unknown" };
  } catch {
    return { status: "unknown" };
  }
}

async function erpQuery<T = Record<string, unknown>>(
  sid: string,
  doctype: string,
  options?: { fields?: string[]; filters?: unknown[]; limit?: number; orderBy?: string },
): Promise<T[]> {
  const res = await fetch("/api/erp/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sid, doctype, ...options }),
  });
  const json = (await res.json()) as { ok: boolean; data?: T[]; error?: string };
  return json.ok ? (json.data ?? []) : [];
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

export function useErpLogin() {
  // Server + first client paint must match — restore SID only in useEffect
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

  const fetchDashboard = useCallback(async (sid: string, email: string) => {
    setDashboard((d) => ({ ...d, loading: true }));

    try {
      const [timesheets, tasks, backlogs] = await Promise.all([
        erpQuery<{ name: string; total_hours: number; start_date: string }>(sid, "Timesheet", {
          fields: ["name", "total_hours", "start_date"],
          filters: [["docstatus", "=", 1]],
          limit: 200,
          orderBy: "start_date desc",
        }),
        erpQuery<{ name: string; status: string; creation: string }>(sid, "Task", {
          fields: ["name", "status", "creation"],
          filters: [["status", "=", "Completed"]],
          limit: 200,
          orderBy: "creation desc",
        }),
        erpQuery<SprintBacklogItem>(sid, "Sprint Backlogs", {
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

  // Auto-connect from localStorage SID after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = readStoredSession();
      if (!stored) {
        if (!cancelled) setSessionRestoring(false);
        return;
      }

      if (!cancelled) {
        setSessionRestoring(true);
        setErpSession(stored);
      }

      let check = await validateErpSid(stored.sid);
      // Retry once if BBAI auth wasn't ready
      if (check.status === "unknown") {
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;
        check = await validateErpSid(stored.sid);
      }
      if (cancelled) return;

      if (check.status === "expired") {
        // Real Guest / dead sid from ERP — only then force re-login
        clearStoredSession();
        setErpSession(null);
        setSessionRestoring(false);
        return;
      }

      if (check.status === "valid") {
        const session: ErpSession = {
          sid: stored.sid,
          fullName: stored.fullName || check.email,
          email: stored.email || check.email,
        };
        writeStoredSession(session);
        setErpSession(session);
        setSessionRestoring(false);
        void fetchDashboard(session.sid, session.email);
        return;
      }

      // unknown (ERP blip / BBAI not ready): keep stored session, still load dashboard
      setErpSession(stored);
      setSessionRestoring(false);
      void fetchDashboard(stored.sid, stored.email);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchDashboard]);

  const saveSession = useCallback(
    (session: ErpSession) => {
      writeStoredSession(session);
      setErpSession(session);
      void fetchDashboard(session.sid, session.email);
    },
    [fetchDashboard],
  );

  const loginErp = useCallback(async (usr: string, pwd: string) => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/erp/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usr, pwd }),
      });

      const json = (await res.json()) as ErpLoginResponse;

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
        return;
      }

      saveSession({ sid: json.data.sid, fullName: json.data.fullName, email: usr });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  }, [saveSession]);

  const verifyOtp = useCallback(
    async (otp: string) => {
      if (!otpState) return;
      setLoginLoading(true);
      setLoginError(null);

      try {
        const res = await fetch("/api/erp/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmp_id: otpState.tmp_id, otp, usr: otpState.usr }),
        });

        const json = (await res.json()) as ErpLoginResponse;

        if (!json.ok) {
          setLoginError(json.error);
          return;
        }

        if ("sid" in json.data) {
          saveSession({ sid: json.data.sid, fullName: json.data.fullName, email: otpState.usr });
          setOtpState(null);
        }
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : "Verification failed.");
      } finally {
        setLoginLoading(false);
      }
    },
    [otpState, saveSession],
  );

  const cancelOtp = useCallback(() => {
    setOtpState(null);
    setLoginError(null);
  }, []);

  const logoutErp = useCallback(() => {
    clearStoredSession();
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
  }, []);

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
    refreshDashboard: () => erpSession && fetchDashboard(erpSession.sid, erpSession.email),
  };
}

export function useToolsSidebar() {
  return useRightSidebar("tools");
}

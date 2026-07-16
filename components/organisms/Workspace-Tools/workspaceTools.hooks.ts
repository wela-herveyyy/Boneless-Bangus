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
  const [erpSession, setErpSession] = useState<ErpSession | null>(null);
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
          filters: [["current_assignee", "=", email]],
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

  useEffect(() => {
    const sid = localStorage.getItem(ERP_SID_KEY);
    const user = localStorage.getItem(ERP_USER_KEY);
    const email = localStorage.getItem(ERP_EMAIL_KEY);
    if (sid && user && email) {
      setErpSession({ sid, fullName: user, email });
      void fetchDashboard(sid, email);
    }
  }, [fetchDashboard]);

  const saveSession = useCallback(
    (session: ErpSession) => {
      localStorage.setItem(ERP_SID_KEY, session.sid);
      localStorage.setItem(ERP_USER_KEY, session.fullName);
      localStorage.setItem(ERP_EMAIL_KEY, session.email);
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
    localStorage.removeItem(ERP_SID_KEY);
    localStorage.removeItem(ERP_USER_KEY);
    localStorage.removeItem(ERP_EMAIL_KEY);
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

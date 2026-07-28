"use client";

import { useState } from "react";
import {
  LuFingerprint,
  LuLogIn,
  LuLogOut,
  LuArrowLeft,
  LuShieldCheck,
  LuClock,
  LuCircleCheck,
  LuRefreshCw,
} from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { useToolsSidebar, useErpLogin } from "./workspaceTools.hooks";
import type {
  ErpDashboard,
  ErpOtpState,
  SprintBacklogItem,
} from "@/lib/entities/erpnext.type";

/* ── Login form ─────────────────────────────────────────── */

function ErpLoginForm({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (usr: string, pwd: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(usr, pwd);
      }}
    >
      <div className="space-y-1.5">
        <label htmlFor="erp-usr" className="block text-xs font-medium text-on-surface-muted">
          Email
        </label>
        <Input
          id="erp-usr"
          type="email"
          placeholder="you@livro.systems"
          value={usr}
          onChange={(e) => setUsr(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="erp-pwd" className="block text-xs font-medium text-on-surface-muted">
          Password
        </label>
        <Input
          id="erp-pwd"
          type="password"
          placeholder="••••••••"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
        />
      </div>
      {error ? (
        <p className="text-xs text-secondary" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading || !usr || !pwd} className="w-full gap-2">
        <LuLogIn className="size-4" aria-hidden />
        {loading ? "Logging in…" : "Login to ERPNext"}
      </Button>
    </form>
  );
}

/* ── OTP form ───────────────────────────────────────────── */

function ErpOtpForm({
  otpState,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  otpState: ErpOtpState;
  onSubmit: (otp: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [otp, setOtp] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(otp);
      }}
    >
      <div className="rounded-xl bg-surface-container-high/80 p-3">
        <div className="mb-1 flex items-center gap-2">
          <LuShieldCheck className="size-4 text-primary" aria-hidden />
          <p className="text-xs font-semibold text-on-surface">Verification required</p>
        </div>
        <p className="text-xs leading-relaxed text-on-surface-muted">{otpState.prompt}</p>
        <p className="mt-1 text-[10px] text-on-surface-muted">
          Method: {otpState.method} · {otpState.usr}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="erp-otp" className="block text-xs font-medium text-on-surface-muted">
          Verification code
        </label>
        <Input
          id="erp-otp"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          disabled={loading}
          autoComplete="one-time-code"
          autoFocus
        />
      </div>

      {error ? (
        <p className="text-xs text-secondary" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={loading || !otp.trim()} className="w-full gap-2">
        <LuShieldCheck className="size-4" aria-hidden />
        {loading ? "Verifying…" : "Verify"}
      </Button>

      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs text-on-surface-muted transition-colors hover:text-on-surface disabled:opacity-50"
      >
        <LuArrowLeft className="size-3" aria-hidden />
        Back to password
      </button>
    </form>
  );
}

/* ── Stat card ──────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-container-high/60 px-3.5 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-tight text-on-surface">{value}</p>
        <p className="text-[11px] text-on-surface-muted">{label}</p>
        {sub ? <p className="text-[10px] text-on-surface-muted/70">{sub}</p> : null}
      </div>
    </div>
  );
}

/* ── Sprint backlog list ────────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  Open: "bg-blue-500",
  "In Progress": "bg-amber-500",
  Completed: "bg-emerald-500",
  Closed: "bg-emerald-500",
  Cancelled: "bg-red-400",
};

const TYPE_BADGE: Record<string, string> = {
  "Feature Request": "bg-blue-100 text-blue-700",
  Bug: "bg-red-100 text-red-700",
  Enhancement: "bg-violet-100 text-violet-700",
};

function SprintBacklogList({ items }: { items: SprintBacklogItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-on-surface-muted">No sprint backlogs found.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.name}
          className="rounded-xl bg-surface-container-high/60 px-3.5 py-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-xs font-medium leading-snug text-on-surface">
              {item.subject || item.name}
            </p>
            <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-on-surface-muted">
              <span
                className={[
                  "size-1.5 rounded-full",
                  STATUS_COLOR[item.status] ?? "bg-on-surface-muted/40",
                ].join(" ")}
              />
              {item.status}
            </span>
          </div>

          <p className="mt-0.5 font-mono text-[10px] text-on-surface-muted/70">{item.name}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {item.type ? (
              <span className={["rounded-md px-1.5 py-0.5 text-[10px] font-medium", TYPE_BADGE[item.type] ?? "bg-surface-container-highest text-on-surface-muted"].join(" ")}>
                {item.type}
              </span>
            ) : null}
            {item.priority ? (
              <span className="rounded-md bg-surface-container-highest px-1.5 py-0.5 text-[10px] text-on-surface-muted">
                {item.priority}
              </span>
            ) : null}
            {item.sprint_points ? (
              <span className="rounded-md bg-surface-container-highest px-1.5 py-0.5 text-[10px] text-on-surface-muted">
                {item.sprint_points} pt
              </span>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-on-surface-muted/70">
            {item.sprint_assign ? <span>{item.sprint_assign}</span> : null}
            {item.module ? <span>{item.module}</span> : null}
            {item.exp_end_date ? <span>Due {item.exp_end_date}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Dashboard (post-login) ─────────────────────────────── */

function ErpDashboardView({
  dashboard,
  onRefresh,
  onLogout,
}: {
  dashboard: ErpDashboard;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="space-y-2">
        <StatCard
          icon={<LuClock className="size-4" />}
          label="Avg hours / week"
          value={dashboard.loading ? "…" : String(dashboard.avgHoursPerWeek)}
          sub={`${dashboard.totalTimesheets} timesheets`}
        />
        <StatCard
          icon={<LuCircleCheck className="size-4" />}
          label="Avg tasks / week"
          value={dashboard.loading ? "…" : String(dashboard.avgTasksPerWeek)}
          sub={`${dashboard.totalTasks} completed`}
        />
      </div>

      {/* Sprint backlogs */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
          Sprint Backlogs
        </p>
        {dashboard.loading ? (
          <div className="space-y-2">
            <div className="h-10 animate-pulse rounded-xl bg-surface-container-high/60" />
            <div className="h-10 animate-pulse rounded-xl bg-surface-container-high/60" />
            <div className="h-10 animate-pulse rounded-xl bg-surface-container-high/60" />
          </div>
        ) : (
          <SprintBacklogList items={dashboard.sprintBacklogs} />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 gap-1.5"
          onClick={onRefresh}
          disabled={dashboard.loading}
        >
          <LuRefreshCw className={["size-3.5", dashboard.loading ? "animate-spin" : ""].join(" ")} aria-hidden />
          Refresh
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={onLogout}
        >
          <LuLogOut className="size-3.5" aria-hidden />
          Logout
        </Button>
      </div>
    </div>
  );
}

/* ── Main sidebar ───────────────────────────────────────── */

export function WorkspaceToolsSidebar({ topOffset }: { topOffset?: string } = {}) {
  const sidebar = useToolsSidebar();
  const erp = useErpLogin();

  return (
    <>
      <RightSidebarTrigger
        sidebar={sidebar}
        icon={<LuFingerprint className="size-6" aria-hidden />}
        labelOpen="Hide ERPNext tools"
        labelClosed="Show ERPNext tools"
        topOffset={topOffset}
      />

      <RightSidebarBackdrop sidebar={sidebar} />

      <RightSidebarPanel sidebar={sidebar}>
        <RightSidebarHeader
          sidebar={sidebar}
          subtitle={
            <span className="flex items-center gap-1.5">
              <span
                className={[
                  "size-2 shrink-0 rounded-full",
                  erp.erpSession ? "bg-emerald-500" : "bg-on-surface-muted/40",
                ].join(" ")}
              />
              ERPNext
            </span>
          }
          title="Tools"
          closeLabel="Close tools"
        />

        <RightSidebarContent>
          {erp.sessionRestoring ? (
            <p className="text-xs text-on-surface-muted">Reconnecting ERPNext…</p>
          ) : erp.erpSession ? (
            <ErpDashboardView
              dashboard={erp.dashboard}
              onRefresh={erp.refreshDashboard}
              onLogout={erp.logoutErp}
            />
          ) : erp.otpState ? (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-on-surface-muted">
                Complete verification to continue.
              </p>
              <ErpOtpForm
                otpState={erp.otpState}
                onSubmit={erp.verifyOtp}
                onCancel={erp.cancelOtp}
                loading={erp.loginLoading}
                error={erp.loginError}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-on-surface-muted">
                Login to view timesheet hours, tasks, and sprint backlogs.
              </p>
              <ErpLoginForm
                onSubmit={erp.loginErp}
                loading={erp.loginLoading}
                error={erp.loginError}
              />
            </div>
          )}
        </RightSidebarContent>
      </RightSidebarPanel>
    </>
  );
}

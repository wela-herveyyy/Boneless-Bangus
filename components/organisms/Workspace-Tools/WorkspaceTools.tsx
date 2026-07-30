"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LuSchool,
  LuLogIn,
  LuLogOut,
  LuArrowLeft,
  LuShieldCheck,
  LuClock,
  LuCircleCheck,
  LuRefreshCw,
  LuChevronDown,
  LuUsers,
  LuGraduationCap,
  LuBookOpen,
  LuInfo,
} from "react-icons/lu";
import { SiErpnext } from "react-icons/si";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  RightSidebarTrigger,
  RightSidebarBackdrop,
  RightSidebarPanel,
  RightSidebarHeader,
  RightSidebarContent,
} from "@/components/molecules/RightSidebar/RightSidebar";
import { SidebarLoading } from "@/components/molecules/SidebarLoading/SidebarLoading";
import {
  LIVRO_ERP_TOOL,
  SCHOOL_ERP_TOOL,
  useErpLogin,
  useSchoolErpSidebar,
  useToolsSidebar,
  type ErpToolConfig,
} from "./workspaceTools.hooks";
import {
  listSchoolErpUrlPresets,
  type ErpDashboard,
  type SchoolErpOverview,
  type ErpOtpState,
  type SprintBacklogItem,
} from "@/lib/entities/erpnext.type";
import {
  isLivroParent,
  persistEmbedParent,
  persistEmbedSidClient,
  persistSchoolMcpAuto,
  readEmbedParamsFromWindow,
  resolveSchoolEmbedParent,
} from "@/lib/utils/erp-embed";

/* ── Login form ─────────────────────────────────────────── */

function ErpLoginForm({
  onSubmit,
  loading,
  error,
  showUrlField,
  emailPlaceholder = "you@livro.systems",
  submitLabel = "Login to ERPNext",
}: {
  onSubmit: (usr: string, pwd: string, baseUrl?: string) => void;
  loading: boolean;
  error: string | null;
  showUrlField?: boolean;
  emailPlaceholder?: string;
  submitLabel?: string;
}) {
  const presets = listSchoolErpUrlPresets();
  const [baseUrl, setBaseUrl] = useState(() => presets[0] ?? "");
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [presetsOpen, setPresetsOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!presetsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!presetRef.current?.contains(event.target as Node)) setPresetsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [presetsOpen]);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(usr, pwd, showUrlField ? baseUrl : undefined);
      }}
    >
      {showUrlField ? (
        <div className="space-y-1.5">
          <label htmlFor="school-erp-url" className="block text-xs font-medium text-on-surface-muted">
            School ERP URL
          </label>
          <div ref={presetRef} className="relative flex gap-1.5">
            <Input
              id="school-erp-url"
              type="url"
              placeholder="https://school.example.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
              disabled={loading}
              autoComplete="url"
              className="min-w-0 flex-1"
            />
            {presets.length > 0 ? (
              <>
                <button
                  type="button"
                  disabled={loading}
                  aria-label="Choose school ERP URL preset"
                  aria-haspopup="listbox"
                  aria-expanded={presetsOpen}
                  onClick={() => setPresetsOpen((open) => !open)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50"
                >
                  <LuChevronDown
                    className={["size-4 transition-transform", presetsOpen ? "rotate-180" : ""].join(" ")}
                    aria-hidden
                  />
                </button>
                {presetsOpen ? (
                  <ul
                    role="listbox"
                    aria-label="School ERP URL presets"
                    className="absolute right-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl bg-surface-container-lowest py-1 shadow-bloom bbai-scroll"
                  >
                    {presets.map((preset) => (
                      <li key={preset} role="option" aria-selected={preset === baseUrl}>
                        <button
                          type="button"
                          className={[
                            "w-full truncate px-3 py-2 text-left text-xs transition-colors",
                            preset === baseUrl
                              ? "bg-primary/8 font-medium text-primary"
                              : "text-on-surface hover:bg-surface-container-low",
                          ].join(" ")}
                          onClick={() => {
                            setBaseUrl(preset);
                            setPresetsOpen(false);
                          }}
                        >
                          {preset}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="space-y-1.5">
        <label htmlFor="erp-usr" className="block text-xs font-medium text-on-surface-muted">
          Username / email
        </label>
        <Input
          id="erp-usr"
          type="text"
          placeholder={emailPlaceholder}
          value={usr}
          onChange={(e) => setUsr(e.target.value)}
          required
          disabled={loading}
          autoComplete="username"
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
      <Button
        type="submit"
        disabled={loading || !usr || !pwd || (showUrlField && !baseUrl)}
        className="w-full gap-2"
      >
        <LuLogIn className="size-4" aria-hidden />
        {loading ? "Logging in…" : submitLabel}
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

function DashboardActions({
  loading,
  onRefresh,
  onLogout,
}: {
  loading: boolean;
  onRefresh: () => void;
  onLogout?: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="secondary"
        className="flex-1 gap-1.5"
        onClick={onRefresh}
        disabled={loading}
      >
        <LuRefreshCw className={["size-3.5", loading ? "animate-spin" : ""].join(" ")} aria-hidden />
        Refresh
      </Button>
      {onLogout ? (
        <Button
          type="button"
          variant="secondary"
          className="gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={onLogout}
        >
          <LuLogOut className="size-3.5" aria-hidden />
          Logout
        </Button>
      ) : null}
    </div>
  );
}

function ErpDashboardView({
  baseUrl,
  dashboard,
  onRefresh,
}: {
  baseUrl: string;
  dashboard: ErpDashboard;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="truncate rounded-xl bg-surface-container-low px-3 py-2 text-[11px] text-on-surface-muted">
        {baseUrl}
      </p>

      <div className="flex gap-2.5 rounded-xl bg-primary/8 px-3 py-2.5">
        <LuInfo className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-xs leading-relaxed text-on-surface">
          Whatever data this ERPNext account can access,{" "}
          <span className="font-semibold">BBAI</span> can access through ERPNext MCP tools.
        </p>
      </div>

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

      <DashboardActions loading={dashboard.loading} onRefresh={onRefresh} />
    </div>
  );
}

function SchoolErpDashboardView({
  baseUrl,
  overview,
  onRefresh,
  onLogout,
}: {
  baseUrl: string;
  overview: SchoolErpOverview;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  const totalStudents = overview.studentsBed + overview.studentsCollege;

  return (
    <div className="space-y-4">
      <p className="truncate rounded-xl bg-surface-container-low px-3 py-2 text-[11px] text-on-surface-muted">
        {baseUrl}
      </p>

      <div className="flex gap-2.5 rounded-xl bg-primary/8 px-3 py-2.5">
        <LuInfo className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-xs leading-relaxed text-on-surface">
          Whatever data this school account can access, <span className="font-semibold">BBAI</span>{" "}
          can access through School ERP MCP tools.
        </p>
      </div>

      <div className="space-y-2">
        <StatCard
          icon={<LuUsers className="size-4" />}
          label="Students (total)"
          value={overview.loading ? "…" : String(totalStudents)}
          sub={
            overview.loading
              ? "Loading…"
              : `BED ${overview.studentsBed} · College ${overview.studentsCollege}`
          }
        />
        <StatCard
          icon={<LuGraduationCap className="size-4" />}
          label="Teachers / faculty"
          value={overview.loading ? "…" : String(overview.teachers)}
          sub={overview.schoolYear ? overview.schoolYear : "All years"}
        />
        <StatCard
          icon={<LuBookOpen className="size-4" />}
          label="Classes"
          value={overview.loading ? "…" : String(overview.classes)}
          sub="BED + College"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
          General settings
        </p>
        {overview.loading ? (
          <div className="space-y-2">
            <div className="h-10 animate-pulse rounded-xl bg-surface-container-high/60" />
            <div className="h-10 animate-pulse rounded-xl bg-surface-container-high/60" />
          </div>
        ) : overview.settings.length > 0 ? (
          <ul className="space-y-1.5">
            {overview.settings.map((row) => (
              <li
                key={`${row.label}-${row.value}`}
                className="flex items-start justify-between gap-3 rounded-xl bg-surface-container-high/60 px-3 py-2"
              >
                <span className="text-[11px] text-on-surface-muted">{row.label}</span>
                <span className="max-w-[60%] truncate text-right text-xs font-medium text-on-surface">
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-surface-container-high/60 px-3 py-3 text-xs text-on-surface-muted">
            {overview.schoolName || overview.schoolCode || overview.schoolYear
              ? [
                  overview.schoolName && `School: ${overview.schoolName}`,
                  overview.schoolCode && `Code: ${overview.schoolCode}`,
                  overview.schoolYear && `Year: ${overview.schoolYear}`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "No general settings available for this account."}
          </p>
        )}
      </div>

      <DashboardActions
        loading={overview.loading}
        onRefresh={onRefresh}
        onLogout={onLogout}
      />
    </div>
  );
}

/* ── Shared ERP tool sidebar ────────────────────────────── */

function ErpToolsPanel({
  config,
  sidebar,
  icon,
  title,
  brandLabel,
  loginHint,
  showUrlField,
  emailPlaceholder,
  submitLabel,
  /**
   * SID already set at `/sign-in` (Livro password or school desk `?sid=&parent=`).
   * No second password form — same pattern for Livro MCP and School MCP.
   */
  usesAppSessionLogin = false,
  missingSessionTitle,
  missingSessionBody,
  topOffset,
}: {
  config: ErpToolConfig;
  sidebar: ReturnType<typeof useToolsSidebar>;
  icon: ReactNode;
  title: string;
  brandLabel: string;
  loginHint: string;
  showUrlField?: boolean;
  emailPlaceholder?: string;
  submitLabel?: string;
  usesAppSessionLogin?: boolean;
  missingSessionTitle?: string;
  missingSessionBody?: string;
  topOffset?: string;
}) {
  const erp = useErpLogin(config);

  return (
    <>
      <RightSidebarTrigger
        sidebar={sidebar}
        icon={icon}
        labelOpen={`Hide ${brandLabel}`}
        labelClosed={`Show ${brandLabel}`}
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
              {brandLabel}
            </span>
          }
          title={title}
          closeLabel={`Close ${brandLabel}`}
        />

        <RightSidebarContent>
          {erp.sessionRestoring ? (
            <SidebarLoading
              title={`Reconnecting ${brandLabel}`}
              subtitle="Restoring your session and pulling the latest overview…"
              icon={icon}
              variant={config.kind === "school_erpnext" ? "overview" : "connection"}
            />
          ) : erp.erpSession ? (
            config.kind === "school_erpnext" ? (
              <SchoolErpDashboardView
                baseUrl={erp.erpSession.baseUrl}
                overview={erp.schoolOverview}
                onRefresh={erp.refreshDashboard}
                onLogout={erp.logoutErp}
              />
            ) : (
              <ErpDashboardView
                baseUrl={erp.erpSession.baseUrl}
                dashboard={erp.dashboard}
                onRefresh={erp.refreshDashboard}
              />
            )
          ) : erp.otpState && !usesAppSessionLogin ? (
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
          ) : usesAppSessionLogin ? (
            <div className="space-y-3 rounded-2xl bg-surface-container-low px-4 py-5">
              <p className="text-sm font-medium text-on-surface">
                {missingSessionTitle ?? "Session missing"}
              </p>
              <p className="text-xs leading-relaxed text-on-surface-muted">
                {missingSessionBody ??
                  "Sign in again from the app login page so MCP can use your ERP session."}
              </p>
              <a
                href="/sign-in"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary underline"
              >
                <LuLogIn className="size-4" aria-hidden />
                Go to sign-in
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-on-surface-muted">{loginHint}</p>
              <ErpLoginForm
                onSubmit={erp.loginErp}
                loading={erp.loginLoading}
                error={erp.loginError}
                showUrlField={showUrlField}
                emailPlaceholder={emailPlaceholder}
                submitLabel={submitLabel}
              />
            </div>
          )}
        </RightSidebarContent>
      </RightSidebarPanel>
    </>
  );
}

/** Livro internal ERPNext — SID comes from app `/sign-in` (no duplicate login). */
export function WorkspaceToolsSidebar({ topOffset }: { topOffset?: string } = {}) {
  const sidebar = useToolsSidebar();
  return (
    <ErpToolsPanel
      config={LIVRO_ERP_TOOL}
      sidebar={sidebar}
      icon={<SiErpnext className="size-5" aria-hidden />}
      title="Tools"
      brandLabel="ERPNext"
      loginHint="Livro session is created when you sign in to BBAI."
      usesAppSessionLogin
      missingSessionTitle="Livro session missing"
      missingSessionBody="You already sign in with Livro on the app login page. Sign out and sign in again to refresh Livro MCP."
      topOffset={topOffset}
    />
  );
}

/**
 * School ERP — SID only from `/sign-in?sid=&parent=` (non-Livro), same as Livro.
 * Never show a second password form in this sidebar.
 */
export function SchoolErpToolsSidebar({ topOffset }: { topOffset?: string } = {}) {
  const sidebar = useSchoolErpSidebar();

  useEffect(() => {
    const { sid, parent } = readEmbedParamsFromWindow();
    const resolved = resolveSchoolEmbedParent();
    const schoolParent =
      (parent && !isLivroParent(parent) ? parent : null) ||
      (resolved && !isLivroParent(resolved) ? resolved : null);

    // Prefer URL sid; else reuse desk sid that was wrongly stored under Livro keys
    const embedSid =
      sid?.trim() ||
      localStorage.getItem("bbai_school_erp_sid")?.trim() ||
      (schoolParent ? localStorage.getItem("bbai_erp_sid")?.trim() : null) ||
      null;

    if (embedSid && schoolParent) {
      // Drop placeholder URL from an old manual login attempt
      const prevBase = localStorage.getItem("bbai_school_erp_base_url") ?? "";
      if (prevBase.includes("school.example.com")) {
        localStorage.removeItem("bbai_school_erp_base_url");
      }
      // persistEmbedSidClient notifies only when SID/storage actually changes
      persistEmbedSidClient(
        {
          sid: embedSid,
          fullName:
            localStorage.getItem("bbai_school_erp_user") ||
            localStorage.getItem("bbai_erp_user") ||
            "User",
          email:
            localStorage.getItem("bbai_school_erp_email") ||
            localStorage.getItem("bbai_erp_email") ||
            "",
          baseUrl: schoolParent,
        },
        { forceSchool: true },
      );
    } else if (schoolParent) {
      persistEmbedParent(schoolParent);
      persistSchoolMcpAuto(null);
    }
  }, []);

  return (
    <ErpToolsPanel
      config={SCHOOL_ERP_TOOL}
      sidebar={sidebar}
      icon={<LuSchool className="size-6" aria-hidden />}
      title="School"
      brandLabel="School ERP"
      loginHint="School session is created when you open BBAI from the school desk."
      usesAppSessionLogin
      missingSessionTitle="School session missing"
      missingSessionBody="Open BBAI from your school desk (FAB) with /sign-in?sid=&parent= — School MCP uses that SID automatically, same as Livro. No separate school password login."
      topOffset={topOffset}
    />
  );
}

import type { SDKCustomTool, SDKJsonValue } from "@cursor/sdk";
import {
  extractSchoolErpSessionFromMcpHeaders,
  SCHOOL_ERP_MCP_SERVER_KEY,
} from "@/lib/entities/erpnext.type";
import {
  FRAPPE_OUTPUT_KIND,
  formatOutputMarker,
  type FrappeOutputKind,
  type FrappeOutputTarget,
} from "@/lib/entities/frappe_output.type";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";
import { saveFrappeSourceDoc } from "@/lib/domain/usecases/erpnext/frappe_source_doc.usecase";
import { normalizeErpnextBaseUrl } from "@/lib/domain/usecases/erpnext/erpnext_http.usecase";
import { getUserAccess } from "../users/get_user_access.usecase";

type SchoolSession = { sid: string; baseUrl: string };

function jsonResult(data: unknown): SDKJsonValue {
  return JSON.parse(JSON.stringify(data ?? null)) as SDKJsonValue;
}

function tool(
  description: string,
  inputSchema: Record<string, SDKJsonValue> | undefined,
  execute: SDKCustomTool["execute"],
): SDKCustomTool {
  return { description, inputSchema, execute };
}

function extractSchoolSession(
  mcpServers: Record<string, { headers?: Record<string, string> }> | undefined,
): SchoolSession | null {
  return extractSchoolErpSessionFromMcpHeaders(
    mcpServers?.[SCHOOL_ERP_MCP_SERVER_KEY]?.headers,
  );
}

async function erpCount(
  session: SchoolSession,
  doctype: string,
  filters: unknown[] = [],
): Promise<number> {
  const res = await fetch(`${session.baseUrl}/api/method/frappe.client.get_count`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: `sid=${session.sid}`,
    },
    body: JSON.stringify({ doctype, filters }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return 0;
  const json = (await res.json()) as { message?: number };
  return typeof json.message === "number" ? json.message : 0;
}

async function erpGet(
  session: SchoolSession,
  doctype: string,
  name?: string,
): Promise<Record<string, unknown> | null> {
  const docName = encodeURIComponent(name || doctype);
  const encodedDoctype = encodeURIComponent(doctype);
  const res = await fetch(`${session.baseUrl}/api/resource/${encodedDoctype}/${docName}`, {
    headers: {
      Accept: "application/json",
      Cookie: `sid=${session.sid}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Record<string, unknown> };
  return json.data ?? null;
}

async function erpList<T>(
  session: SchoolSession,
  doctype: string,
  options: {
    fields?: string[];
    filters?: unknown[];
    limit?: number;
    orderBy?: string;
  } = {},
): Promise<T[]> {
  const params = new URLSearchParams();
  params.set("fields", JSON.stringify(options.fields ?? ["name"]));
  if (options.filters) params.set("filters", JSON.stringify(options.filters));
  params.set("limit_page_length", String(options.limit ?? 20));
  if (options.orderBy) params.set("order_by", options.orderBy);
  const encodedDoctype = encodeURIComponent(doctype);
  const res = await fetch(
    `${session.baseUrl}/api/resource/${encodedDoctype}?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        Cookie: `sid=${session.sid}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: T[] };
  return Array.isArray(json.data) ? json.data : [];
}

async function resolveSchoolYear(session: SchoolSession): Promise<string | null> {
  const current = await erpList<{ name: string; is_current?: number }>(session, "School Year", {
    fields: ["name", "is_current"],
    filters: [["is_current", "=", 1]],
    limit: 1,
  });
  if (current[0]?.name) {
    return current[0].name;
  }
  const any = await erpList<{ name: string }>(session, "School Year", {
    fields: ["name"],
    limit: 1,
    orderBy: "modified desc",
  });
  return any[0]?.name || null;
}

async function buildClassesByYear(session: SchoolSession) {
  const schoolYears = await erpList<{ name: string; is_current?: number }>(
    session,
    "School Year",
    {
      fields: ["name", "is_current"],
      limit: 100,
      orderBy: "name desc",
    },
  );

  const yearKeys = schoolYears.map((row) => row.name).filter(Boolean);

  const rows = await Promise.all(
    yearKeys.map(async (schoolYear) => {
      const yearFilters = [["school_year", "=", schoolYear]];
      const [bed, college] = await Promise.all([
        erpCount(session, "Class", yearFilters),
        erpCount(session, "College Classes", yearFilters),
      ]);
      const meta = schoolYears.find((row) => row.name === schoolYear);
      return {
        schoolYear,
        isCurrent: meta?.is_current === 1,
        basicEducation: bed,
        college,
        total: bed + college,
      };
    }),
  );

  rows.sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));

  const settings = (await erpGet(session, "School Settings")) || (await erpGet(session, "General Settings")) || {};
  return {
    site: session.baseUrl,
    schoolName: settings.school_name ?? settings.school ?? settings.company ?? null,
    schoolYears: rows,
    totals: {
      basicEducation: rows.reduce((s, r) => s + r.basicEducation, 0),
      college: rows.reduce((s, r) => s + r.college, 0),
      all: rows.reduce((s, r) => s + r.total, 0),
    },
  };
}

async function buildEnrolleeSummary(session: SchoolSession) {
  const schoolYear = await resolveSchoolYear(session);
  const enrolledFilters = schoolYear
    ? [
        ["school_year", "=", schoolYear],
        ["officially_enrolled", "=", "Yes"],
      ]
    : [["officially_enrolled", "=", "Yes"]];
  const yearFilters = schoolYear ? [["school_year", "=", schoolYear]] : [];

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
    erpCount(session, "Enrollees", enrolledFilters),
    erpCount(session, "College Enrollees", enrolledFilters),
    erpCount(session, "Teacher", yearFilters),
    erpCount(session, "College Faculty", []),
    erpCount(session, "Class", yearFilters),
    erpCount(session, "College Classes", yearFilters),
    erpGet(session, "School Settings"),
    erpGet(session, "General Settings"),
  ]);

  const settings = schoolSettings || generalSettings || {};
  return {
    site: session.baseUrl,
    schoolYear,
    schoolCode: settings.school_code ?? settings.code ?? null,
    schoolName: settings.school_name ?? settings.school ?? settings.company ?? null,
    enrollees: {
      total: studentsBed + studentsCollege,
      basicEducation: studentsBed,
      college: studentsCollege,
      officiallyEnrolledOnly: true,
    },
    teachers: teachersBed + teachersCollege,
    classes: classesBed + classesCollege,
  };
}

/**
 * In-process School ERP tools using the desk SID from BBAI School ERP login.
 * Works even when remote school_erpnext MCP tool discovery fails.
 */
export async function buildSchoolErpCustomTools(
  mcpServers: Record<string, { headers?: Record<string, string> }> | undefined,
  userId?: string,
): Promise<Record<string, SDKCustomTool> | undefined> {
  if (!userId) return undefined;
  const access = await getUserAccess(userId);
  if (!hasPermission(access?.permissions, USER_PERMISSION.ERPNEXT_SCHOOL_ACCESS)) {
    return undefined;
  }

  const session = extractSchoolSession(mcpServers);
  if (!session) return undefined;

  const run = async (fn: () => Promise<unknown>) => {
    try {
      return jsonResult(await fn());
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: error instanceof Error ? error.message : "School ERP tool failed.",
          },
        ],
        isError: true,
      };
    }
  };

  return {
    school_erp_enrollee_summary: tool(
      "Summarize school enrollees for the current school year (BED + College officially enrolled counts, teachers, classes, school name/code). Use when the user asks about enrollees, enrollment, students, or school headcount.",
      { type: "object", properties: {} },
      () => run(() => buildEnrolleeSummary(session)),
    ),
    school_erp_classes_by_year: tool(
      "Count Basic Ed (Class) and College (College Classes) records grouped by school year. Use when the user asks how many classes exist per school year.",
      { type: "object", properties: {} },
      () => run(() => buildClassesByYear(session)),
    ),
    school_erp_list_enrollees: tool(
      "List enrollee records from School ERP (Basic Ed Enrollees and/or College Enrollees).",
      {
        type: "object",
        properties: {
          level: {
            type: "string",
            description: '"bed" | "college" | "all" (default all)',
          },
          limit: {
            type: "number",
            description: "Max rows per doctype (default 25, max 100)",
          },
          officially_enrolled_only: {
            type: "boolean",
            description: "Default true — only officially_enrolled=Yes",
          },
        },
      },
      (args) =>
        run(async () => {
          const level = String(args.level ?? "all").toLowerCase();
          const limit = Math.min(100, Math.max(1, Number(args.limit) || 25));
          const officialOnly = args.officially_enrolled_only !== false;
          const schoolYear = await resolveSchoolYear(session);
          const filters: unknown[] = [];
          if (schoolYear) filters.push(["school_year", "=", schoolYear]);
          if (officialOnly) filters.push(["officially_enrolled", "=", "Yes"]);

          const bedFields = [
            "name",
            "student_name",
            "full_name",
            "student_id",
            "grade_level",
            "officially_enrolled",
            "school_year",
          ];
          const collegeFields = [
            "name",
            "student_name",
            "full_name",
            "student_id",
            "course",
            "year_level",
            "semester",
            "officially_enrolled",
            "school_year",
          ];

          const [bed, college] = await Promise.all([
            level === "college"
              ? Promise.resolve([])
              : erpList(session, "Enrollees", {
                  fields: bedFields,
                  filters,
                  limit,
                  orderBy: "modified desc",
                }),
            level === "bed"
              ? Promise.resolve([])
              : erpList(session, "College Enrollees", {
                  fields: collegeFields,
                  filters,
                  limit,
                  orderBy: "modified desc",
                }),
          ]);

          return {
            site: session.baseUrl,
            schoolYear,
            basicEducation: bed,
            college,
          };
        }),
    ),
    school_erp_open_output: tool(
      "Open a Frappe print format, webpage, or webform in Output (Preview + Source). Web Page Source edits main_section_html (HTML) / javascript / css. Web Form: client_script + custom_css. Print Format: html + css. Set name + route (when published) for webpage/webform Preview.",
      {
        type: "object",
        properties: {
          kind: {
            type: "string",
            description: '"print_format" | "webpage" | "webform"',
          },
          doctype: {
            type: "string",
            description: "For print_format Preview: DocType being printed, e.g. Class",
          },
          name: {
            type: "string",
            description:
              "Web Form / Web Page name, or print_format sample doc name (Print Format name if format omitted)",
          },
          format: {
            type: "string",
            description:
              'Print Format DocType name, e.g. "Class List with Grades BED" (desk: /app/print-format/...)',
          },
          route: {
            type: "string",
            description: "Published website route for webpage/webform Preview",
          },
          title: { type: "string" },
        },
        required: ["kind"],
      },
      (args) =>
        run(async () => {
          const session = extractSchoolSession(mcpServers);
          if (!session) {
            return {
              ok: false,
              error:
                "School MCP session missing. Connect School ERP in the BBAI rail so the desk SID is available.",
            };
          }
          const kind = String(args.kind || FRAPPE_OUTPUT_KIND.PRINT_FORMAT) as FrappeOutputKind;
          const target: FrappeOutputTarget = {
            kind,
            doctype: args.doctype ? String(args.doctype) : undefined,
            name: args.name ? String(args.name) : undefined,
            format: args.format ? String(args.format) : undefined,
            route: args.route ? String(args.route) : undefined,
            title: args.title ? String(args.title) : undefined,
          };
          return {
            ok: true,
            target,
            site: session.baseUrl,
            // SID stays server-side / in browser School MCP storage — Output panel reads it there.
            marker: formatOutputMarker(target),
            instruction:
              "Include the marker HTML comment verbatim in your assistant reply so the workspace Output panel streams the preview using the School MCP SID.",
          };
        }),
    ),
    school_erp_set_web_page_html: tool(
      "Write HTML/CSS/JS onto an existing School ERP Web Page. Saves to main_section_html + main_section with content_type=HTML (desk HTML tab + website). Call BEFORE school_erp_open_output.",
      {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              'Web Page document name (desk slug), title, or route — e.g. "bbai-—-boneless-bangus-ai", "BBAI — Boneless Bangus AI", or "bbai"',
          },
          main_section: {
            type: "string",
            description: "Full HTML body (written to main_section_html and main_section)",
          },
          css: { type: "string", description: "Optional Style tab CSS" },
          javascript: { type: "string", description: "Optional Scripting tab JS" },
          published: {
            type: "boolean",
            description: "Set published=1 (default true)",
          },
          route: {
            type: "string",
            description: "Optional website route to set, e.g. bbai",
          },
        },
        required: ["name", "main_section"],
      },
      (args) =>
        run(async () => {
          const session = extractSchoolSession(mcpServers);
          if (!session) {
            return {
              ok: false,
              error:
                "School MCP session missing. Connect School ERP in the BBAI rail so the desk SID is available.",
            };
          }
          const name = String(args.name || "").trim();
          const html = String(args.main_section || "");
          if (!name) return { ok: false, error: "name is required." };
          if (!html.trim()) {
            return {
              ok: false,
              error: "HTML is required (desk main_section_html stays empty otherwise).",
            };
          }

          const fields: Record<string, string> = {
            main_section_html: html,
            main_section: html,
            content_type: "HTML",
          };
          if (args.css != null) fields.css = String(args.css);
          if (args.javascript != null) fields.javascript = String(args.javascript);
          if (args.route != null && String(args.route).trim()) {
            fields.route = String(args.route).replace(/^\/+/, "").trim();
          }
          if (args.published !== false) fields.published = "1";

          const result = await saveFrappeSourceDoc({
            sid: session.sid,
            baseUrl: normalizeErpnextBaseUrl(session.baseUrl) || session.baseUrl,
            doctype: "Web Page",
            name,
            fields,
          });
          if (!result.ok) return { ok: false, error: result.error };

          const route = fields.route || "bbai";
          const target: FrappeOutputTarget = {
            kind: FRAPPE_OUTPUT_KIND.WEBPAGE,
            name: result.data.name,
            route,
            title: result.data.name,
          };
          return {
            ok: true,
            name: result.data.name,
            site: session.baseUrl,
            marker: formatOutputMarker(target),
            instruction:
              "Web Page HTML saved to main_section_html. Include the marker in your reply, then reload Output Preview.",
          };
        }),
    ),
  };
}

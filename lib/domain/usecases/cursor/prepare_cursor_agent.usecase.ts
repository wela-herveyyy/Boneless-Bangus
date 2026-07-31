import type { McpServerConfig, SDKCustomTool } from "@cursor/sdk";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { resolveApiKey } from "@/lib/domain/usecases/ai/resolve_api_key.usecase";
import { AI_PROVIDER } from "@/lib/entities/ai.type";
import type { PromptAgentInput } from "@/lib/entities/cursor.type";
import { SCHOOL_ERP_MCP_SERVER_KEY, SCHOOL_ERP_SESSION_PLACEHOLDER_URL } from "@/lib/entities/erpnext.type";
import { getSession } from "../auth/get_session.usecase";
import {
  getPromptSkills,
  mergePromptSkills,
} from "../skills/get_prompt_skills.usecase";
import { buildGithubCustomTools } from "./build_github_custom_tools.usecase";
import { buildSchoolErpCustomTools } from "./build_school_erp_custom_tools.usecase";
import { buildSkillsCustomTools } from "./build_skills_custom_tools.usecase";
import { buildWorkspaceCustomTools } from "./build_workspace_custom_tools.usecase";

export type PreparedCursorAgent = {
  apiKey: string;
  promptText: string;
  modelId: string;
  cwd: string;
  mcpForAgent: Record<string, McpServerConfig> | undefined;
  customTools: Record<string, SDKCustomTool>;
  hasCustomTools: boolean;
  userId?: string;
};

export async function prepareCursorAgent(
  input: PromptAgentInput,
): Promise<{ ok: true; data: PreparedCursorAgent } | { ok: false; error: string }> {
  const message = input.message.trim();
  const hasFiles = Array.isArray(input.files) && input.files.length > 0;
  if (!message && !hasFiles) {
    return { ok: false, error: "Message is required." };
  }

  let userId: string | undefined;
  const session = await getSession();
  if (session?.user?.id) userId = session.user.id;

  const resolved = await resolveApiKey(userId, AI_PROVIDER.CURSOR, input.keySource);
  if (!resolved.ok) return { ok: false, error: resolved.error };
  const apiKey = resolved.apiKey;

  const who =
    input.name || input.email
      ? `User: ${input.name ?? "unknown"}${input.email ? ` <${input.email}>` : ""}\n\n`
      : "";

  const serverSkills = userId ? await getPromptSkills(userId) : [];
  const skills = mergePromptSkills(input.skills, serverSkills);
  const skillBlock =
    skills.length > 0
      ? `Skills (follow when relevant):\n${skills
          .map((s) => `### ${s.name}\n${s.content}`)
          .join("\n\n")}\n\n`
      : "";

  const mcpServers = input.mcpServers as Record<string, McpServerConfig> | undefined;

  const workspaceTools = userId ? await buildWorkspaceCustomTools(userId) : undefined;
  const githubTools = userId ? await buildGithubCustomTools(userId) : undefined;
  const skillsTools = userId ? await buildSkillsCustomTools(userId) : undefined;
  const schoolErpTools = userId
    ? await buildSchoolErpCustomTools(
        mcpServers as Record<string, { headers?: Record<string, string> }> | undefined,
        userId,
      )
    : undefined;
  const customTools = {
    ...(workspaceTools ?? {}),
    ...(githubTools ?? {}),
    ...(skillsTools ?? {}),
    ...(schoolErpTools ?? {}),
  };
  const hasCustomTools = Object.keys(customTools).length > 0;

  const workspaceHint = workspaceTools
    ? "Google Workspace tools are available (Gmail, Calendar, Meet) via custom tools. Use them when the user asks about email, calendar, or meetings. These are first-party app tools, not official Google remote MCP.\n\n"
    : "";
  const githubHint = githubTools
    ? "GitHub tools are available via the user's saved PAT (custom tools). For a multi-repo overview across personal, collaborator, and organization repos, call github_list_my_repositories. Prefer that over guessing from the local workspace or a single open repo.\n\n"
    : "";
  const skillsHint = skillsTools
    ? "Skill storage tools: call skills_create_skill to persist a new skill in the DATABASE (never edit source files like builtin_skills.ts). Use skills_list_skills to see existing DB skills.\n\n"
    : "";
  const schoolErpHint = schoolErpTools
    ? "School ERP tools are available via the user's connected School ERP session in Giya (custom tools school_erp_enrollee_summary / school_erp_list_enrollees / school_erp_set_web_page_html / school_erp_open_output). Prefer these over remote school_erpnext MCP. For Web Pages: call school_erp_set_web_page_html so HTML is written to main_section_html (Frappe HTML tab) before school_erp_open_output — otherwise desk/Preview stay blank. Paste the marker comment into your reply so Output streams the preview. Report Cards: skill \"BED Report Card Layout (SF9)\" is NON-NEGOTIABLE (DepEd SF9 / Form 138 — identity, learning progress, observed values AO/SO/RO/NO, attendance, signatures). Never invent a different report-card design. Other grading reports: School ERP Grading skills + Desk query-report only. Do not claim School MCP is disconnected if these tools work.\n\n"
    : "";

  let fileContext = "";
  if (input.files && input.files.length > 0) {
    const extractedParts = await Promise.all(
      input.files.map(async (f) => {
        const mime = f.mimeType.toLowerCase();
        const data = f.base64Data.includes(",") ? f.base64Data.split(",")[1] : f.base64Data;

        if (mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/")) {
          return null;
        }

        if (mime === "application/pdf") {
          try {
            const pdfBuffer = Buffer.from(data, "base64");
            const parsed = await pdfParse(pdfBuffer);
            return `The user has uploaded a PDF file named "${f.name}". Here is the extracted text content:\n\n<file_content filename="${f.name}">\n${parsed.text}\n</file_content>`;
          } catch (e) {
            console.warn(`[Cursor] Failed to parse PDF ${f.name}:`, e);
            return null;
          }
        }

        try {
          const textStr = Buffer.from(data, "base64").toString("utf-8");
          if (!textStr.includes("\u0000")) {
            return `The user has uploaded a text file named "${f.name}". Here is the content:\n\n<file_content filename="${f.name}">\n${textStr}\n</file_content>`;
          }
        } catch {
          // ignore
        }

        return null;
      }),
    );
    const validParts = extractedParts.filter(Boolean) as string[];
    if (validParts.length > 0) {
      fileContext = `\n\n${validParts.join("\n\n")}`;
    }
  }

  const mcpForAgent = mcpServers ? { ...mcpServers } : undefined;
  const schoolCfg = mcpForAgent?.[SCHOOL_ERP_MCP_SERVER_KEY] as { url?: string } | undefined;
  if (schoolCfg?.url === SCHOOL_ERP_SESSION_PLACEHOLDER_URL) {
    delete mcpForAgent?.[SCHOOL_ERP_MCP_SERVER_KEY];
  }

  return {
    ok: true,
    data: {
      apiKey,
      promptText: `${who}${skillBlock}${workspaceHint}${githubHint}${skillsHint}${schoolErpHint}${message}${fileContext}`,
      modelId: input.modelId ?? "composer-2.5",
      cwd: input.cwd ?? process.cwd(),
      mcpForAgent: mcpForAgent && Object.keys(mcpForAgent).length > 0 ? mcpForAgent : undefined,
      customTools,
      hasCustomTools,
      userId,
    },
  };
}

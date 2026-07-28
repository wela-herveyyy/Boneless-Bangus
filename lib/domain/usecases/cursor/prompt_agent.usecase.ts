import { Agent, type McpServerConfig } from "@cursor/sdk";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import type {
  CursorResult,
  PromptAgentInput,
  PromptAgentOutput,
} from "@/lib/entities/cursor.type";
import { getSession } from "../auth/get_session.usecase";
import { getProfile } from "../profile/get_profile.usecase";
import {
  getPromptSkills,
  mergePromptSkills,
} from "../skills/get_prompt_skills.usecase";
import { buildGithubCustomTools } from "./build_github_custom_tools.usecase";
import { buildSkillsCustomTools } from "./build_skills_custom_tools.usecase";
import { buildWorkspaceCustomTools } from "./build_workspace_custom_tools.usecase";

export async function promptAgent(
  input: PromptAgentInput,
): Promise<CursorResult<PromptAgentOutput>> {
  const message = input.message.trim();
  const hasFiles = Array.isArray(input.files) && input.files.length > 0;
  if (!message && !hasFiles) {
    return { ok: false, error: "Message is required." };
  }

  let apiKey = process.env.CURSOR_API_KEY;
  let userId: string | undefined;
  const session = await getSession();
  if (session?.user?.id) {
    userId = session.user.id;
    const profile = await getProfile(session.user.id);
    if (profile.settings?.cursorApiKey) {
      apiKey = profile.settings.cursorApiKey;
    } else if (profile.team?.cursorApiKey) {
      apiKey = profile.team.cursorApiKey;
    }
  }

  if (!apiKey) {
    return { ok: false, error: "CURSOR_API_KEY is not set in environment or your profile." };
  }

  const who =
    input.name || input.email
      ? `User: ${input.name ?? "unknown"}${input.email ? ` <${input.email}>` : ""}\n\n`
      : "";

  const serverSkills = userId ? await getPromptSkills(userId) : [];
  const skills = mergePromptSkills(input.skills, serverSkills);
  // Built-ins + marketplace/IDB skills injected as text (SDK has no skill loader)
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
  const customTools = {
    ...(workspaceTools ?? {}),
    ...(githubTools ?? {}),
    ...(skillsTools ?? {}),
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

  // Extract text content from attached files and append to the prompt.
  // PDFs and text files are supported; images are skipped on the Cursor path.
  let fileContext = "";
  if (input.files && input.files.length > 0) {
    const extractedParts = await Promise.all(
      input.files.map(async (f) => {
        const mime = f.mimeType.toLowerCase();
        const data = f.base64Data.includes(",") ? f.base64Data.split(",")[1] : f.base64Data;

        // Skip images — Cursor prompt is text-only
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

        // Try to decode as UTF-8 text
        try {
          const textStr = Buffer.from(data, "base64").toString("utf-8");
          if (!textStr.includes("\u0000")) {
            return `The user has uploaded a text file named "${f.name}". Here is the content:\n\n<file_content filename="${f.name}">\n${textStr}\n</file_content>`;
          }
        } catch {
          // ignore
        }

        return null;
      })
    );
    const validParts = extractedParts.filter(Boolean) as string[];
    if (validParts.length > 0) {
      fileContext = `\n\n${validParts.join("\n\n")}`;
    }
  }

  try {
    const run = await Agent.prompt(
      `${who}${skillBlock}${workspaceHint}${githubHint}${skillsHint}${message}${fileContext}`,
      {
        apiKey,
        model: { id: input.modelId ?? "composer-2.5" },
        mcpServers:
          mcpServers && Object.keys(mcpServers).length > 0 ? mcpServers : undefined,
        local: {
          cwd: input.cwd ?? process.cwd(),
          ...(hasCustomTools ? { customTools } : {}),
        },
      },
    );

    if (run.status === "error") {
      return {
        ok: false,
        error: run.error?.message ?? "Cursor agent run failed.",
      };
    }

    return {
      ok: true,
      data: {
        status: run.status,
        result: run.result,
        requestId: run.requestId,
        durationMs: run.durationMs,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Cursor agent request failed.",
    };
  }
}

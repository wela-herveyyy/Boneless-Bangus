import { Agent, type McpServerConfig } from "@cursor/sdk";
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
import { buildWorkspaceCustomTools } from "./build_workspace_custom_tools.usecase";

export async function promptAgent(
  input: PromptAgentInput,
): Promise<CursorResult<PromptAgentOutput>> {
  const message = input.message.trim();
  if (!message) {
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
  const workspaceHint = workspaceTools
    ? "Google Workspace tools are available (Gmail, Calendar, Meet) via custom tools. Use them when the user asks about email, calendar, or meetings. These are first-party app tools, not official Google remote MCP.\n\n"
    : "";

  try {
    const run = await Agent.prompt(`${who}${skillBlock}${workspaceHint}${message}`, {
      apiKey,
      model: { id: input.modelId ?? "composer-2.5" },
      mcpServers: mcpServers && Object.keys(mcpServers).length > 0 ? mcpServers : undefined,
      local: {
        cwd: input.cwd ?? process.cwd(),
        ...(workspaceTools ? { customTools: workspaceTools } : {}),
      },
    });

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

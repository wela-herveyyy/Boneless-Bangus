import { Agent, type McpServerConfig } from "@cursor/sdk";
import type {
  CursorResult,
  PromptAgentInput,
  PromptAgentOutput,
} from "@/lib/entities/cursor.type";

export async function promptAgent(
  input: PromptAgentInput,
): Promise<CursorResult<PromptAgentOutput>> {
  const message = input.message.trim();
  if (!message) {
    return { ok: false, error: "Message is required." };
  }

  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "CURSOR_API_KEY is not set." };
  }

  const who =
    input.name || input.email
      ? `User: ${input.name ?? "unknown"}${input.email ? ` <${input.email}>` : ""}\n\n`
      : "";

  // ponytail: skills live in IndexedDB — inject text; SDK has no IDB skill loader
  const skillBlock =
    input.skills && input.skills.length > 0
      ? `Skills (follow when relevant):\n${input.skills
          .map((s) => `### ${s.name}\n${s.content}`)
          .join("\n\n")}\n\n`
      : "";

  const mcpServers = input.mcpServers as Record<string, McpServerConfig> | undefined;

  try {
    const run = await Agent.prompt(`${who}${skillBlock}${message}`, {
      apiKey,
      model: { id: input.modelId ?? "composer-2.5" },
      mcpServers: mcpServers && Object.keys(mcpServers).length > 0 ? mcpServers : undefined,
      local: { cwd: input.cwd ?? process.cwd() },
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

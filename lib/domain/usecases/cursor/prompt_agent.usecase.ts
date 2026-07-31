import { Agent } from "@cursor/sdk";
import type {
  CursorResult,
  PromptAgentInput,
  PromptAgentOutput,
} from "@/lib/entities/cursor.type";
import { prepareCursorAgent } from "./prepare_cursor_agent.usecase";

export async function promptAgent(
  input: PromptAgentInput,
): Promise<CursorResult<PromptAgentOutput>> {
  const prepared = await prepareCursorAgent(input);
  if (!prepared.ok) return prepared;

  const { apiKey, promptText, modelId, cwd, mcpForAgent, customTools, hasCustomTools } =
    prepared.data;

  try {
    const run = await Agent.prompt(promptText, {
      apiKey,
      model: { id: modelId },
      mcpServers: mcpForAgent,
      local: {
        cwd,
        ...(hasCustomTools ? { customTools } : {}),
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
        inputTokens: run.usage?.inputTokens,
        outputTokens: run.usage?.outputTokens,
        promptChars: promptText.length,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Cursor agent request failed.",
    };
  }
}

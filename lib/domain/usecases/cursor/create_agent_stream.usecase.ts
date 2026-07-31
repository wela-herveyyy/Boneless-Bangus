import { Agent } from "@cursor/sdk";
import type { PromptAgentInput } from "@/lib/entities/cursor.type";
import type { AiStreamClientEvent } from "@/lib/entities/google_ai.type";
import { prepareCursorAgent } from "./prepare_cursor_agent.usecase";

export type CreateCursorAgentStreamInput = PromptAgentInput & {
  /** Resume this local/cloud agent for multi-turn; omit to start fresh. */
  previousAgentId?: string;
};

/**
 * Streams Cursor SDK run events as the same SSE event shape Google AI uses
 * (thinking / text / tool_call / tool_result / completed / error).
 */
export async function* createCursorAgentStream(
  input: CreateCursorAgentStreamInput,
): AsyncGenerator<AiStreamClientEvent> {
  const prepared = await prepareCursorAgent(input);
  if (!prepared.ok) {
    yield { type: "error", error: prepared.error };
    return;
  }

  const { apiKey, promptText, modelId, cwd, mcpForAgent, customTools, hasCustomTools } =
    prepared.data;
  const model = { id: modelId };
  const local = {
    cwd,
    ...(hasCustomTools ? { customTools } : {}),
  };

  let agent: Awaited<ReturnType<typeof Agent.create>> | undefined;
  try {
    if (input.previousAgentId?.trim()) {
      try {
        agent = await Agent.resume(input.previousAgentId.trim(), {
          apiKey,
          model,
          mcpServers: mcpForAgent,
          local,
        });
      } catch (err) {
        console.warn("[Cursor] resume failed, creating new agent:", err);
        agent = undefined;
      }
    }

    if (!agent) {
      agent = await Agent.create({
        apiKey,
        model,
        mcpServers: mcpForAgent,
        local,
      });
    }

    yield { type: "created", conversationId: agent.agentId };

    const run = await agent.send(promptText, {
      model,
      mcpServers: mcpForAgent,
      local: hasCustomTools ? { customTools } : undefined,
    });

    let accumulatedText = "";
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;

    if (run.supports("stream")) {
      for await (const event of run.stream()) {
        if (event.type === "thinking" && event.text) {
          yield { type: "thinking", text: event.text };
          continue;
        }
        if (event.type === "assistant") {
          for (const block of event.message.content) {
            if (block.type === "text" && block.text) {
              accumulatedText += block.text;
              yield { type: "text", text: block.text };
            }
          }
          continue;
        }
        if (event.type === "tool_call") {
          const slug = "cursor";
          const toolName = event.name || "tool";
          if (event.status === "running") {
            yield { type: "tool_call", slug, toolName };
          } else {
            yield {
              type: "tool_result",
              slug,
              toolName,
              ok: event.status === "completed",
            };
          }
          continue;
        }
        if (event.type === "usage") {
          inputTokens = event.usage?.inputTokens ?? inputTokens;
          outputTokens = event.usage?.outputTokens ?? outputTokens;
        }
        if (event.type === "status" && event.status === "ERROR") {
          yield {
            type: "error",
            error: event.message || "Cursor agent run failed.",
          };
          return;
        }
      }
    }

    const result = await run.wait();
    if (result.status === "error") {
      yield {
        type: "error",
        error: result.error?.message ?? "Cursor agent run failed.",
      };
      return;
    }

    const finalText = (result.result?.trim() || accumulatedText).trim();
    if (!accumulatedText && finalText) {
      yield { type: "text", text: finalText };
      accumulatedText = finalText;
    }

    inputTokens = result.usage?.inputTokens ?? inputTokens;
    outputTokens = result.usage?.outputTokens ?? outputTokens;

    if (!inputTokens && !outputTokens) {
      inputTokens = Math.max(1, Math.round(promptText.length / 4));
      outputTokens = Math.max(1, Math.round((accumulatedText || finalText).length / 4));
    }

    yield {
      type: "completed",
      conversationId: agent.agentId,
      status: result.status,
      inputTokens,
      outputTokens,
    };
  } catch (error) {
    yield {
      type: "error",
      error: error instanceof Error ? error.message : "Cursor agent stream failed.",
    };
  } finally {
    if (agent) {
      try {
        await agent[Symbol.asyncDispose]();
      } catch {
        try {
          agent.close();
        } catch {
          // ignore dispose errors
        }
      }
    }
  }
}

import { GoogleGenAI } from "@google/genai";
import type {
  CreateInteractionInput,
  GoogleAiStreamEvent,
} from "@/lib/entities/google_ai.type";
import {
  GOOGLE_AI_AGENTS,
  GOOGLE_AI_DEFAULT_MODEL,
} from "@/lib/entities/google_ai.type";
import { connectMcpServers, executeMcpTool, sanitizeJsonSchema, type McpRuntimeSession, type NamespacedDiscoveredTool, type ExecuteToolResult } from "@/lib/domain/services/mcp_runtime.service";
import { getGoogleWorkspaceAuth } from "@/lib/domain/usecases/google_workspace_auth/get_google_workspace_auth.usecase";
import { refreshAndGetAccessToken } from "@/lib/domain/usecases/google_workspace_auth/refresh_and_get_access_token.usecase";
import {
  searchGmailThreadsUseCase,
  getGmailThreadUseCase,
  getGmailMessageUseCase,
  listGmailDraftsUseCase,
  createGmailDraftUseCase,
} from "@/lib/domain/usecases/mcp_google_workspace/gmail.usecases";
import { createCalendarEventUseCase, listCalendarEventsUseCase } from "@/lib/domain/usecases/mcp_google_workspace/calendar.usecases";
import { getSession } from "../auth/get_session.usecase";
import { getProfile } from "../profile/get_profile.usecase";

const AGENT_TIMEOUT_MS = 300_000;
const MAX_ATTEMPTS = 4;
const MAX_TOOL_TURNS = 6;

function thoughtSummaryText(delta: { type: string; content?: unknown }): string | null {
  if (delta.type !== "thought_summary") return null;
  const content = delta.content;
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    const text = (content as { text?: unknown }).text;
    if (typeof text === "string") return text;
  }
  return null;
}

function isRetriableGoogleError(message: string): boolean {
  return /404|429|requested entity was not found|internal error|too_many_requests|quota exceeded|resource_exhausted|overloaded|please retry in/i.test(message);
}

function isTerminatedError(message: string): boolean {
  return /\bterminated\b/i.test(message);
}

/** Ensure tool results submitted to remote agent are structured JSON objects rather than strings. */
function formatToolResult(contentStr: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(contentStr);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : { value: parsed };
  } catch {
    return { content: contentStr };
  }
}

/** Yields normalized thinking / text / tools / lifecycle events from Interactions SSE. */
export async function* createInteractionStream(
  input: CreateInteractionInput,
): AsyncGenerator<GoogleAiStreamEvent> {
  const message = input.message.trim();
  if (!message) {
    yield { type: "error", error: "Message is required." };
    return;
  }

  let apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const session = await getSession();
  if (session?.user?.id) {
    const profile = await getProfile(session.user.id);
    if (profile.settings?.geminiApiKey) {
      apiKey = profile.settings.geminiApiKey; // 1. Personal Key
    } else if (profile.team?.geminiApiKey) {
      apiKey = profile.team.geminiApiKey; // 2. Team Key
    }
  }

  if (!apiKey) {
    yield { type: "error", error: "GEMINI_API_KEY is not set in environment or your profile." };
    return;
  }

  const modelOrAgent = input.model ?? GOOGLE_AI_DEFAULT_MODEL;
  const isAgent = GOOGLE_AI_AGENTS.has(modelOrAgent);
  let previousInteractionId = input.previousInteractionId;
  let lastError = "Google AI stream failed.";

  // Connect to requested MCP servers before beginning stream
  let mcpSession: McpRuntimeSession | undefined;
  // Interactions API tools are a flat Array<FunctionT> — NOT the GenerateContent
  // { functionDeclarations } wrapper. FunctionT also uses `parameters`, not `parametersJsonSchema`.
  let optionsTools: Array<{ type: "function"; name: string; description?: string; parameters?: unknown }> | undefined;

  // Construct MCP Server list from any externally-passed servers
  const mcpServersList = Array.isArray(input.mcpServers) ? [...input.mcpServers] : [];

  // Direct in-process Google Workspace tools — avoids HTTP loopback timeout
  let inProcessGwTools: NamespacedDiscoveredTool[] | undefined;
  let inProcessGwExecutor: ((toolName: string, args: Record<string, unknown>) => Promise<ExecuteToolResult>) | undefined;

  if (input.userId) {
    try {
      const auth = await getGoogleWorkspaceAuth(input.userId);
      if (auth.isConnected) {
        const slug = "internal_google_workspace";

        const gwToolDefs = [
          { name: "search_threads", description: "Search Gmail threads using standard Gmail query syntax.", inputSchema: { type: "object", properties: { query: { type: "string", description: "The search query (e.g., 'is:unread', 'from:boss@example.com')" }, maxResults: { type: "number", description: "Max threads to return (default 1)" } }, required: ["query"] } },
          { name: "get_thread",     description: "Retrieve a specific Gmail thread and its messages by thread ID.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
          { name: "get_message",    description: "Retrieve a specific Gmail message by message ID.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
          { name: "list_drafts",    description: "List Gmail drafts (up to 20).", inputSchema: { type: "object", properties: { maxResults: { type: "number", description: "Optional max results" } } } },
          { name: "create_draft",   description: "Create a new draft email.", inputSchema: { type: "object", properties: { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["to", "subject", "body"] } },
          { name: "list_calendar_events", description: "List upcoming Google Calendar events.", inputSchema: { type: "object", properties: { timeMin: { type: "string", description: "RFC3339 timestamp (e.g. 2026-07-20T00:00:00Z)" }, timeMax: { type: "string" }, maxResults: { type: "number", description: "Max events to return (default 10)" } } } },
          { name: "create_calendar_event", description: "Create a Google Calendar event on the primary calendar.", inputSchema: { type: "object", properties: { summary: { type: "string" }, description: { type: "string" }, start: { type: "string" }, end: { type: "string" }, addGoogleMeet: { type: "boolean" } }, required: ["summary", "start", "end"] } },
        ];

        inProcessGwTools = gwToolDefs.map((t) => ({
          ...t,
          inputSchema: sanitizeJsonSchema(t.inputSchema as Record<string, unknown>),
          namespacedName: `${slug}__${t.name}`,
          slug,
          toolName: t.name,
        }));

        inProcessGwExecutor = async (toolName, args) => {
          try {
            const token = await refreshAndGetAccessToken(input.userId!);
            let result: unknown;
            switch (toolName) {
              case "search_threads":        result = await searchGmailThreadsUseCase(token, args.query as string, args.maxResults as number | undefined); break;
              case "get_thread":            result = await getGmailThreadUseCase(token, args.id as string); break;
              case "get_message":           result = await getGmailMessageUseCase(token, args.id as string); break;
              case "list_drafts":           result = await listGmailDraftsUseCase(token); break;
              case "create_draft":         result = await createGmailDraftUseCase(token, args.to as string, args.subject as string, args.body as string); break;
              case "list_calendar_events": result = await listCalendarEventsUseCase(token, args.timeMin as string | undefined, args.timeMax as string | undefined, args.maxResults as number | undefined); break;
              case "create_calendar_event": result = await createCalendarEventUseCase(token, args.summary as string, (args.description as string) || "", args.start as string, args.end as string, args.addGoogleMeet as boolean | undefined); break;
              default: return { ok: false, content: `Unknown tool: ${toolName}` };
            }
            return { ok: true, content: JSON.stringify(result) };
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Tool execution failed";
            return { ok: false, content: msg };
          }
        };
      }
    } catch (err) {
      console.warn("Failed to check or inject Google Workspace Auth:", err);
    }
  }

  // Build in-process GW tool lookup for dispatch
  const inProcessGwLookup = new Map<string, string>(); // namespacedName -> toolName
  if (inProcessGwTools) {
    for (const t of inProcessGwTools) {
      inProcessGwLookup.set(t.namespacedName, t.toolName);
    }
  }

  if (mcpServersList.length > 0) {
    const connResult = await connectMcpServers(mcpServersList, input.userId || "anonymous");
    mcpSession = connResult.session;

    for (const w of connResult.warnings) {
      yield { type: "tool_warning", slug: w.slug, reason: w.reason };
    }

    if (connResult.tools.length > 0) {
      optionsTools = connResult.tools.map((t) => ({
        type: "function" as const,
        name: t.namespacedName,
        description: t.description,
        parameters: sanitizeJsonSchema(t.inputSchema),
      }));
      // console.log("[createInteractionStream:optionsTools]", JSON.stringify(optionsTools, null, 2));
    }
  }

  // Merge in-process GW tools into optionsTools
  if (inProcessGwTools && inProcessGwTools.length > 0) {
    const gwFunctions = inProcessGwTools.map((t) => ({
      type: "function" as const,
      name: t.namespacedName,
      description: t.description,
      parameters: sanitizeJsonSchema(t.inputSchema),
    }));
    optionsTools = [...(optionsTools ?? []), ...gwFunctions];
  }


  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let sawProgress = false;
    let completed = false;
    let retriable: string | null = null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      let currentInput: unknown = message;
      let toolTurn = 0;

      while (toolTurn < MAX_TOOL_TURNS && !completed) {
        const previous = previousInteractionId
          ? { previous_interaction_id: previousInteractionId }
          : {};

        const requestPayload = {
          agent: modelOrAgent,
          input: currentInput as any,
          environment: "remote",
          stream: true as const,
          agent_config: { type: "dynamic", thinking_summaries: "auto" } as any,
          ...(input.systemInstruction ? { system_instruction: input.systemInstruction } : {}),
          ...(optionsTools ? { tools: optionsTools as any } : {}),
          ...previous,
        };
        // console.log(
        //   "[createInteractionStream:requestPayload]",
        //   JSON.stringify({ ...requestPayload, toolsCount: optionsTools?.length ?? 0, tools: undefined }, null, 2)
        // );

        const stream = isAgent
          ? await ai.interactions.create(requestPayload, { timeout: AGENT_TIMEOUT_MS })
          : await ai.interactions.create({
              model: modelOrAgent,
              input: currentInput as any,
              stream: true as const,
              ...(input.systemInstruction ? { system_instruction: input.systemInstruction } : {}),
              ...(optionsTools ? { tools: optionsTools as any } : {}),
              ...previous,
            });

        const pendingToolCalls = new Map<
          string,
          { id: string; name: string; arguments: Record<string, unknown> }
        >();

        let currentInteractionId = previousInteractionId;
        let requiresAction = false;
        let finalTokens: { input?: number; output?: number; status?: string } = {};

        for await (const event of stream as any) {
          const evtAny = event as any;
          if (evtAny.interaction?.id) {
            currentInteractionId = evtAny.interaction.id;
          }

          if (evtAny.interaction?.status === "requires_action") {
            requiresAction = true;
          }

          // Extract function call steps from status updates or lifecycle events.
          // IMPORTANT: only capture calls whose names are registered in our MCP toolLookup.
          // Antigravity emits function_call steps for its own internal tools (bash, web search,
          // etc.) that are managed server-side. Intercepting and submitting results for those
          // call IDs causes the API to return 400 "invalid argument".
          const steps = (evtAny.interaction?.steps || []) as Array<{
            type?: string;
            id?: string;
            name?: string;
            arguments?: Record<string, unknown>;
          }>;
          for (const s of steps) {
            if (
              s.type === "function_call" &&
              s.id &&
              s.name &&
              (mcpSession?.toolLookup.has(s.name) || inProcessGwLookup.has(s.name))
            ) {
              pendingToolCalls.set(s.id, {
                id: s.id,
                name: s.name,
                arguments: s.arguments || {},
              });
            }
          }

          switch (event.event_type) {
            case "interaction.created": {
              if (currentInteractionId && toolTurn === 0) {
                sawProgress = true;
                yield { type: "created", conversationId: currentInteractionId };
              }
              break;
            }
            case "step.start":
            case "step.stop": {
              const s = evtAny.step;
              if (
                s &&
                s.type === "function_call" &&
                s.id &&
                s.name &&
                (mcpSession?.toolLookup.has(s.name) || inProcessGwLookup.has(s.name))
              ) {
                pendingToolCalls.set(s.id, {
                  id: s.id,
                  name: s.name,
                  arguments: s.arguments || {},
                });
              }
              break;
            }
            case "step.delta": {
              const delta = event.delta as any;
              if (!delta || typeof delta !== "object") break;
              if (delta.type === "text" && typeof delta.text === "string") {
                sawProgress = true;
                yield { type: "text", text: delta.text };
                break;
              }
              const thought = thoughtSummaryText(delta);
              if (thought) {
                sawProgress = true;
                yield { type: "thinking", text: thought };
                break;
              }
              if (
                delta.type === "function_call" &&
                delta.id &&
                delta.name &&
                (mcpSession?.toolLookup.has(delta.name) || inProcessGwLookup.has(delta.name))
              ) {
                pendingToolCalls.set(delta.id, {
                  id: delta.id,
                  name: delta.name,
                  arguments: delta.arguments || {},
                });
              }
              break;
            }
            case "interaction.completed": {
              const interaction = event.interaction as any;
              finalTokens = {
                status: interaction?.status,
                input: interaction?.usage?.total_input_tokens,
                output: interaction?.usage?.total_output_tokens,
              };
              if (interaction?.status === "requires_action") {
                requiresAction = true;
              }
              if (interaction?.status === "terminated" && previousInteractionId && !sawProgress) {
                // Stale interaction chain — set retriable so we retry fresh
                lastError = "terminated";
                retriable = "Retrying as fresh conversation after terminated";
                console.warn("[createInteractionStream:retry] Agent terminated stale chain, will retry fresh.");
              }
              break;
            }
            case "error": {
              const messageText =
                evtAny.error && typeof evtAny.error.message === "string"
                  ? evtAny.error.message
                  : "Google AI stream error.";
              lastError = messageText;
              if (!sawProgress && isRetriableGoogleError(messageText)) {
                retriable = messageText;
              } else {
                yield { type: "error", error: messageText };
                return;
              }
              break;
            }
            default:
              break;
          }
          if (retriable) break;
        }

        if (retriable) break;

        // Only proceed with tool-result round-trip when the model actually emitted calls.
        // Checking requiresAction alone is insufficient — it can be set without any captured
        // function_call steps, which would submit empty input and loop up to MAX_TOOL_TURNS.
        if (pendingToolCalls.size > 0) {
          if (!currentInteractionId) {
            yield { type: "error", error: "Tool call requested without interaction id." };
            return;
          }

          previousInteractionId = currentInteractionId;
          const functionResultSteps: Array<{
            type: "function_result";
            call_id: string;
            name: string;
            result: string;
            is_error: boolean;
          }> = [];

          for (const tc of pendingToolCalls.values()) {
            // Determine if this is an in-process GW tool or an MCP pool tool
            const isInProcessGw = inProcessGwLookup.has(tc.name);
            const gwToolName = inProcessGwLookup.get(tc.name);
            const mcpLookup = mcpSession?.toolLookup.get(tc.name);
            const slug = isInProcessGw ? "internal_google_workspace" : (mcpLookup?.slug || "unknown");
            const toolName = isInProcessGw ? (gwToolName || tc.name) : (mcpLookup?.toolName || tc.name);

            yield { type: "tool_call", slug, toolName };

            let result: ExecuteToolResult;
            if (isInProcessGw && inProcessGwExecutor && gwToolName) {
              result = await inProcessGwExecutor(gwToolName, tc.arguments);
            } else if (mcpSession) {
              result = await executeMcpTool(mcpSession, tc.name, tc.arguments);
            } else {
              result = { ok: false, content: "No active session" };
            }

            yield { type: "tool_result", slug, toolName, ok: result.ok };

            functionResultSteps.push({
              type: "function_result",
              call_id: tc.id,
              name: tc.name,
              result: formatToolResult(result.content) as any,
              is_error: !result.ok,
            });
          }

          currentInput = functionResultSteps;
          toolTurn++;
          continue;
        }

        // No tools called -> completion reached
        if (!currentInteractionId) {
          lastError = "Google AI completed without an interaction id.";
          retriable = isRetriableGoogleError(lastError) ? lastError : null;
          if (!retriable) {
            yield { type: "error", error: lastError };
            return;
          }
          break;
        }

        completed = true;
        yield {
          type: "completed",
          conversationId: currentInteractionId,
          status: finalTokens.status,
          inputTokens: finalTokens.input,
          outputTokens: finalTokens.output,
        };
        break;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Google AI stream failed.";
      const errAny = error as any;
      const details = errAny?.body || errAny?.error || errAny?.details || errAny?.response?.data;
      const detailStr = details ? (typeof details === "string" ? details : JSON.stringify(details)) : "";
      const toolNames = optionsTools?.map((t) => t.name) ?? [];
      console.error(
        "[createInteractionStream:error]",
        errMsg,
        "tools:",
        JSON.stringify(toolNames),
        detailStr ? `details: ${detailStr}` : ""
      );
      lastError = detailStr && detailStr !== "{}" ? `${errMsg} (${detailStr.slice(0, 300)})` : errMsg;
      if (!sawProgress && isRetriableGoogleError(lastError)) {
        retriable = lastError;
      } else if (!sawProgress && previousInteractionId && /invalid argument|invalid_request|400/i.test(lastError)) {
        console.warn(
          "[createInteractionStream:retry]",
          `Retrying clean turn without previousInteractionId after 400 error: ${lastError}`
        );
        previousInteractionId = undefined;
        retriable = "Retrying without stale previousInteractionId";
      } else if (!sawProgress && previousInteractionId && isTerminatedError(lastError)) {
        console.warn(
          "[createInteractionStream:retry]",
          `Agent terminated stale interaction chain — retrying as fresh conversation: ${lastError}`
        );
        previousInteractionId = undefined;
        retriable = "Retrying as fresh conversation after terminated";
      } else {
        yield { type: "error", error: lastError };
        return;
      }
    }

    if (completed) return;

    if (!retriable || attempt === MAX_ATTEMPTS - 1) {
      yield { type: "error", error: lastError };
      return;
    }

    // Extract suggested retry delay from message (e.g. "Please retry in 7.120732142s") or use exponential backoff
    let retryDelayMs = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
    const match = retriable.match(/retry in ([0-9.]+)s/i);
    if (match && match[1]) {
      const parsedSeconds = parseFloat(match[1]);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        // Wait requested seconds plus 500ms buffer, capped at 20 seconds per attempt
        retryDelayMs = Math.min(parsedSeconds * 1000 + 500, 20000);
      }
    }

    console.log(
      "[createInteractionStream:retry] Retrying attempt %d after %dms due to: %s",
      attempt + 1,
      Math.round(retryDelayMs),
      retriable.slice(0, 150)
    );
    yield {
      type: "thinking",
      text: `Rate limit hit or temporary API issue. Automatically retrying in ${Math.ceil(retryDelayMs / 1000)}s...`,
    };
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));

    previousInteractionId = undefined;
  }
}

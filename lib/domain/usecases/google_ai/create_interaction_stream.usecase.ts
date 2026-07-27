import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import pdfParse from "pdf-parse";
import type {
  CreateInteractionInput,
  GoogleAiStreamEvent,
} from "@/lib/entities/google_ai.type";
import {
  GOOGLE_AI_AGENTS,
  GOOGLE_AI_DEFAULT_MODEL,
} from "@/lib/entities/google_ai.type";
import {
  getRecentCalendarEventsService,
  getRecentEmailsService,
  runWorkspaceChatToolService,
} from "@/lib/domain/services/google_workspace_auth.service";
import { connectMcpServers, executeMcpTool, sanitizeJsonSchema, type McpRuntimeSession, type ExecuteToolResult } from "@/lib/domain/services/mcp_runtime.service";
import { getGoogleWorkspaceAuth } from "@/lib/domain/usecases/google_workspace_auth/get_google_workspace_auth.usecase";
import { getSession } from "../auth/get_session.usecase";
import { getProfile } from "../profile/get_profile.usecase";
import {
  sendGmailMessageUseCase,
} from "@/lib/domain/usecases/mcp_google_workspace/gmail.usecases";
import {
  createCalendarEventUseCase,
  updateCalendarEventUseCase,
  deleteCalendarEventUseCase
} from "@/lib/domain/usecases/mcp_google_workspace/calendar.usecases";
import { refreshAndGetAccessToken } from "@/lib/domain/usecases/google_workspace_auth/refresh_and_get_access_token.usecase";
import { listConversationMessages } from "@/lib/domain/usecases/ai/list_conversation_messages.usecase";

const AGENT_TIMEOUT_MS = 300_000;
const MAX_ATTEMPTS = 4;
const WORKSPACE_SLUG = "google-workspace";

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

function formatToolResult(contentStr: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(contentStr);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : { value: parsed };
  } catch {
    return { content: contentStr };
  }
}

/** Detect read intents that we can satisfy without Gemini function-calling. */
/**
 * Interactions API client tools corrupt the chain (`500 Unrecoverable data loss`)
 * when function results are submitted. Prefetch Workspace reads in-process and
 * inject them into the user message, then stream a normal (tool-free) reply.
 */
async function* injectWorkspaceContext(
  userId: string,
  message: string,
  apiKey: string,
): AsyncGenerator<GoogleAiStreamEvent, string> {
  const ai = new GoogleGenAI({ apiKey });
  
  let funcCallName: string | undefined;
  let args: Record<string, any> = {};

  if (!message) {
    return message;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: "You are a smart reading assistant. Determine if the user wants to fetch Workspace data (emails, calendar events, or connection status). If so, call the corresponding search tool. If not, output nothing.",
        tools: [{
          functionDeclarations: [
            { name: "search_emails", description: "Search for emails in the user's inbox based on a query.", parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: "Gmail search query (e.g. 'from:john yesterday')" } } } },
            { name: "search_calendar_events", description: "Search for upcoming calendar events based on a query.", parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: "Calendar search query" } } } },
            { name: "check_workspace_status", description: "Check if the user is connected to Google Workspace." }
          ]
        }]
      }
    });
    const funcCall = response.functionCalls?.[0];
    if (funcCall && funcCall.name) {
      funcCallName = funcCall.name;
      args = funcCall.args as any || {};
    }
  } catch (err) {
    console.error("Mini-AI smart reading failed:", err);
  }

  if (!funcCallName) {
    return message;
  }

  yield {
    type: "thinking",
    text: "Fetching Google Workspace data…\n",
  };

  const blocks: string[] = [];

  if (funcCallName === "check_workspace_status") {
    yield { type: "tool_call", slug: WORKSPACE_SLUG, toolName: "workspace_status" };
    try {
      const data = await runWorkspaceChatToolService(userId, "workspace_status", {});
      blocks.push(`## Workspace status\n${JSON.stringify(data, null, 2)}`);
      yield { type: "tool_result", slug: WORKSPACE_SLUG, toolName: "workspace_status", ok: true };
    } catch (error) {
      const err = error instanceof Error ? error.message : "workspace_status failed";
      blocks.push(`## Workspace status\nError: ${err}`);
      yield { type: "tool_result", slug: WORKSPACE_SLUG, toolName: "workspace_status", ok: false };
    }
  }

  if (funcCallName === "search_emails") {
    yield { type: "tool_call", slug: WORKSPACE_SLUG, toolName: "list_recent_emails" };
    try {
      const emails = await getRecentEmailsService(userId, args.query);
      blocks.push(`## Recent emails (Query: ${args.query || 'none'})\n${JSON.stringify(emails, null, 2)}`);
      yield { type: "tool_result", slug: WORKSPACE_SLUG, toolName: "list_recent_emails", ok: true };
    } catch (error) {
      const err = error instanceof Error ? error.message : "list_recent_emails failed";
      blocks.push(`## Recent emails\nError: ${err}`);
      yield { type: "tool_result", slug: WORKSPACE_SLUG, toolName: "list_recent_emails", ok: false };
    }
  }

  if (funcCallName === "search_calendar_events") {
    yield { type: "tool_call", slug: WORKSPACE_SLUG, toolName: "list_upcoming_calendar_events" };
    try {
      const events = await getRecentCalendarEventsService(userId, args.query);
      blocks.push(`## Calendar events (Query: ${args.query || 'none'})\n${JSON.stringify(events, null, 2)}`);
      yield { type: "tool_result", slug: WORKSPACE_SLUG, toolName: "list_upcoming_calendar_events", ok: true };
    } catch (error) {
      const err = error instanceof Error ? error.message : "list_upcoming_calendar_events failed";
      blocks.push(`## Upcoming calendar events\nError: ${err}`);
      yield { type: "tool_result", slug: WORKSPACE_SLUG, toolName: "list_upcoming_calendar_events", ok: false };
    }
  }

  if (blocks.length === 0) return message;

  return [
    message,
    "",
    "---",
    "Google Workspace data was fetched server-side for this turn.",
    "Answer using it. Do not claim you lack Gmail/Calendar access.",
    "",
    ...blocks,
  ].join("\n");
}



/** Yields normalized thinking / text / lifecycle events from Interactions SSE (no remote MCP). */
export async function* createInteractionStream(
  input: CreateInteractionInput,
): AsyncGenerator<GoogleAiStreamEvent> {
  let message = input.message.trim();
  const hasFiles = Array.isArray(input.files) && input.files.length > 0;
  if (!message && !hasFiles) {
    yield { type: "error", error: "Message or file is required." };
    return;
  }

  let apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  const session = await getSession();
  if (session?.user?.id) {
    const profile = await getProfile(session.user.id);
    if (profile.settings?.geminiApiKey) {
      apiKey = profile.settings.geminiApiKey;
    } else if (profile.team?.geminiApiKey) {
      apiKey = profile.team.geminiApiKey;
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

  let hasWorkspaceAuth = false;
  // In-process Workspace only — never connect remote MCP (erpnext SSE/HTTP) for Gemini.
  if (input.userId) {
    try {
      const auth = await getGoogleWorkspaceAuth(input.userId);
      if (auth.isConnected) {
        hasWorkspaceAuth = true;
        message = yield* injectWorkspaceContext(input.userId, message, apiKey);
      }
    } catch (err) {
      console.warn("Failed to check Google Workspace Auth:", err);
    }
  }

  let mcpSession: McpRuntimeSession | undefined;
  let optionsTools: Array<{ type: "function"; name: string; description?: string; parameters?: unknown }> | undefined;
  const mcpServersList = Array.isArray(input.mcpServers) ? [...input.mcpServers] : [];

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
  }

  let modifiedSystemInstruction = input.systemInstruction;
  const inProcessGwLookup = new Set<string>();
  const inProcessGwReadLookup = new Set<string>();

  if (hasWorkspaceAuth) {
    const gwWriteFunctions = [
      { name: "send_email", description: "Send an email directly. Ask for missing details.", parameters: { type: Type.OBJECT, properties: { to: { type: Type.STRING }, subject: { type: Type.STRING }, body: { type: Type.STRING } }, required: ["to", "subject", "body"] } },
      { name: "create_calendar_event", description: "Create a Google Calendar event on the primary calendar.", parameters: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, description: { type: Type.STRING }, start: { type: Type.STRING }, end: { type: Type.STRING }, addGoogleMeet: { type: Type.BOOLEAN } }, required: ["summary", "start", "end"] } },
      { name: "update_calendar_event", description: "Update an existing Google Calendar event.", parameters: { type: Type.OBJECT, properties: { eventId: { type: Type.STRING }, summary: { type: Type.STRING }, description: { type: Type.STRING }, start: { type: Type.STRING }, end: { type: Type.STRING } }, required: ["eventId"] } },
      { name: "delete_calendar_event", description: "Delete/cancel a Google Calendar event.", parameters: { type: Type.OBJECT, properties: { eventId: { type: Type.STRING } }, required: ["eventId"] } }
    ];
    
    for (const gw of gwWriteFunctions) {
      inProcessGwLookup.add(gw.name);
    }
    
    const gwReadFunctions = [
      { name: "search_emails", description: "Search for emails in the user's inbox based on a query.", parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: "Gmail search query (e.g. 'from:john yesterday')" } } } },
      { name: "search_calendar_events", description: "Search for upcoming calendar events based on a query.", parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: "Calendar search query" } } } },
      { name: "check_workspace_status", description: "Check if the user is connected to Google Workspace." }
    ];
    
    for (const gw of gwReadFunctions) {
      inProcessGwReadLookup.add(gw.name);
    }
    
    optionsTools = [
      ...(optionsTools ?? []),
      ...gwWriteFunctions.map(t => ({ type: "function" as const, ...t })),
      ...gwReadFunctions.map(t => ({ type: "function" as const, ...t }))
    ];

    modifiedSystemInstruction = [
      modifiedSystemInstruction || "",
      "You have access to Google Workspace tools. If you need to perform an action (e.g., send an email or create an event), you MUST ask the user for any missing parameters first. Once you have all the parameters, you MUST output a conversational confirmation message (e.g. 'Sure, I am sending the email now.') BEFORE emitting the tool call.",
      "When displaying calendar events to the user, you MUST format each event as a JSON code block with the language set to `event`. For example:\n```event\n{ \"summary\": \"Team Meeting\", \"start\": \"2024-05-20T10:00:00Z\", \"end\": \"2024-05-20T11:00:00Z\", \"htmlLink\": \"https://calendar.google.com/...\" }\n```\nIf there are multiple events, you may output an array of objects inside a single `event` code block. Do NOT use markdown tables or bulleted lists to display events."
    ].filter(Boolean).join("\n\n");
  }

  const MAX_TOOL_TURNS = 10;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let sawProgress = false;
    let completed = false;
    let retriable: string | null = null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      let currentInput: unknown = message;
      
      if (input.files && input.files.length > 0) {
        const parts: any[] = [];
        if (message) {
          parts.push({ type: "text", text: message });
        }
        
        const mappedFiles = await Promise.all(
          input.files.map(async (f) => {
            const mime = f.mimeType.toLowerCase();
            const data = f.base64Data.includes(",") ? f.base64Data.split(",")[1] : f.base64Data;
            
            if (mime.startsWith("image/")) return { type: "image", mime_type: mime, data };
            if (mime.startsWith("video/")) return { type: "video", mime_type: mime, data };
            if (mime.startsWith("audio/")) return { type: "audio", mime_type: mime, data };
            
            if (mime === "application/pdf") {
              try {
                const pdfBuffer = Buffer.from(data, "base64");
                const parsed = await pdfParse(pdfBuffer);
                return { type: "text", text: `[File: ${f.name}]\n${parsed.text}` };
              } catch (e) {
                console.warn(`Failed to parse PDF ${f.name}:`, e);
              }
            }
            
            // Try to decode unknown or text files as text to prevent API errors
            try {
              const textStr = Buffer.from(data, "base64").toString("utf-8");
              if (!textStr.includes("\u0000")) {
                return { type: "text", text: `[File: ${f.name}]\n${textStr}` };
              }
            } catch (e) {
              // ignore
            }
            
            // Fallback
            return { type: "document", mime_type: mime || "application/octet-stream", data };
          })
        );
        parts.push(...mappedFiles);
        currentInput = [{
          role: "user",
          content: parts,
        }];
      }
      
      let toolTurn = 0;

      while (toolTurn < MAX_TOOL_TURNS && !completed) {
        const previous = previousInteractionId
          ? { previous_interaction_id: previousInteractionId }
          : {};

        const stream = isAgent
          ? await ai.interactions.create(
              {
                agent: modelOrAgent,
                input: currentInput as any,
                environment: "remote",
                stream: true,
                agent_config: { type: "dynamic", thinking_summaries: "auto" },
                ...(modifiedSystemInstruction
                  ? { system_instruction: modifiedSystemInstruction }
                  : {}),
                ...(optionsTools ? { tools: optionsTools as any } : {}),
                ...previous,
              },
              { timeout: AGENT_TIMEOUT_MS },
            )
          : await ai.interactions.create({
              model: modelOrAgent,
              input: currentInput as any,
              stream: true,
              ...(modifiedSystemInstruction
                ? { system_instruction: modifiedSystemInstruction }
                : {}),
              ...(optionsTools ? { tools: optionsTools as any } : {}),
              ...previous,
            });

        let currentInteractionId = previousInteractionId;
        let finalTokens: { input?: number; output?: number; status?: string } = {};
        const pendingToolCalls: Array<{ id: string, name: string; args: any }> = [];

        for await (const event of stream as AsyncIterable<{
          event_type?: string;
          interaction?: {
            id?: string;
            status?: string;
            steps?: any[];
            usage?: { total_input_tokens?: number; total_output_tokens?: number };
          };
          delta?: { type: string; id?: string; name?: string; arguments?: any; content?: unknown; text?: string };
          error?: { message?: string };
        }>) {
          const evtAny = event as {
            interaction?: { id?: string; status?: string };
            error?: { message?: string };
          };
          if (evtAny.interaction?.id) {
            currentInteractionId = evtAny.interaction.id;
          }

          switch (event.event_type) {
            case "interaction.created": {
              if (currentInteractionId) {
                sawProgress = true;
                yield { type: "created", conversationId: currentInteractionId };
              }
              break;
            }
            case "step.start": {
              const step = (event as any).step;
              if (
                step?.type === "function_call" &&
                step.id &&
                step.name &&
                (mcpSession?.toolLookup.has(step.name) || inProcessGwLookup.has(step.name) || inProcessGwReadLookup.has(step.name))
              ) {
                // Ensure we don't duplicate if it also comes in delta
                if (!pendingToolCalls.find(t => t.id === step.id)) {
                  pendingToolCalls.push({ id: step.id, name: step.name, args: step.arguments || {} });
                }
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
                (mcpSession?.toolLookup.has(delta.name) || inProcessGwLookup.has(delta.name) || inProcessGwReadLookup.has(delta.name))
              ) {
                const existing = pendingToolCalls.find(t => t.id === delta.id);
                if (existing) {
                  existing.args = delta.arguments || {};
                } else {
                  pendingToolCalls.push({ id: delta.id, name: delta.name, args: delta.arguments || {} });
                }
              }
              break;
            }
            case "interaction.completed": {
              const interaction = event.interaction;
              finalTokens = {
                status: interaction?.status,
                input: interaction?.usage?.total_input_tokens,
                output: interaction?.usage?.total_output_tokens,
              };
              
              // Fallback: capture function_calls from completed interaction if we missed them
              if (interaction?.steps && Array.isArray(interaction.steps)) {
                for (const step of interaction.steps) {
                  if (
                    step.type === "function_call" &&
                    step.id &&
                    step.name &&
                    (mcpSession?.toolLookup.has(step.name) || inProcessGwLookup.has(step.name) || inProcessGwReadLookup.has(step.name))
                  ) {
                    const existing = pendingToolCalls.find(t => t.id === step.id);
                    if (existing) {
                      existing.args = step.arguments || {};
                    } else {
                      pendingToolCalls.push({ id: step.id, name: step.name, args: step.arguments || {} });
                    }
                  }
                }
              }
              
              if (interaction?.status === "terminated" && previousInteractionId && !sawProgress) {
                lastError = "terminated";
                retriable = "Retrying as fresh conversation after terminated";
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

        if (pendingToolCalls.length > 0) {
          if (!currentInteractionId) {
            yield { type: "error", error: "Tool call requested without interaction id." };
            return;
          }
          previousInteractionId = currentInteractionId;

          const requiresConfirmationCalls = pendingToolCalls.filter(c => inProcessGwLookup.has(c.name));
          const gwCalls = requiresConfirmationCalls;
          const gwReadCalls = pendingToolCalls.filter(c => inProcessGwReadLookup.has(c.name));
          const mcpCalls = pendingToolCalls.filter(c => !requiresConfirmationCalls.includes(c) && !gwReadCalls.includes(c) && mcpSession?.toolLookup.has(c.name));

          if (gwCalls.length > 0) {
            for (const call of pendingToolCalls) {
              const isGw = inProcessGwLookup.has(call.name);
              
              if (isGw) {
                yield { 
                  type: "requires_confirmation", 
                  slug: WORKSPACE_SLUG, 
                  toolName: call.name, 
                  args: call.args 
                };
              } else if (mcpSession) {
                const mcpLookup = mcpSession.toolLookup.get(call.name);
                const slug = mcpLookup?.slug || "unknown";
                const toolName = mcpLookup?.toolName || call.name;
                yield { type: "tool_call", slug, toolName };
                const result = await executeMcpTool(mcpSession, call.name, call.args);
                yield { type: "tool_result", slug, toolName, ok: result.ok };
              }
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
          } else if (mcpCalls.length > 0 || gwReadCalls.length > 0) {
            const functionResultSteps: Array<{
              type: "function_result";
              call_id: string;
              name: string;
              result: Record<string, unknown>;
              is_error: boolean;
            }> = [];
            
            for (const call of gwReadCalls) {
              yield { type: "tool_call", slug: WORKSPACE_SLUG, toolName: call.name };
              let result = { ok: false, content: "" };
              try {
                if (call.name === "search_emails") {
                  const emails = await getRecentEmailsService(input.userId!, call.args.query);
                  result = { ok: true, content: JSON.stringify(emails, null, 2) };
                } else if (call.name === "search_calendar_events") {
                  const events = await getRecentCalendarEventsService(input.userId!, call.args.query);
                  result = { ok: true, content: JSON.stringify(events, null, 2) };
                } else if (call.name === "check_workspace_status") {
                  const data = await runWorkspaceChatToolService(input.userId!, "workspace_status", {});
                  result = { ok: true, content: JSON.stringify(data, null, 2) };
                }
              } catch (e) {
                result = { ok: false, content: String(e) };
              }
              
              yield { type: "tool_result", slug: WORKSPACE_SLUG, toolName: call.name, ok: result.ok };
              
              functionResultSteps.push({
                type: "function_result",
                call_id: call.id,
                name: call.name,
                result: { content: result.content },
                is_error: !result.ok,
              });
            }
            
            if (mcpSession) {
              for (const call of mcpCalls) {
                const mcpLookup = mcpSession.toolLookup.get(call.name);
                const slug = mcpLookup?.slug || "unknown";
                const toolName = mcpLookup?.toolName || call.name;
                
                yield { type: "tool_call", slug, toolName };
                const result = await executeMcpTool(mcpSession, call.name, call.args);
                yield { type: "tool_result", slug, toolName, ok: result.ok };
                
                functionResultSteps.push({
                  type: "function_result",
                  call_id: call.id,
                  name: call.name,
                  result: { content: result.content },
                  is_error: !result.ok,
                });
              }
            }
            
            currentInput = functionResultSteps;
            toolTurn++;
            continue;
          }
        }

        if (retriable) {
          // fall through
        } else if (!currentInteractionId) {
          lastError = "Google AI completed without an interaction id.";
          retriable = isRetriableGoogleError(lastError) ? lastError : null;
          if (!retriable) {
            yield { type: "error", error: lastError };
            return;
          }
        } else {
          completed = true;
          yield {
            type: "completed",
            conversationId: currentInteractionId,
            status: finalTokens.status,
            inputTokens: finalTokens.input,
            outputTokens: finalTokens.output,
          };
          return;
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Google AI stream failed.";
      lastError = errMsg;
      if (!sawProgress && isRetriableGoogleError(lastError)) {
        retriable = lastError;
      } else if (
        !sawProgress &&
        previousInteractionId &&
        /invalid argument|invalid_request|400|unrecoverable data loss/i.test(lastError)
      ) {
        previousInteractionId = undefined;
        retriable = "Retrying without stale previousInteractionId";
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

    let retryDelayMs = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
    const match = retriable.match(/retry in ([0-9.]+)s/i);
    if (match?.[1]) {
      const parsedSeconds = parseFloat(match[1]);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        retryDelayMs = Math.min(parsedSeconds * 1000 + 500, 20000);
      }
    }

    yield {
      type: "thinking",
      text: `Temporary API issue. Retrying in ${Math.ceil(retryDelayMs / 1000)}s...`,
    };
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    previousInteractionId = undefined;
  }
}

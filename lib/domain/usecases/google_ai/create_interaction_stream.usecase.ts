import { GoogleGenAI, Type } from "@google/genai";
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

/** Detect read intents that we can satisfy without Gemini function-calling. */
function workspaceReadIntent(message: string): {
  email: boolean;
  calendar: boolean;
  status: boolean;
} {
  const m = message.toLowerCase();
  const calendar = /\b(calendar|events?|meetings?|schedule|agenda|appointments?)\b/.test(m);
  const email =
    /\b(email|emails|inbox|gmail|mails?|messages?)\b/.test(m) ||
    (/\b(latest|recent|unread)\b/.test(m) && !calendar);
  const status = /\b(workspace status|am i connected|connection status)\b/.test(m);
  return { email, calendar, status };
}

/**
 * Interactions API client tools corrupt the chain (`500 Unrecoverable data loss`)
 * when function results are submitted. Prefetch Workspace reads in-process and
 * inject them into the user message, then stream a normal (tool-free) reply.
 */
async function* injectWorkspaceContext(
  userId: string,
  message: string,
): AsyncGenerator<GoogleAiStreamEvent, string> {
  const intent = workspaceReadIntent(message);
  if (!intent.email && !intent.calendar && !intent.status) {
    return message;
  }

  yield {
    type: "thinking",
    text: "Fetching Google Workspace data…\n",
  };

  const blocks: string[] = [];

  if (intent.status) {
    yield { type: "tool_call", slug: WORKSPACE_SLUG, toolName: "workspace_status" };
    try {
      const data = await runWorkspaceChatToolService(userId, "workspace_status", {});
      blocks.push(`## Workspace status\n${JSON.stringify(data, null, 2)}`);
      yield {
        type: "tool_result",
        slug: WORKSPACE_SLUG,
        toolName: "workspace_status",
        ok: true,
      };
    } catch (error) {
      const err = error instanceof Error ? error.message : "workspace_status failed";
      blocks.push(`## Workspace status\nError: ${err}`);
      yield {
        type: "tool_result",
        slug: WORKSPACE_SLUG,
        toolName: "workspace_status",
        ok: false,
      };
    }
  }

  if (intent.email) {
    yield { type: "tool_call", slug: WORKSPACE_SLUG, toolName: "list_recent_emails" };
    try {
      const emails = await getRecentEmailsService(userId);
      blocks.push(`## Recent emails\n${JSON.stringify(emails, null, 2)}`);
      yield {
        type: "tool_result",
        slug: WORKSPACE_SLUG,
        toolName: "list_recent_emails",
        ok: true,
      };
    } catch (error) {
      const err = error instanceof Error ? error.message : "list_recent_emails failed";
      blocks.push(`## Recent emails\nError: ${err}`);
      yield {
        type: "tool_result",
        slug: WORKSPACE_SLUG,
        toolName: "list_recent_emails",
        ok: false,
      };
    }
  }

  if (intent.calendar) {
    yield {
      type: "tool_call",
      slug: WORKSPACE_SLUG,
      toolName: "list_upcoming_calendar_events",
    };
    try {
      const events = await getRecentCalendarEventsService(userId);
      blocks.push(`## Upcoming calendar events\n${JSON.stringify(events, null, 2)}`);
      yield {
        type: "tool_result",
        slug: WORKSPACE_SLUG,
        toolName: "list_upcoming_calendar_events",
        ok: true,
      };
    } catch (error) {
      const err =
        error instanceof Error ? error.message : "list_upcoming_calendar_events failed";
      blocks.push(`## Upcoming calendar events\nError: ${err}`);
      yield {
        type: "tool_result",
        slug: WORKSPACE_SLUG,
        toolName: "list_upcoming_calendar_events",
        ok: false,
      };
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
  if (!message) {
    yield { type: "error", error: "Message is required." };
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
        message = yield* injectWorkspaceContext(input.userId, message);
        // Stale agent chains break even without tools — start fresh after Workspace inject.
        previousInteractionId = undefined;
      }
    } catch (err) {
      console.warn("Failed to check Google Workspace Auth:", err);
    }
  }

  let toolsPayload = {};
  let modifiedSystemInstruction = input.systemInstruction;

  if (hasWorkspaceAuth) {
    toolsPayload = {
      tools: [{
        functionDeclarations: [
          { name: "send_email", description: "Send an email directly. Ask for missing details.", parameters: { type: Type.OBJECT, properties: { to: { type: Type.STRING }, subject: { type: Type.STRING }, body: { type: Type.STRING } }, required: ["to", "subject", "body"] } },
          { name: "create_calendar_event", description: "Create a Google Calendar event on the primary calendar.", parameters: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, description: { type: Type.STRING }, start: { type: Type.STRING }, end: { type: Type.STRING }, addGoogleMeet: { type: Type.BOOLEAN } }, required: ["summary", "start", "end"] } },
          { name: "update_calendar_event", description: "Update an existing Google Calendar event.", parameters: { type: Type.OBJECT, properties: { eventId: { type: Type.STRING }, summary: { type: Type.STRING }, description: { type: Type.STRING }, start: { type: Type.STRING }, end: { type: Type.STRING } }, required: ["eventId"] } },
          { name: "delete_calendar_event", description: "Delete/cancel a Google Calendar event.", parameters: { type: Type.OBJECT, properties: { eventId: { type: Type.STRING } }, required: ["eventId"] } }
        ]
      }]
    };
    modifiedSystemInstruction = [
      modifiedSystemInstruction || "",
      "You have access to Google Workspace tools. If you need to perform an action (e.g., send an email or create an event), you MUST ask the user for any missing parameters first. Once you have all the parameters, you MUST output a conversational confirmation message (e.g. 'Sure, I am sending the email now.') BEFORE emitting the tool call."
    ].filter(Boolean).join("\n\n");
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let sawProgress = false;
    let completed = false;
    let retriable: string | null = null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const previous = previousInteractionId
        ? { previous_interaction_id: previousInteractionId }
        : {};

      const stream = isAgent
        ? await ai.interactions.create(
            {
              agent: modelOrAgent,
              input: message,
              environment: "remote",
              stream: true,
              agent_config: { type: "dynamic", thinking_summaries: "auto" },
              ...(modifiedSystemInstruction
                ? { system_instruction: modifiedSystemInstruction }
                : {}),
              ...toolsPayload,
              ...previous,
            },
            { timeout: AGENT_TIMEOUT_MS },
          )
        : await ai.interactions.create({
            model: modelOrAgent,
            input: message,
            stream: true,
            ...(modifiedSystemInstruction
              ? { system_instruction: modifiedSystemInstruction }
              : {}),
            ...toolsPayload,
            ...previous,
          });

      let currentInteractionId = previousInteractionId;
      let finalTokens: { input?: number; output?: number; status?: string } = {};
      let toolCallExecuted = false;

      for await (const event of stream as AsyncIterable<{
        event_type?: string;
        interaction?: {
          id?: string;
          status?: string;
          usage?: { total_input_tokens?: number; total_output_tokens?: number };
        };
        delta?: { type: string; content?: unknown; text?: string };
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
            if (delta.type === "function_call" && delta.id && delta.name) {
              const funcCallName = delta.name;
              const args = delta.arguments || {};
              
              yield { type: "tool_call", slug: WORKSPACE_SLUG, toolName: funcCallName };
              
              try {
                const token = await refreshAndGetAccessToken(input.userId!);
                switch (funcCallName) {
                  case "send_email":
                    await sendGmailMessageUseCase(token, args.to, args.subject, args.body);
                    break;
                  case "create_calendar_event":
                    await createCalendarEventUseCase(token, args.summary, args.description || "", args.start, args.end, args.addGoogleMeet);
                    break;
                  case "update_calendar_event":
                    await updateCalendarEventUseCase(token, args.eventId, { summary: args.summary, description: args.description, start: args.start, end: args.end });
                    break;
                  case "delete_calendar_event":
                    await deleteCalendarEventUseCase(token, args.eventId);
                    break;
                  default:
                    throw new Error("Unknown tool called.");
                }
                yield { type: "tool_result", slug: WORKSPACE_SLUG, toolName: funcCallName, ok: true };
              } catch (err: any) {
                console.error(`Native tool call failed for ${funcCallName}:`, err);
                yield { type: "tool_result", slug: WORKSPACE_SLUG, toolName: funcCallName, ok: false };
              }
              
              toolCallExecuted = true;
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
        if (toolCallExecuted) break;
      }

      if (toolCallExecuted) {
        completed = true;
        yield {
          type: "completed",
          conversationId: currentInteractionId || "",
          status: finalTokens.status,
          inputTokens: finalTokens.input,
          outputTokens: finalTokens.output,
        };
        break; // break MAX_ATTEMPTS loop, effectively breaking the chain
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

import { auth } from "@/lib/domain/services/auth.service";
import { createCursorAgentStream } from "@/lib/domain/services/cursor.service";
import { insertAiMessage } from "@/lib/domain/services/ai_conversation.service";
import {
  GIYA_SYSTEM_CONTEXT,
  cleanupAiPrompt,
  usageFromApi,
} from "@/lib/domain/usecases/ai/prompt.usecase";
import { resolveApiKeySource } from "@/lib/domain/usecases/ai/resolve_api_key_source.usecase";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import { AI_PROVIDER, type AiKeySource } from "@/lib/entities/ai.type";
import type { CursorMcpServerConfig, CursorSkill } from "@/lib/entities/cursor.type";
import type { AiStreamClientEvent } from "@/lib/entities/google_ai.type";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

export const maxDuration = 300;

function parseKeySource(value: unknown): AiKeySource | undefined {
  if (value === "personal" || value === "team" || value === "system") return value;
  return undefined;
}

function sseLine(event: AiStreamClientEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  const action = "ai:stream:cursor";
  const permission = USER_PERMISSION.CURSOR_PROMPT;
  const encoder = new TextEncoder();

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }
    if (!hasPermission(userSession.user.permissions, permission)) {
      return Response.json(
        { ok: false, error: "You are not authorized for this action." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      message?: string;
      previousAgentId?: string;
      dbConversationId?: string;
      name?: string;
      email?: string;
      mcpServers?: Record<string, CursorMcpServerConfig>;
      skills?: CursorSkill[];
      files?: { name: string; mimeType: string; base64Data: string }[];
      keySource?: AiKeySource;
      modelId?: string;
    };
    const keySource = parseKeySource(body.keySource);

    const message = body.message?.trim() ?? "";
    const hasFiles = Array.isArray(body.files) && body.files.length > 0;
    if (!message && !hasFiles) {
      return Response.json({ ok: false, error: "Message or file is required." }, { status: 400 });
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: AiStreamClientEvent) => {
          controller.enqueue(encoder.encode(sseLine(event)));
        };

        let conversationId: string | undefined;
        let accumulated = "";
        let apiInputTokens: number | undefined;
        let apiOutputTokens: number | undefined;
        let failed = false;

        try {
          for await (const event of createCursorAgentStream({
            message: `${GIYA_SYSTEM_CONTEXT}\n\n${message}`,
            name: body.name,
            email: body.email,
            mcpServers: body.mcpServers,
            skills: body.skills,
            files: body.files,
            keySource,
            modelId: body.modelId,
            previousAgentId: body.previousAgentId,
          })) {
            if (event.type === "created") {
              conversationId = event.conversationId;
              send(event);
              continue;
            }
            if (event.type === "thinking" || event.type === "text") {
              if (event.type === "text") accumulated += event.text;
              send(event);
              continue;
            }
            if (
              event.type === "tool_warning" ||
              event.type === "tool_call" ||
              event.type === "tool_result" ||
              event.type === "requires_confirmation"
            ) {
              send(event);
              continue;
            }
            if (event.type === "error") {
              failed = true;
              send(event);
              await logAction({
                userId: userSession.user.id,
                action,
                success: false,
                error: event.error,
                role: userSession.user.role,
              });
              break;
            }
            if (event.type === "completed") {
              conversationId = event.conversationId;
              apiInputTokens = event.inputTokens;
              apiOutputTokens = event.outputTokens;
              send(event);

              const usage = usageFromApi({
                inputTokens: apiInputTokens,
                outputTokens: apiOutputTokens,
              });
              const cleaned = cleanupAiPrompt(accumulated, usage);
              const resolvedKeySource = await resolveApiKeySource(
                userSession.user.id,
                AI_PROVIDER.CURSOR,
                keySource,
              );

              const saved = await insertAiMessage({
                userId: userSession.user.id,
                conversationId: body.dbConversationId,
                content: message || (hasFiles ? `[Attached ${body.files?.length} file(s)]` : ""),
                aiFeedback: cleaned.content,
                usage,
                keySource: resolvedKeySource,
              });

              if (!saved.ok) {
                failed = true;
                send({ type: "error", error: saved.error });
                await logAction({
                  userId: userSession.user.id,
                  action,
                  success: false,
                  error: saved.error,
                  role: userSession.user.role,
                });
                break;
              }

              send({
                type: "done",
                conversationId: conversationId ?? saved.data.conversationId,
                dbConversationId: saved.data.conversationId,
                messageId: saved.data.messageId,
                text: cleaned.content,
                usage,
              });

              await logAction({
                userId: userSession.user.id,
                action,
                success: true,
                role: userSession.user.role,
                metadata: {
                  conversationId,
                  dbConversationId: saved.data.conversationId,
                  messageId: saved.data.messageId,
                  ...usage,
                },
              });
            }
          }

          if (!failed && !conversationId && !accumulated) {
            send({ type: "error", error: "Cursor stream ended with no response." });
          }
        } catch (error) {
          const errorText = error instanceof Error ? error.message : "Stream failed.";
          send({ type: "error", error: errorText });
          await logAction({
            userId: userSession.user.id,
            action,
            success: false,
            error: errorText,
            role: userSession.user.role,
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const errorText = error instanceof Error ? error.message : "Unexpected error.";
    await logAction({ userId: "unknown", action, success: false, error: errorText });
    return Response.json({ ok: false, error: errorText }, { status: 500 });
  }
}

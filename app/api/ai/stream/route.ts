import { auth } from "@/lib/domain/services/auth.service";
import { createInteractionStream } from "@/lib/domain/services/google_ai.service";
import { insertAiMessage } from "@/lib/domain/services/ai_conversation.service";
import {
  AI_USAGE_SYSTEM_PROMPT,
  cleanupAiPrompt,
} from "@/lib/domain/usecases/ai/prompt.usecase";
import { logAction } from "@/lib/domain/usecases/auth/log_action.usecase";
import type { AiStreamClientEvent } from "@/lib/entities/google_ai.type";
import { hasPermission, USER_PERMISSION } from "@/lib/entities/users.type";

export const maxDuration = 300;

function sseLine(event: AiStreamClientEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  const action = "ai:stream:google_ai";
  const permission = USER_PERMISSION.GOOGLE_AI_INTERACT;
  const encoder = new TextEncoder();

  try {
    const userSession = await auth();
    if (!userSession || userSession.expired) {
      return Response.json({ ok: false, error: "Authentication required." }, { status: 401 });
    }
    if (!hasPermission(userSession.user.role, permission)) {
      return Response.json(
        { ok: false, error: "You are not authorized for this action." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      message?: string;
      model?: string;
      previousInteractionId?: string;
      dbConversationId?: string;
      name?: string;
      email?: string;
    };

    const message = body.message?.trim() ?? "";
    if (!message) {
      return Response.json({ ok: false, error: "Message is required." }, { status: 400 });
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
          for await (const event of createInteractionStream({
            message,
            model: body.model,
            previousInteractionId: body.previousInteractionId,
            systemInstruction: AI_USAGE_SYSTEM_PROMPT,
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

              const cleaned = cleanupAiPrompt(accumulated);
              const usage = {
                inputTokens: apiInputTokens ?? cleaned.usage.inputTokens,
                outputTokens: apiOutputTokens ?? cleaned.usage.outputTokens,
                cost: cleaned.usage.cost,
              };

              const saved = await insertAiMessage({
                userId: userSession.user.id,
                conversationId: body.dbConversationId,
                content: message,
                aiFeedback: cleaned.content,
                usage,
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
            send({ type: "error", error: "Google AI stream ended with no response." });
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

import { eq } from "drizzle-orm";
import { database } from "@/database";
import { aiConversation, aiOutputCanvas } from "@/database/schema";
import { FRAPPE_TOOL_MODE } from "@/lib/entities/frappe_output.type";
import {
  newOutputCanvasId,
  titleFromOutputTarget,
  type OutputCanvasItem,
  type OutputCanvasResult,
  type UpsertOutputCanvasInput,
} from "@/lib/entities/output_canvas.type";
import type { FrappeToolMode } from "@/lib/entities/frappe_output.type";
import type { FrappeOutputTarget } from "@/lib/entities/frappe_output.type";

function rowToItem(row: {
  id: string;
  conversationId: string;
  toolMode: string;
  title: string;
  target: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}): OutputCanvasItem {
  return {
    id: row.id,
    conversationId: row.conversationId,
    toolMode: row.toolMode as FrappeToolMode,
    title: row.title,
    target: row.target as FrappeOutputTarget,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * One canvas per conversation: create on first tool output, update target thereafter.
 */
export async function upsertOutputCanvas(
  input: UpsertOutputCanvasInput,
): Promise<OutputCanvasResult<OutputCanvasItem>> {
  try {
    if (input.toolMode === FRAPPE_TOOL_MODE.OFF) {
      return { ok: false, error: "Canvas requires an active Frappe tool." };
    }
    if (!input.conversationId.trim() || !input.target?.kind) {
      return { ok: false, error: "conversationId and target are required." };
    }

    const [convo] = await database
      .select({ id: aiConversation.id, userId: aiConversation.userId })
      .from(aiConversation)
      .where(eq(aiConversation.id, input.conversationId))
      .limit(1);

    if (!convo || convo.userId !== input.userId) {
      return { ok: false, error: "Conversation not found." };
    }

    const title = (input.title?.trim() || titleFromOutputTarget(input.target)).slice(0, 255);
    const [existing] = await database
      .select()
      .from(aiOutputCanvas)
      .where(eq(aiOutputCanvas.conversationId, input.conversationId))
      .limit(1);

    if (existing) {
      await database
        .update(aiOutputCanvas)
        .set({
          toolMode: input.toolMode,
          title,
          target: input.target as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(aiOutputCanvas.id, existing.id));

      return {
        ok: true,
        data: rowToItem({
          ...existing,
          toolMode: input.toolMode,
          title,
          target: input.target as Record<string, unknown>,
          updatedAt: new Date(),
        }),
      };
    }

    const id = newOutputCanvasId();
    await database.insert(aiOutputCanvas).values({
      id,
      conversationId: input.conversationId,
      userId: input.userId,
      toolMode: input.toolMode,
      title,
      target: input.target as Record<string, unknown>,
    });

    const [created] = await database
      .select()
      .from(aiOutputCanvas)
      .where(eq(aiOutputCanvas.id, id))
      .limit(1);

    if (!created) return { ok: false, error: "Failed to create canvas." };
    return { ok: true, data: rowToItem(created) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save canvas.",
    };
  }
}

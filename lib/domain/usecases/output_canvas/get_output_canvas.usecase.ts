import { and, eq } from "drizzle-orm";
import { database } from "@/database";
import { aiOutputCanvas } from "@/database/schema";
import type { FrappeOutputTarget, FrappeToolMode } from "@/lib/entities/frappe_output.type";
import type { OutputCanvasItem, OutputCanvasResult } from "@/lib/entities/output_canvas.type";

function mapRow(row: typeof aiOutputCanvas.$inferSelect): OutputCanvasItem {
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

export async function getOutputCanvasById(
  userId: string,
  canvasId: string,
): Promise<OutputCanvasResult<OutputCanvasItem>> {
  try {
    const [row] = await database
      .select()
      .from(aiOutputCanvas)
      .where(and(eq(aiOutputCanvas.id, canvasId), eq(aiOutputCanvas.userId, userId)))
      .limit(1);
    if (!row) return { ok: false, error: "Canvas not found." };
    return { ok: true, data: mapRow(row) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load canvas.",
    };
  }
}

export async function getOutputCanvasByConversation(
  userId: string,
  conversationId: string,
): Promise<OutputCanvasResult<OutputCanvasItem | null>> {
  try {
    const [row] = await database
      .select()
      .from(aiOutputCanvas)
      .where(
        and(
          eq(aiOutputCanvas.conversationId, conversationId),
          eq(aiOutputCanvas.userId, userId),
        ),
      )
      .limit(1);
    return { ok: true, data: row ? mapRow(row) : null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load canvas.",
    };
  }
}

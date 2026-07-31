import { desc, eq } from "drizzle-orm";
import { database } from "@/database";
import { aiOutputCanvas } from "@/database/schema";
import type { FrappeOutputTarget, FrappeToolMode } from "@/lib/entities/frappe_output.type";
import type { OutputCanvasItem, OutputCanvasResult } from "@/lib/entities/output_canvas.type";

export async function listOutputCanvases(
  userId: string,
): Promise<OutputCanvasResult<OutputCanvasItem[]>> {
  try {
    const rows = await database
      .select()
      .from(aiOutputCanvas)
      .where(eq(aiOutputCanvas.userId, userId))
      .orderBy(desc(aiOutputCanvas.updatedAt));

    return {
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        conversationId: row.conversationId,
        toolMode: row.toolMode as FrappeToolMode,
        title: row.title,
        target: row.target as FrappeOutputTarget,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to list canvases.",
    };
  }
}

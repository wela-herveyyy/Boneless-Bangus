import { upsertOutputCanvas } from "@/lib/domain/usecases/output_canvas/upsert_output_canvas.usecase";
import { listOutputCanvases } from "@/lib/domain/usecases/output_canvas/list_output_canvases.usecase";
import {
  getOutputCanvasByConversation,
  getOutputCanvasById,
} from "@/lib/domain/usecases/output_canvas/get_output_canvas.usecase";
import type {
  OutputCanvasItem,
  OutputCanvasResult,
  UpsertOutputCanvasInput,
} from "@/lib/entities/output_canvas.type";

export async function upsertOutputCanvasService(
  input: UpsertOutputCanvasInput,
): Promise<OutputCanvasResult<OutputCanvasItem>> {
  return upsertOutputCanvas(input);
}

export async function listOutputCanvasesService(
  userId: string,
): Promise<OutputCanvasResult<OutputCanvasItem[]>> {
  return listOutputCanvases(userId);
}

export async function getOutputCanvasByIdService(
  userId: string,
  canvasId: string,
): Promise<OutputCanvasResult<OutputCanvasItem>> {
  return getOutputCanvasById(userId, canvasId);
}

export async function getOutputCanvasByConversationService(
  userId: string,
  conversationId: string,
): Promise<OutputCanvasResult<OutputCanvasItem | null>> {
  return getOutputCanvasByConversation(userId, conversationId);
}

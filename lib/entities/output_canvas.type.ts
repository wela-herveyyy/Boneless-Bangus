import type { FrappeOutputKind, FrappeOutputTarget } from "@/lib/entities/frappe_output.type";
import { FRAPPE_OUTPUT_KIND, FRAPPE_TOOL_MODE, type FrappeToolMode } from "@/lib/entities/frappe_output.type";

export type OutputCanvasResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type OutputCanvasItem = {
  /** Public canvas id — e.g. cv_a1b2c3d4 */
  id: string;
  conversationId: string;
  toolMode: FrappeToolMode;
  title: string;
  target: FrappeOutputTarget;
  createdAt: string;
  updatedAt: string;
};

export type UpsertOutputCanvasInput = {
  userId: string;
  conversationId: string;
  toolMode: FrappeToolMode;
  target: FrappeOutputTarget;
  title?: string;
};

/** Short pin-friendly id. */
export function newOutputCanvasId(): string {
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `cv_${hex}`;
}

export function frappeToolModeFromKind(kind: FrappeOutputKind): FrappeToolMode {
  if (kind === FRAPPE_OUTPUT_KIND.WEBFORM) return FRAPPE_TOOL_MODE.WEBFORM;
  if (kind === FRAPPE_OUTPUT_KIND.WEBPAGE) return FRAPPE_TOOL_MODE.WEBPAGE;
  if (kind === FRAPPE_OUTPUT_KIND.PRINT_FORMAT) return FRAPPE_TOOL_MODE.PRINT_FORMAT;
  return FRAPPE_TOOL_MODE.OFF;
}

export function titleFromOutputTarget(target: FrappeOutputTarget): string {
  return (
    target.title?.trim() ||
    target.format?.trim() ||
    target.name?.trim() ||
    target.route?.trim() ||
    "Untitled canvas"
  );
}

export function labelForCanvasTool(mode: FrappeToolMode): string {
  if (mode === FRAPPE_TOOL_MODE.WEBFORM) return "Web form";
  if (mode === FRAPPE_TOOL_MODE.WEBPAGE) return "Web page";
  if (mode === FRAPPE_TOOL_MODE.PRINT_FORMAT) return "Print format";
  if (mode === FRAPPE_TOOL_MODE.DOCUMENT_EDITOR) return "Document Editor";
  return "Output";
}

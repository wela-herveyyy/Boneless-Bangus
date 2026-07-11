import type { CursorMcpServerConfig, CursorSkill } from "@/lib/entities/cursor.type";
import type { GoogleAiModel } from "@/lib/entities/google_ai.type";

export type AiResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Add new providers here when integrating. */
export const AI_PROVIDER = {
  CURSOR: "cursor",
  GOOGLE_AI: "google_ai",
} as const;

export type AiProvider = (typeof AI_PROVIDER)[keyof typeof AI_PROVIDER];

export type PromptAiInput = {
  provider: AiProvider;
  message: string;
  name?: string;
  email?: string;
  /** Cursor — IndexedDB MCP / skills */
  mcpServers?: Record<string, CursorMcpServerConfig>;
  skills?: CursorSkill[];
  /** Google AI — Interactions API turn chain */
  previousInteractionId?: string;
  /** Google AI — model / agent id */
  model?: GoogleAiModel | string;
};

export type PromptAiOutput = {
  provider: AiProvider;
  text: string;
  /** Cursor requestId or Google interaction id — pass back for multi-turn. */
  conversationId?: string;
};

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

export type AiUsageMetrics = {
  inputTokens: number;
  outputTokens: number;
  cost: string;
};

export type AiConversationListItem = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
};

/** One DB row = one turn: user prompt + agent reply. */
export type AiMessageItem = {
  id: string;
  conversationId: string;
  /** User prompt. */
  content: string;
  /** Agent/model reply. */
  aiFeedback: string | null;
  rowPosition: number;
  inputTokens: number;
  outputTokens: number;
  cost: string;
  createdAt: string;
};

export type AiMessagePage = {
  items: AiMessageItem[];
  hasMore: boolean;
  /** Pass as `before` to load older turns. */
  nextBefore: number | null;
};

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
  /** DB ai_conversation.id — created on first message when omitted. */
  dbConversationId?: string;
};

export type PromptAiOutput = {
  provider: AiProvider;
  text: string;
  /** Cursor requestId or Google interaction id — pass back for multi-turn. */
  conversationId?: string;
  dbConversationId?: string;
  messageId?: string;
  usage?: AiUsageMetrics;
};

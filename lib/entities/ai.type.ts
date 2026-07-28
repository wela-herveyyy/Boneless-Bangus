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

/** Which API key funded a prompt turn. */
export type AiKeySource = "personal" | "team" | "system";

export function labelApiKeySource(source: AiKeySource | null | undefined): string {
  switch (source) {
    case "personal":
      return "Personal key";
    case "team":
      return "Team key";
    case "system":
      return "System key";
    default:
      return "Unknown key";
  }
}

export type AiConversationListItem = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  promptCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: string;
  /** Distinct key sources used across turns in this conversation. */
  keySources: AiKeySource[];
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
  keySource: AiKeySource | null;
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
  /** File attachments (PDFs and text files extracted as text; images skipped on Cursor path). */
  files?: { name: string; mimeType: string; base64Data: string }[];
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

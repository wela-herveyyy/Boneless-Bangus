export type GoogleAiResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const GOOGLE_AI_MODEL = {
  GEMMA_4_31B: "gemma-4-31b-it",
  ANTIGRAVITY: "antigravity-preview-05-2026",
} as const;

export type GoogleAiModel = (typeof GOOGLE_AI_MODEL)[keyof typeof GOOGLE_AI_MODEL];

export const GOOGLE_AI_DEFAULT_MODEL = GOOGLE_AI_MODEL.GEMMA_4_31B;

/** Agents use `agent` + remote env; models use `model`. */
export const GOOGLE_AI_AGENTS = new Set<string>([GOOGLE_AI_MODEL.ANTIGRAVITY]);

export const GOOGLE_AI_MODEL_OPTIONS: { value: GoogleAiModel; label: string }[] = [
  { value: GOOGLE_AI_MODEL.GEMMA_4_31B, label: "Gemma 4" },
  { value: GOOGLE_AI_MODEL.ANTIGRAVITY, label: "Antigravity" },
];

export type CreateInteractionInput = {
  message: string;
  model?: GoogleAiModel | string;
  /** Continue a stored conversation (Interactions API server state). */
  previousInteractionId?: string;
  systemInstruction?: string;
  /**
   * Interactions API client-side tools (function declarations).
   * When set with `executeTool`, the non-stream path loops on `requires_action`.
   */
  tools?: Array<{
    type: "function";
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  }>;
  /** Run a client-side tool by name; return JSON-serializable result. */
  executeTool?: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
  /** MCP server configs for the streaming tool pipeline. */
  mcpServers?: unknown[];
  /** Authenticated user id (used to inject in-process Google Workspace tools). */
  userId?: string;
};

export type ConnectWarning = {
  slug: string;
  reason: string;
};

export type CreateInteractionOutput = {
  id: string;
  text: string;
  status?: string;
  inputTokens?: number;
  outputTokens?: number;
};

/** Normalized events from Interactions API SSE (v1: thinking + text + tools). */
export type GoogleAiStreamEvent =
  | { type: "created"; conversationId: string }
  | { type: "thinking"; text: string }
  | { type: "text"; text: string }
  | { type: "tool_warning"; slug: string; reason: string }
  | { type: "tool_call"; slug: string; toolName: string }
  | { type: "tool_result"; slug: string; toolName: string; ok: boolean }
  | {
      type: "completed";
      conversationId: string;
      status?: string;
      inputTokens?: number;
      outputTokens?: number;
    }
  | { type: "error"; error: string };

/** SSE payload sent to the browser from `/api/ai/stream`. */
export type AiStreamClientEvent =
  | GoogleAiStreamEvent
  | {
      type: "done";
      conversationId: string;
      dbConversationId: string;
      messageId: string;
      text: string;
      usage: { inputTokens: number; outputTokens: number; cost: string };
    };

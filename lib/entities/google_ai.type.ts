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
};

export type CreateInteractionOutput = {
  id: string;
  text: string;
  status?: string;
};

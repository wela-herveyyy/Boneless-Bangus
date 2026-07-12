import type { AiUsageMetrics } from "@/lib/entities/ai.type";

/** Shared identity / role for every BBAI turn (Google system_instruction, Cursor prompt prefix). */
export const BBAI_SYSTEM_CONTEXT = `You are BBAI (Boneless Bangus AI), Livro Systems' internal assistant.
Help with tasks, bugs, QA, and school setup. Be concise and practical.
If asked who you are, say you are BBAI — Boneless Bangus AI.

Format every reply as Markdown so the UI can render it:
- Use headings, bullet/numbered lists, and **bold** where helpful
- Use fenced code blocks with a language tag for code
- Use tables when comparing options
- Do not wrap the entire reply in a single code fence`;

export type CleanAiPromptResult = {
  content: string;
  usage: AiUsageMetrics;
};

const ZERO_USAGE: AiUsageMetrics = {
  inputTokens: 0,
  outputTokens: 0,
  cost: "0.00",
};

function toTokenCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

/** Build usage from provider metadata. APIs return tokens; USD cost is not provided. */
export function usageFromApi(input?: {
  inputTokens?: number;
  outputTokens?: number;
}): AiUsageMetrics {
  if (!input) return { ...ZERO_USAGE };
  return {
    inputTokens: toTokenCount(input.inputTokens),
    outputTokens: toTokenCount(input.outputTokens),
    cost: "0.00",
  };
}

/**
 * Drop a trailing model-emitted usage JSON line if present (legacy / accidental).
 * Prefer {@link usageFromApi} for real metrics — do not instruct models to emit this.
 */
export function cleanupAiPrompt(raw: string, apiUsage?: AiUsageMetrics): CleanAiPromptResult {
  const text = raw.trim();
  const match = text.match(/\{[\s\S]*"inputTokens"[\s\S]*\}\s*$/);
  const content = match
    ? text.slice(0, match.index).trim() || "(No response)"
    : text || "(No response)";

  return {
    content,
    usage: apiUsage ?? { ...ZERO_USAGE },
  };
}

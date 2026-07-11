import type { AiUsageMetrics } from "@/lib/entities/ai.type";

/** Appended via system instruction / prompt prefix so models emit usage JSON. */
export const AI_USAGE_SYSTEM_PROMPT = `You must end every reply with exactly one final line that is raw JSON (no markdown fence, no prose after it) in this exact shape:
{"inputTokens":<number>,"outputTokens":<number>,"cost":<number>}
- inputTokens: estimate of prompt tokens for this turn
- outputTokens: estimate of completion tokens for this turn
- cost: estimated USD for this turn (number, e.g. 0.01)
The JSON line is mandatory. Put all normal answer text before it.`;

export type CleanAiPromptResult = {
  content: string;
  usage: AiUsageMetrics;
};

function toCostString(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return "0.00";
  return n.toFixed(2);
}

function toTokenCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

/**
 * Strip trailing usage JSON from model output.
 * Expected end: {"inputTokens":0,"outputTokens":0,"cost":0}
 */
export function cleanupAiPrompt(raw: string): CleanAiPromptResult {
  const text = raw.trim();
  const match = text.match(/\{[\s\S]*"inputTokens"[\s\S]*\}\s*$/);

  if (!match) {
    return {
      content: text,
      usage: { inputTokens: 0, outputTokens: 0, cost: "0.00" },
    };
  }

  const jsonChunk = match[0].trim();
  const content = text.slice(0, match.index).trim() || "(No response)";

  try {
    const parsed = JSON.parse(jsonChunk) as Record<string, unknown>;
    return {
      content,
      usage: {
        inputTokens: toTokenCount(parsed.inputTokens),
        outputTokens: toTokenCount(parsed.outputTokens),
        cost: toCostString(parsed.cost),
      },
    };
  } catch {
    // ponytail: bad JSON → keep full text, zero usage
    return {
      content: text,
      usage: { inputTokens: 0, outputTokens: 0, cost: "0.00" },
    };
  }
}

import type { AiUsageMetrics } from "@/lib/entities/ai.type";

/** Shared identity / role for every Giya turn (Google system_instruction, Cursor prompt prefix). */
export const GIYA_SYSTEM_CONTEXT = `You are Giya, Livro Systems' internal assistant.
In Cebuano/Binisaya, “giya” means to guide, steer, conduct, or give direction — and the act of guidance itself.
Help with tasks, bugs, QA, and school setup. Be concise and practical.
If asked who you are, say you are Giya.

Format every reply as Markdown so the UI can render it:
- Use headings, bullet/numbered lists, and **bold** where helpful
- Use fenced code blocks with a language tag for code
- Use tables when comparing options
- Do not wrap the entire reply in a single code fence`;

export function buildSystemInstructionWithMcp(mcpServers?: unknown): string {
  if (!mcpServers || typeof mcpServers !== "object") {
    return GIYA_SYSTEM_CONTEXT;
  }
  let enabledNames = "";
  if (Array.isArray(mcpServers)) {
    enabledNames = mcpServers
      .map((s) => (s && typeof s === "object" && "slug" in s ? String(s.slug) : ""))
      .filter(Boolean)
      .join(", ");
  } else {
    enabledNames = Object.keys(mcpServers).join(", ");
  }
  if (!enabledNames) {
    return GIYA_SYSTEM_CONTEXT;
  }
  return `${GIYA_SYSTEM_CONTEXT}\n\nActive Model Context Protocol (MCP) servers available: ${enabledNames}. Provide guidance and call tools compatible with these enabled capabilities when relevant.`;
}

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

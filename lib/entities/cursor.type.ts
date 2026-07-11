export type CursorResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type PromptAgentInput = {
  message: string;
  name?: string;
  email?: string;
  cwd?: string;
  modelId?: string;
};

export type PromptAgentOutput = {
  status: "finished" | "error" | "cancelled";
  result?: string;
  requestId?: string;
  durationMs?: number;
};

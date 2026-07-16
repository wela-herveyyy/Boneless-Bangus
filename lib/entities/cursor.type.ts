export type CursorResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CursorMcpServerConfig =
  | {
    type?: "stdio";
    transport?: "stdio";
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
    auth?: unknown;
    [key: string]: unknown;
  }
  | {
    type?: "http" | "sse";
    transport?: "sse" | "streamable-http";
    url?: string;
    serverUrl?: string;
    headers?: Record<string, string>;
    auth?: unknown;
    [key: string]: unknown;
  };

/** Skill body stored in IndexedDB (not filesystem SKILL.md). */
export type CursorSkill = {
  name: string;
  content: string;
};

export const CURSOR_MCP_STORAGE_KEY = "bbai_mcp";
export const CURSOR_SKILLS_STORAGE_KEY = "bbai_skills";

export type PromptAgentInput = {
  message: string;
  name?: string;
  email?: string;
  cwd?: string;
  modelId?: string;
  mcpServers?: Record<string, CursorMcpServerConfig>;
  skills?: CursorSkill[];
};

export type PromptAgentOutput = {
  status: "finished" | "error" | "cancelled";
  result?: string;
  requestId?: string;
  durationMs?: number;
};

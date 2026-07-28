export type CursorResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type CursorMcpServerConfig =
  | {
    type?: "stdio";
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
  }
  | {
    type?: "http" | "sse";
    url: string;
    headers?: Record<string, string>;
    auth?: {
      CLIENT_ID: string;
      CLIENT_SECRET?: string;
      scopes?: string[];
    };
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
  /** File attachments — PDFs and text files will be extracted and injected as prompt context. Images are skipped on the Cursor path. */
  files?: { name: string; mimeType: string; base64Data: string }[];
  /** Force personal / team / system key (must be configured). */
  keySource?: "personal" | "team" | "system";
};

export type PromptAgentOutput = {
  status: "finished" | "error" | "cancelled";
  result?: string;
  requestId?: string;
  durationMs?: number;
};

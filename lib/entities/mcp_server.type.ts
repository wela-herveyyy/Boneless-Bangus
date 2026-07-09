// ─── Category ────────────────────────────────────────────────────────────────

export const MCP_CATEGORY = {
  COMPANY_TOOLS: "company_tools",
  FILESYSTEM: "filesystem",
  DATABASE: "database",
  WEB: "web",
  AI: "ai",
  DEVTOOLS: "devtools",
  COMMUNICATION: "communication",
} as const;

export type McpCategory = (typeof MCP_CATEGORY)[keyof typeof MCP_CATEGORY];

export const MCP_CATEGORIES: { value: McpCategory; label: string }[] = [
  { value: "company_tools", label: "Company Tools" },
  { value: "filesystem", label: "File System" },
  { value: "database", label: "Database" },
  { value: "web", label: "Web" },
  { value: "ai", label: "AI" },
  { value: "devtools", label: "Dev Tools" },
  { value: "communication", label: "Communication" },
];

export function getCategoryLabel(category: string): string {
  return MCP_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

// ─── UI model (pre-DB; enabled is derived from user config in the live version) ─

export type McpServer = {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: string;
  category: McpCategory;
  /** JSON string injected into mcpServers[slug] when the user enables this server */
  configTemplate: string;
  /** UI-only: derived from whether mcpServers[slug] exists in the user's config */
  enabled: boolean;
};

// ─── Form state ───────────────────────────────────────────────────────────────

export type McpFormState = {
  slug: string;
  name: string;
  description: string;
  author: string;
  /** Stored as string so a native <select> onChange works without casting */
  category: string;
  configTemplate: string;
};

export const EMPTY_MCP_FORM: McpFormState = {
  slug: "",
  name: "",
  description: "",
  author: "",
  category: MCP_CATEGORY.COMPANY_TOOLS,
  configTemplate: '{\n  "url": ""\n}',
};

// ─── View state ───────────────────────────────────────────────────────────────

export type McpView = "list" | "create" | "edit";

// ─── Result wrapper (mirrors the pattern used in users.type.ts) ───────────────

export type McpResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

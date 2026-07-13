import { mcpServer } from "@/database/schema";
import type { UserRole } from "./users.type";
import type { McpCategorySelect } from "./mcp_category.type";
import type { McpServerToolSelect, McpToolInput } from "./mcp_server_tool.type";

export type McpServerSelect = typeof mcpServer.$inferSelect;
export type McpServerInsert = typeof mcpServer.$inferInsert;

// --- Detailed Server Representation (Joined for UI & Details Modal) ---
export type McpServerDetailed = McpServerSelect & {
  category: McpCategorySelect;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  tools: McpServerToolSelect[];
};

// --- Client-Side Storage User AI + MCP Config (IndexedDB) ---
export type UserAiConfig = {
  provider: "gemini" | "openai" | "anthropic" | "ollama";
  model: string;
  apiKey: string;
  baseUrl?: string;
  mcpServers: Record<string, unknown>; // enabled server slugs -> server settings
};

export const USER_AI_CONFIG_DEFAULT: UserAiConfig = {
  provider: "gemini",
  model: "gemini-2.0-flash",
  apiKey: "",
  baseUrl: "",
  mcpServers: {},
};

// --- Role & Permission Definitions ---
export const MCP_PERMISSION = {
  MCP_READ:       "mcp:read",
  MCP_CREATE:     "mcp:create",
  MCP_MANAGE_ALL: "mcp:manage_all",
} as const;
export type McpPermission = (typeof MCP_PERMISSION)[keyof typeof MCP_PERMISSION];

export const MCP_ROLE_PERMISSIONS: Record<UserRole, McpPermission[]> = {
  owner:   ["mcp:read", "mcp:create", "mcp:manage_all"],
  admin:   ["mcp:read", "mcp:create", "mcp:manage_all"],
  tech:    ["mcp:read", "mcp:create"],
  sales:   ["mcp:read", "mcp:create"],
  dev:     ["mcp:read", "mcp:create"],
  qa:      ["mcp:read", "mcp:create"],
  po:      ["mcp:read", "mcp:create"],
  pm:      ["mcp:read", "mcp:create"],
  finance: ["mcp:read", "mcp:create"],
};

export function hasMcpPermission(role: UserRole, permission: McpPermission): boolean {
  return MCP_ROLE_PERMISSIONS[role].includes(permission);
}

// --- UI Compatibility & Presentation Types ---
export const MCP_CATEGORY = {
  DEVTOOLS: "dev-tools",
  COMPANY_TOOLS: "company-tools",
  DATABASE: "database",
  WEB: "web-search",
  FILESYSTEM: "utilities",
  AI: "ai",
  COMMUNICATION: "productivity",
} as const;

export type McpCategory = string;

export const MCP_CATEGORIES = [
  { slug: "web-search", name: "Web & Search", value: "web-search", label: "Web & Search" },
  { slug: "dev-tools", name: "Code & Dev", value: "dev-tools", label: "Code & Dev" },
  { slug: "productivity", name: "Productivity", value: "productivity", label: "Productivity" },
  { slug: "utilities", name: "System Utilities", value: "utilities", label: "System Utilities" },
];

export function getCategoryLabel(slug: string): string {
  const found = MCP_CATEGORIES.find((c) => c.slug === slug);
  return found ? found.name : slug;
}

export type McpServer = {
  id: string;
  slug: string;
  name: string;
  description: string;
  author: string;
  userId?: string;
  category: string;
  categoryId?: string;
  configTemplate: string;
  configTemplateObj?: Record<string, unknown>;
  enabled: boolean;
  tools?: McpServerToolSelect[];
};

export type McpView = "list" | "create" | "edit" | "details";

export type McpFormState = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  author: string;
  category: string;
  categoryId: string;
  configTemplate: string;
  tools: McpToolInput[];
};

export const EMPTY_MCP_FORM: McpFormState = {
  slug: "",
  name: "",
  description: "",
  author: "",
  category: "dev-tools",
  categoryId: "",
  configTemplate: "{\n  \n}",
  tools: [],
};

// --- Action Results & Payloads ---
export type McpResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

export type McpDataPayload = {
  catalogue: McpServerDetailed[];
  categories: McpCategorySelect[];
  userConfig: UserAiConfig;
  currentUserId: string;
  canManageAll: boolean; // true if role === "owner" || role === "admin"
};

// --- Input DTOs for Server Actions ---
export type ToggleMcpInput = { slug: string };
export type McpConfigInput = { configJson: string };

export type CreateMcpInput = {
  slug: string;
  name: string;
  description: string;
  categoryId: string; // Foreign key to mcp_category.id
  configTemplate: Record<string, unknown>;
  tools: McpToolInput[]; // Array of tools exposed by this server
};
export type UpdateMcpInput = { id: string } & Partial<Omit<CreateMcpInput, "slug">>;
export type DeleteMcpInput = { id: string };

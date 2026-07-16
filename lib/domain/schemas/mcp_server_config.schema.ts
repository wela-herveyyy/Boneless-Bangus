import { z } from "zod";

export const McpAuthSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("bearer"), credentialRef: z.string() }),
  z.object({ type: z.literal("api-key"), headerName: z.string(), credentialRef: z.string() }),
  z.object({
    type: z.literal("oauth-refresh"),
    tokenUrl: z.string().url(),
    clientIdRef: z.string(),
    clientSecretRef: z.string(),
    refreshTokenRef: z.string(),
  }),
]);

const ALLOWED_COMMANDS = ["npx", "uvx", "node", "python", "python3", "bun"] as const;

export const McpStdioConfigSchema = z.object({
  transport: z.literal("stdio"),
  command: z.enum(ALLOWED_COMMANDS),
  args: z.array(z.string()).max(20),
  env: z.record(z.string(), z.string()).optional(),
  auth: McpAuthSchema.optional(),
});

export const McpRemoteConfigSchema = z.object({
  transport: z.enum(["sse", "streamable-http"]),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  auth: McpAuthSchema.optional(),
});

export const McpServerConfigEntrySchema = z.object({
  slug: z.string().min(1).max(60), // capped low enough that slug + toolName fits Gemini's ~64-char function name limit
  config: z.discriminatedUnion("transport", [McpStdioConfigSchema, McpRemoteConfigSchema]),
});

export const McpServersPayloadSchema = z.array(McpServerConfigEntrySchema).max(20);

export type McpServerConfigEntry = z.infer<typeof McpServerConfigEntrySchema>;
export type McpAuth = z.infer<typeof McpAuthSchema>;
export type McpStdioConfig = z.infer<typeof McpStdioConfigSchema>;
export type McpRemoteConfig = z.infer<typeof McpRemoteConfigSchema>;

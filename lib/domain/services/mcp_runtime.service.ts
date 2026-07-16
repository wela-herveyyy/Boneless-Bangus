import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  McpServersPayloadSchema,
  type McpServerConfigEntry,
} from "@/lib/domain/schemas/mcp_server_config.schema";
import { resolveAuthHeaders } from "./mcp_credential.service";
import {
  computePoolKey,
  getPoolEntry,
  removePoolEntry,
  setPoolEntry,
  type DiscoveredTool,
  type PoolEntry,
} from "./mcp_session_pool.service";
import type { ConnectWarning } from "@/lib/entities/google_ai.type";

export type NamespacedDiscoveredTool = DiscoveredTool & {
  namespacedName: string;
  slug: string;
  toolName: string;
};

export type McpRuntimeSession = {
  poolEntriesBySlug: Map<string, PoolEntry>;
  toolLookup: Map<string, { slug: string; toolName: string }>;
};

export type ConnectMcpResult = {
  tools: NamespacedDiscoveredTool[];
  warnings: ConnectWarning[];
  session: McpRuntimeSession;
};

export type ExecuteToolResult = {
  ok: boolean;
  content: string;
};

/**
 * Connects to or retrieves pooled client sessions for all requested MCP servers.
 * Wraps server discovery (connect + listTools) in a strict 10s timeout to prevent hanging.
 */
export async function connectMcpServers(
  configs: unknown,
  userId: string,
  opts?: { allowStdio?: boolean }
): Promise<ConnectMcpResult> {
  const parsed = McpServersPayloadSchema.safeParse(configs);
  if (!parsed.success) {
    return {
      tools: [],
      warnings: [{ slug: "global", reason: "Invalid MCP servers payload format." }],
      session: { poolEntriesBySlug: new Map(), toolLookup: new Map() },
    };
  }

  const tools: NamespacedDiscoveredTool[] = [];
  const warnings: ConnectWarning[] = [];
  const poolEntriesBySlug = new Map<string, PoolEntry>();
  const toolLookup = new Map<string, { slug: string; toolName: string }>();

  for (const entry of parsed.data) {
    const { slug, config } = entry;

    if (config.transport === "stdio" && opts?.allowStdio === false) {
      warnings.push({ slug, reason: "stdio transport is disabled in this environment." });
      continue;
    }

    try {
      const authMap = await resolveAuthHeaders(config.auth, userId, slug);
      const urlOrCommand =
        config.transport === "stdio"
          ? `${config.command} ${config.args.join(" ")}`
          : config.url;

      const poolKey = computePoolKey(slug, config.transport, urlOrCommand);
      let poolEntry = await getPoolEntry(poolKey);

      if (!poolEntry) {
        let transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport;

        if (config.transport === "stdio") {
          transport = new StdioClientTransport({
            command: config.command,
            args: config.args,
            env: { ...process.env, ...(config.env || {}), ...authMap } as Record<string, string>,
          });
        } else if (config.transport === "sse") {
          const combinedHeaders: Record<string, string> = { ...((config.headers as Record<string, string>) || {}), ...authMap };
          transport = new SSEClientTransport(new URL(config.url), {
            requestInit: {
              headers: combinedHeaders,
            },
          });
        } else {
          const combinedHeaders: Record<string, string> = { ...((config.headers as Record<string, string>) || {}), ...authMap };
          transport = new StreamableHTTPClientTransport(new URL(config.url), {
            requestInit: {
              headers: combinedHeaders,
            },
          });
        }

        const client = new Client(
          { name: `bbai-client-${slug}`, version: "1.0.0" },
          { capabilities: {} }
        );

        // Strict 10-second discovery timeout: on timeout immediately close client & transport
        let timeoutHandle: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(async () => {
            try {
              await client.close();
            } catch {}
            try {
              await transport.close();
            } catch {}
            reject(new Error("Server discovery timed out after 10s"));
          }, 10_000);
        });

        try {
          const listRes = await Promise.race([
            (async () => {
              await client.connect(transport);
              return await client.listTools();
            })(),
            timeoutPromise,
          ]);
          clearTimeout(timeoutHandle);

          const discoveredTools: DiscoveredTool[] = (listRes?.tools || []).map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema as Record<string, unknown> | undefined,
          }));

          poolEntry = {
            client,
            tools: discoveredTools,
            toolLookup: new Map(),
            lastUsedAt: Date.now(),
          };

          for (const t of discoveredTools) {
            const namespacedName = `${slug}__${t.name}`;
            poolEntry.toolLookup.set(namespacedName, { slug, toolName: t.name });
          }

          setPoolEntry(poolKey, poolEntry);
        } catch (discoveryErr) {
          clearTimeout(timeoutHandle);
          await removePoolEntry(poolKey);
          throw discoveryErr;
        }
      }

      poolEntriesBySlug.set(slug, poolEntry);

      for (const [namespacedName, lookup] of poolEntry.toolLookup.entries()) {
        toolLookup.set(namespacedName, lookup);
        const originalTool = poolEntry.tools.find((t) => t.name === lookup.toolName);
        if (originalTool) {
          tools.push({
            ...originalTool,
            namespacedName,
            slug,
            toolName: lookup.toolName,
          });
        }
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Failed to connect to MCP server.";
      warnings.push({ slug, reason });
    }
  }

  return {
    tools,
    warnings,
    session: { poolEntriesBySlug, toolLookup },
  };
}

/**
 * Executes a namespaced tool call against the pooled client.
 * Enforces a default 15-second execution timeout.
 */
export async function executeMcpTool(
  session: McpRuntimeSession,
  namespacedName: string,
  args: Record<string, unknown>,
  opts?: { timeoutMs?: number }
): Promise<ExecuteToolResult> {
  const lookup = session.toolLookup.get(namespacedName);
  if (!lookup) {
    return { ok: false, content: `Tool not found: ${namespacedName}` };
  }

  const poolEntry = session.poolEntriesBySlug.get(lookup.slug);
  if (!poolEntry) {
    return { ok: false, content: `No active connection pool for server: ${lookup.slug}` };
  }

  const timeoutMs = opts?.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    poolEntry.lastUsedAt = Date.now();
    const result = await poolEntry.client.callTool(
      { name: lookup.toolName, arguments: args },
      CallToolResultSchema,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    const isError = Boolean(result.isError);
    const contentText = Array.isArray(result.content)
      ? result.content
          .map((c) => {
            if (c && typeof c === "object" && "text" in c && typeof c.text === "string") {
              return c.text;
            }
            return JSON.stringify(c);
          })
          .join("\n")
      : typeof result.content === "string"
        ? result.content
        : JSON.stringify(result.content || "");

    return { ok: !isError, content: contentText };
  } catch (err) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      return { ok: false, content: `Tool call timed out after ${Math.round(timeoutMs / 1000)}s` };
    }
    const msg = err instanceof Error ? err.message : "Execution failed";
    return { ok: false, content: `Error running ${namespacedName}: ${msg}` };
  }
}

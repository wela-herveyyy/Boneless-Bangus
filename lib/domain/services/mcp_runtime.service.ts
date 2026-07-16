import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv";
import type { jsonSchemaValidator, JsonSchemaValidator } from "@modelcontextprotocol/sdk/validation";
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
 * Sanitizes and dereferences JSON schemas from third-party MCP servers (like Stitch).
 * Resolves local $ref pointers against $defs/definitions, and replaces missing or dangling
 * references with clean object definitions. Also strips $schema, $id, $defs, and definitions
 * so Google AI API does not reject tool parameter declarations with "400 Request contains an invalid argument."
 */
export function sanitizeJsonSchema(schema?: Record<string, unknown> | null): Record<string, unknown> {
  if (!schema || typeof schema !== "object") {
    return { type: "object", properties: {} };
  }

  const defs = ((schema.$defs || (schema as any).definitions || {}) as Record<string, any>);

  function cleanNode(node: any, visited = new Set<string>()): any {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map((item) => cleanNode(item, visited));

    if (typeof node.$ref === "string") {
      const ref = node.$ref as string;
      const refName = ref.replace(/^#\/(\$defs|definitions)\//, "");
      if (visited.has(refName)) {
        return { type: "object", description: `Circular reference to ${refName}` };
      }
      if (defs && typeof defs[refName] === "object" && defs[refName]) {
        visited.add(refName);
        const resolved = cleanNode(defs[refName], new Set(visited));
        visited.delete(refName);
        const { $ref, ...rest } = node;
        return { ...resolved, ...cleanNode(rest, visited) };
      } else {
        const { $ref, ...rest } = node;
        return {
          type: "object",
          description: `Reference to ${refName}`,
          ...cleanNode(rest, visited),
        };
      }
    }

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === "$schema" || key === "$id" || key === "$defs" || key === "definitions") {
        continue;
      }
      cleaned[key] = cleanNode(value, visited);
    }
    return cleaned;
  }

  const root = cleanNode(schema);
  if (!root || typeof root !== "object") return { type: "object", properties: {} };
  if (!root.type && root.properties) root.type = "object";
  if (!root.properties && root.type === "object") root.properties = {};
  return root;
}

/**
 * Resilient JSON Schema validator provider that wraps AJV.
 * Some third-party MCP servers (e.g. Stitch) return tool output schemas containing
 * incomplete or dangling $ref targets (like #/$defs/ScreenInstance). Standard AJV
 * compilation throws synchronously during listTools() outputSchema caching, causing
 * tool discovery to fail completely. This catches such errors and returns a pass-through
 * validator so tool discovery succeeds cleanly.
 */
class ResilientJsonSchemaValidator implements jsonSchemaValidator {
  private inner = new AjvJsonSchemaValidator();
  getValidator<T>(schema: any): JsonSchemaValidator<T> {
    try {
      const sanitized = sanitizeJsonSchema(schema);
      return this.inner.getValidator(sanitized);
    } catch (err) {
      console.warn("[ResilientJsonSchemaValidator] Bypassing malformed outputSchema validator:", err);
      return (input: unknown) => ({
        valid: true,
        data: input as T,
        errorMessage: undefined,
      });
    }
  }
}

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

      const poolKey = computePoolKey(userId, slug, config.transport, urlOrCommand);
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
          { capabilities: {}, jsonSchemaValidator: new ResilientJsonSchemaValidator() }
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
            inputSchema: sanitizeJsonSchema(t.inputSchema as Record<string, unknown> | undefined),
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

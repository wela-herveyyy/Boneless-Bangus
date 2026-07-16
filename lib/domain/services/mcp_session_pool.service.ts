import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

export type DiscoveredTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

export type PoolEntry = {
  client: Client;
  tools: DiscoveredTool[];
  toolLookup: Map<string, { slug: string; toolName: string }>;
  lastUsedAt: number;
};

const pool = new Map<string, PoolEntry>();
const IDLE_EVICT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Computes the stable pool cache key for a server entry scoped per user.
 * Each user gets their own isolated client pool entry.
 */
export function computePoolKey(userId: string, slug: string, transport: string, urlOrCommand: string): string {
  return `${userId}:${slug}:${transport}:${urlOrCommand}`;
}

/**
 * Retrieves a cached pool entry if alive and active.
 * Performs lazy idle eviction if entry hasn't been touched in over 10 minutes.
 */
export async function getPoolEntry(key: string): Promise<PoolEntry | undefined> {
  const entry = pool.get(key);
  if (!entry) {
    return undefined;
  }

  if (Date.now() - entry.lastUsedAt > IDLE_EVICT_MS) {
    // Lazy eviction: connection is stale (> 10m idle)
    try {
      await entry.client.close();
    } catch {
      // ignore errors when closing stale client
    }
    pool.delete(key);
    return undefined;
  }

  entry.lastUsedAt = Date.now();
  return entry;
}

/**
 * Stores a freshly connected Client session into the pool.
 */
export function setPoolEntry(key: string, entry: PoolEntry): void {
  entry.lastUsedAt = Date.now();
  pool.set(key, entry);
}

/**
 * Explicitly removes and closes a pool entry (e.g. on discovery timeout or manual disconnect).
 */
export async function removePoolEntry(key: string): Promise<void> {
  const entry = pool.get(key);
  if (entry) {
    try {
      await entry.client.close();
    } catch {
      // ignore
    }
    pool.delete(key);
  }
}

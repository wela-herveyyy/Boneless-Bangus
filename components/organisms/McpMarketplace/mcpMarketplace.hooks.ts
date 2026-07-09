"use client";

import { useMemo, useState } from "react";

export type McpCategory = "filesystem" | "database" | "web" | "ai" | "devtools" | "communication";

export type McpServer = {
  id: string;
  name: string;
  description: string;
  author: string;
  category: McpCategory;
  enabled: boolean;
};

export const MCP_CATEGORIES: { value: McpCategory; label: string }[] = [
  { value: "filesystem", label: "File System" },
  { value: "database", label: "Database" },
  { value: "web", label: "Web" },
  { value: "ai", label: "AI" },
  { value: "devtools", label: "Dev Tools" },
  { value: "communication", label: "Communication" },
];

const INITIAL_SERVERS: McpServer[] = [
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Read and write files on the local filesystem with path-scoped access control.",
    author: "Anthropic",
    category: "filesystem",
    enabled: false,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Interact with GitHub repositories, issues, pull requests, and workflows.",
    author: "Anthropic",
    category: "devtools",
    enabled: false,
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Query and inspect PostgreSQL databases with read-only safe access.",
    author: "Anthropic",
    category: "database",
    enabled: false,
  },
  {
    id: "sqlite",
    name: "SQLite",
    description: "Run queries against local SQLite database files.",
    author: "Anthropic",
    category: "database",
    enabled: false,
  },
  {
    id: "brave-search",
    name: "Brave Search",
    description: "Web and local search powered by the Brave Search API.",
    author: "Anthropic",
    category: "web",
    enabled: false,
  },
  {
    id: "fetch",
    name: "Fetch",
    description: "Make HTTP requests and retrieve web content for AI processing.",
    author: "Anthropic",
    category: "web",
    enabled: false,
  },
  {
    id: "puppeteer",
    name: "Puppeteer",
    description: "Browser automation, screenshots, and web scraping via headless Chrome.",
    author: "Anthropic",
    category: "web",
    enabled: false,
  },
  {
    id: "memory",
    name: "Memory",
    description: "Persistent key-value memory store that survives across conversations.",
    author: "Anthropic",
    category: "ai",
    enabled: false,
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking",
    description: "Dynamic problem-solving through structured sequential thought chains.",
    author: "Anthropic",
    category: "ai",
    enabled: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages, list channels, and interact with your Slack workspace.",
    author: "Anthropic",
    category: "communication",
    enabled: false,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Search, read, and manage files and documents in Google Drive.",
    author: "Anthropic",
    category: "filesystem",
    enabled: false,
  },
  {
    id: "sentry",
    name: "Sentry",
    description: "Retrieve error events, issues, and stack traces from Sentry.",
    author: "Community",
    category: "devtools",
    enabled: false,
  },
];

export function useMcpMarketplace() {
  const [servers, setServers] = useState<McpServer[]>(INITIAL_SERVERS);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<McpCategory | "all">("all");

  const filteredServers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return servers.filter((server) => {
      const matchesCategory = activeCategory === "all" || server.category === activeCategory;
      const matchesQuery =
        !q ||
        server.name.toLowerCase().includes(q) ||
        server.description.toLowerCase().includes(q) ||
        server.author.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [servers, query, activeCategory]);

  const enabledCount = useMemo(() => servers.filter((s) => s.enabled).length, [servers]);

  const toggleServer = (id: string) => {
    setServers((prev) =>
      prev.map((server) => (server.id === id ? { ...server, enabled: !server.enabled } : server)),
    );
  };

  return {
    filteredServers,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    enabledCount,
    toggleServer,
  };
}

export function getCategoryLabel(category: McpCategory): string {
  return MCP_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

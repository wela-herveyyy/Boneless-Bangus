"use client";

import { useMemo, useState } from "react";
import {
  EMPTY_MCP_FORM,
  MCP_CATEGORY,
  type McpCategory,
  type McpFormState,
  type McpServer,
  type McpView,
} from "@/lib/entities/mcp_server.type";

export { MCP_CATEGORIES, getCategoryLabel } from "@/lib/entities/mcp_server.type";
export type { McpCategory, McpFormState, McpServer, McpView };

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const INITIAL_SERVERS: McpServer[] = [
  {
    id: generateId(),
    slug: "leave-filing",
    name: "Leave Filing",
    description: "File and track leave requests via the company's HR system.",
    author: "Livro Systems",
    category: MCP_CATEGORY.COMPANY_TOOLS,
    configTemplate: '{\n  "url": "https://mcp.company.com/leave"\n}',
    enabled: false,
  },
  {
    id: generateId(),
    slug: "timesheets",
    name: "Timesheets",
    description: "Log hours, view your timesheet, and submit for approval.",
    author: "Livro Systems",
    category: MCP_CATEGORY.COMPANY_TOOLS,
    configTemplate: '{\n  "url": "https://mcp.company.com/time"\n}',
    enabled: false,
  },
  {
    id: generateId(),
    slug: "github",
    name: "GitHub",
    description: "Interact with repositories, issues, pull requests, and workflows.",
    author: "Anthropic",
    category: MCP_CATEGORY.DEVTOOLS,
    configTemplate:
      '{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-github"],\n  "env": { "GITHUB_TOKEN": "" }\n}',
    enabled: false,
  },
  {
    id: generateId(),
    slug: "postgres",
    name: "PostgreSQL",
    description: "Query and inspect PostgreSQL databases with read-only safe access.",
    author: "Anthropic",
    category: MCP_CATEGORY.DATABASE,
    configTemplate:
      '{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]\n}',
    enabled: false,
  },
  {
    id: generateId(),
    slug: "brave-search",
    name: "Brave Search",
    description: "Web and local search powered by the Brave Search API.",
    author: "Anthropic",
    category: MCP_CATEGORY.WEB,
    configTemplate:
      '{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-brave-search"],\n  "env": { "BRAVE_API_KEY": "" }\n}',
    enabled: false,
  },
  {
    id: generateId(),
    slug: "filesystem",
    name: "Filesystem",
    description: "Read and write files on the local filesystem with path-scoped access.",
    author: "Anthropic",
    category: MCP_CATEGORY.FILESYSTEM,
    configTemplate:
      '{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"]\n}',
    enabled: false,
  },
  {
    id: generateId(),
    slug: "memory",
    name: "Memory",
    description: "Persistent key-value memory store that survives across conversations.",
    author: "Anthropic",
    category: MCP_CATEGORY.AI,
    configTemplate:
      '{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-memory"]\n}',
    enabled: false,
  },
  {
    id: generateId(),
    slug: "slack",
    name: "Slack",
    description: "Send messages, list channels, and interact with your Slack workspace.",
    author: "Anthropic",
    category: MCP_CATEGORY.COMMUNICATION,
    configTemplate:
      '{\n  "command": "npx",\n  "args": ["-y", "@modelcontextprotocol/server-slack"],\n  "env": { "SLACK_BOT_TOKEN": "", "SLACK_TEAM_ID": "" }\n}',
    enabled: false,
  },
];

export function useMcpMarketplace() {
  const [servers, setServers] = useState<McpServer[]>(INITIAL_SERVERS);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<McpCategory | "all">("all");

  const [view, setView] = useState<McpView>("list");
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [form, setFormRaw] = useState<McpFormState>(EMPTY_MCP_FORM);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [deletingServerId, setDeletingServerId] = useState<string | null>(null);

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

  const setFormField = (field: keyof McpFormState, value: string) => {
    setFormRaw((prev) => ({ ...prev, [field]: value }));
  };

  const toggleServer = (id: string) => {
    setServers((prev) =>
      prev.map((server) => (server.id === id ? { ...server, enabled: !server.enabled } : server)),
    );
  };

  const startCreate = () => {
    setFormRaw(EMPTY_MCP_FORM);
    setSaveState("idle");
    setDeletingServerId(null);
    setView("create");
  };

  const startEdit = (server: McpServer) => {
    setFormRaw({
      slug: server.slug,
      name: server.name,
      description: server.description,
      author: server.author,
      category: server.category,
      configTemplate: server.configTemplate,
    });
    setEditingServer(server);
    setSaveState("idle");
    setDeletingServerId(null);
    setView("edit");
  };

  const cancelForm = () => {
    setEditingServer(null);
    setFormRaw(EMPTY_MCP_FORM);
    setSaveState("idle");
    setView("list");
  };

  const saveServer = () => {
    const { slug, name, description, author, category, configTemplate } = form;

    if (!slug.trim() || !name.trim() || !description.trim()) {
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    try {
      JSON.parse(configTemplate);
    } catch {
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    if (view === "create") {
      if (servers.some((s) => s.slug === slug.trim())) {
        setSaveState("error");
        window.setTimeout(() => setSaveState("idle"), 2000);
        return;
      }
      setServers((prev) => [
        {
          id: generateId(),
          slug: slug.trim(),
          name: name.trim(),
          description: description.trim(),
          author: author.trim() || "Custom",
          category: category as McpCategory,
          configTemplate,
          enabled: false,
        },
        ...prev,
      ]);
    } else if (view === "edit" && editingServer) {
      setServers((prev) =>
        prev.map((s) =>
          s.id === editingServer.id
            ? {
                ...s,
                name: name.trim(),
                description: description.trim(),
                author: author.trim(),
                category: category as McpCategory,
                configTemplate,
              }
            : s,
        ),
      );
    }

    setSaveState("saved");
    window.setTimeout(() => {
      setSaveState("idle");
      cancelForm();
    }, 800);
  };

  const requestDelete = (id: string) => setDeletingServerId(id);
  const cancelDelete = () => setDeletingServerId(null);
  const confirmDelete = (id: string) => {
    setServers((prev) => prev.filter((s) => s.id !== id));
    setDeletingServerId(null);
  };

  return {
    servers,
    filteredServers,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    enabledCount,
    toggleServer,
    view,
    form,
    setFormField,
    editingServer,
    saveState,
    deletingServerId,
    startCreate,
    startEdit,
    cancelForm,
    saveServer,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}

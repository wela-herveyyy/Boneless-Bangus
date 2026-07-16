"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Portal } from "@/components/atoms/Portal/Portal";
import { LuPlus, LuTrash2, LuPencil, LuCode, LuKey, LuTerminal, LuGlobe } from "react-icons/lu";
import { loadUserAiConfigFromIdb, saveUserAiConfigToIdb } from "@/lib/utils/mcp-idb";
import { getMcpDataAction } from "@/lib/domain/actions/mcp_server.actions";
import type { UserAiConfig, McpServerDetailed } from "@/lib/entities/mcp_server.type";
import { JsonTab } from "./JsonTab";

async function migrateServerSecrets(
  slug: string,
  rawConfig: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const config = { ...rawConfig };
  let modified = false;

  if (config.headers && typeof config.headers === "object") {
    const headers = { ...(config.headers as Record<string, string>) };
    for (const [key, val] of Object.entries(headers)) {
      if (!val || typeof val !== "string") continue;
      const lower = key.toLowerCase();
      if (lower === "authorization" && val.startsWith("Bearer ")) {
        const token = val.slice(7).trim();
        if (token && !token.startsWith("cred_")) {
          const res = await fetch("/api/mcp/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, label: key, plaintext: token }),
          });
          const json = await res.json().catch(() => null);
          if (json?.ok && json.credentialRef) {
            config.auth = { type: "bearer", credentialRef: json.credentialRef };
            delete headers[key];
            modified = true;
          }
        }
      } else if (
        lower.includes("key") ||
        lower.includes("token") ||
        lower.includes("secret")
      ) {
        if (!val.startsWith("cred_")) {
          const res = await fetch("/api/mcp/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, label: key, plaintext: val }),
          });
          const json = await res.json().catch(() => null);
          if (json?.ok && json.credentialRef) {
            config.auth = {
              type: "api-key",
              headerName: key,
              credentialRef: json.credentialRef,
            };
            delete headers[key];
            modified = true;
          }
        }
      }
    }
    if (modified) {
      if (Object.keys(headers).length > 0) config.headers = headers;
      else delete config.headers;
    }
  }

  if (config.env && typeof config.env === "object") {
    const env = { ...(config.env as Record<string, string>) };
    for (const [key, val] of Object.entries(env)) {
      if (!val || typeof val !== "string") continue;
      const lower = key.toLowerCase();
      if (
        lower.includes("key") ||
        lower.includes("token") ||
        lower.includes("secret") ||
        lower === "authorization"
      ) {
        if (!val.startsWith("cred_")) {
          const res = await fetch("/api/mcp/credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, label: key, plaintext: val }),
          });
          const json = await res.json().catch(() => null);
          if (json?.ok && json.credentialRef) {
            env[key] = json.credentialRef;
            modified = true;
          }
        }
      }
    }
    if (modified && Object.keys(env).length > 0) {
      config.env = env;
    }
  }

  return config;
}

export function McpTab() {
  const [userConfig, setUserConfig] = useState<UserAiConfig | null>(null);
  const [catalogueMap, setCatalogueMap] = useState<Record<string, McpServerDetailed>>({});
  const [loading, setLoading] = useState(true);
  const [showRawConfig, setShowRawConfig] = useState(false);

  // Modal editor state
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSlug, setFormSlug] = useState("");
  const [editorMode, setEditorMode] = useState<"structured" | "json">("structured");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Structured form fields
  const [transport, setTransport] = useState<"stdio" | "sse">("sse");
  const [url, setUrl] = useState("");
  const [command, setCommand] = useState("npx");
  const [args, setArgs] = useState("");
  const [keyValues, setKeyValues] = useState<Array<{ key: string; value: string }>>([
    { key: "Authorization", value: "Bearer " },
  ]);

  const loadData = async () => {
    setLoading(true);
    const [idbConfig, catResult] = await Promise.all([
      loadUserAiConfigFromIdb(),
      getMcpDataAction(),
    ]);

    let migrated = false;
    if (idbConfig?.mcpServers) {
      const nextServers: Record<string, unknown> = {};
      for (const [slug, raw] of Object.entries(idbConfig.mcpServers)) {
        if (raw && typeof raw === "object") {
          const cleaned = await migrateServerSecrets(slug, raw as Record<string, unknown>);
          nextServers[slug] = cleaned;
          if (JSON.stringify(cleaned) !== JSON.stringify(raw)) {
            migrated = true;
          }
        } else {
          nextServers[slug] = raw;
        }
      }
      if (migrated) {
        idbConfig.mcpServers = nextServers;
        await saveUserAiConfigToIdb(idbConfig);
      }
    }

    setUserConfig(idbConfig);

    if (catResult.ok) {
      const map: Record<string, McpServerDetailed> = {};
      catResult.data.catalogue.forEach((s) => {
        map[s.slug] = s;
      });
      setCatalogueMap(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openForm = (slug?: string) => {
    setJsonError(null);
    if (slug && userConfig?.mcpServers && userConfig.mcpServers[slug]) {
      const existing = userConfig.mcpServers[slug] as Record<string, unknown>;
      setEditingSlug(slug);
      setFormSlug(slug);
      setJsonText(JSON.stringify(existing, null, 2));

      // Populate structured fields
      const isStdio = existing.transport === "stdio" || existing.command !== undefined;
      setTransport(isStdio ? "stdio" : "sse");
      setUrl(typeof existing.url === "string" ? existing.url : "");
      setCommand(typeof existing.command === "string" ? existing.command : "npx");
      setArgs(Array.isArray(existing.args) ? existing.args.join(" ") : "");

      const kvDict = isStdio
        ? (existing.env as Record<string, string>) || {}
        : (existing.headers as Record<string, string>) || {};
      const entries = Object.entries(kvDict).map(([k, v]) => ({ key: k, value: String(v) }));
      setKeyValues(entries.length > 0 ? entries : [{ key: "Authorization", value: "Bearer " }]);
    } else {
      setEditingSlug(null);
      setFormSlug("");
      setTransport("sse");
      setUrl("");
      setCommand("npx");
      setArgs("-y @modelcontextprotocol/server-filesystem /path");
      setKeyValues([{ key: "Authorization", value: "Bearer " }]);
      setJsonText(
        JSON.stringify(
          {
            transport: "sse",
            url: "https://example.com/sse",
            headers: { Authorization: "Bearer YOUR_API_KEY" },
          },
          null,
          2
        )
      );
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSlug(null);
  };

  const handleAddKeyValue = () => {
    setKeyValues((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveKeyValue = (index: number) => {
    setKeyValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyValueChange = (index: number, field: "key" | "value", val: string) => {
    setKeyValues((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userConfig) return;
    const targetSlug = formSlug.trim();
    if (!targetSlug) {
      alert("Please provide a server slug.");
      return;
    }

    let configObj: Record<string, unknown> = {};

    if (editorMode === "json") {
      try {
        configObj = JSON.parse(jsonText) as Record<string, unknown>;
      } catch {
        setJsonError("Invalid JSON syntax. Please check formatting.");
        return;
      }
    } else {
      // Build from structured fields
      const kvObject: Record<string, string> = {};
      keyValues.forEach(({ key, value }) => {
        const k = key.trim();
        if (k) kvObject[k] = value;
      });

      if (transport === "stdio") {
        configObj = {
          transport: "stdio",
          command: command.trim(),
          args: args
            .split(" ")
            .map((s) => s.trim())
            .filter(Boolean),
          ...(Object.keys(kvObject).length > 0 ? { env: kvObject } : {}),
        };
      } else {
        configObj = {
          transport: "sse",
          url: url.trim(),
          ...(Object.keys(kvObject).length > 0 ? { headers: kvObject } : {}),
        };
      }
    }

    const cleanedConfig = await migrateServerSecrets(targetSlug, configObj);

    const nextMcpServers = { ...(userConfig.mcpServers || {}) };
    if (editingSlug && editingSlug !== targetSlug) {
      delete nextMcpServers[editingSlug];
    }
    nextMcpServers[targetSlug] = cleanedConfig;

    const nextConfig = { ...userConfig, mcpServers: nextMcpServers };
    setUserConfig(nextConfig);
    await saveUserAiConfigToIdb(nextConfig);
    closeForm();
  };

  const handleDelete = async (slugToDelete: string) => {
    if (!userConfig || !userConfig.mcpServers) return;
    if (confirm(`Remove "${slugToDelete}" from your installed MCP servers?`)) {
      const nextMcpServers = { ...userConfig.mcpServers };
      delete nextMcpServers[slugToDelete];
      const nextConfig = { ...userConfig, mcpServers: nextMcpServers };
      setUserConfig(nextConfig);
      await saveUserAiConfigToIdb(nextConfig);
    }
  };

  const installedEntries = userConfig?.mcpServers ? Object.entries(userConfig.mcpServers) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col w-full gap-2">
        <Button
          variant="primary"
          onClick={() => openForm()}
          className="w-full flex items-center justify-center gap-2"
        >
          <LuPlus /> Install / Add Custom MCP
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowRawConfig(true)}
          className="w-full flex items-center justify-center gap-2"
        >
          <LuCode /> Raw IDB Config
        </Button>
      </div>

      {isFormOpen && (
        <Portal>
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-lg flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold text-primary">
                    {editingSlug ? `Configure "${editingSlug}"` : "Add Installed MCP"}
                  </h3>
                  <p className="text-xs text-on-surface-muted mt-0.5">
                    Changes save instantly to your local IndexedDB configuration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                <button
                  type="button"
                  onClick={() => setEditorMode("structured")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    editorMode === "structured"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  Structured Form
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("json")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    editorMode === "json"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  Raw JSON Editor
                </button>
              </div>

              <div className="space-y-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-on-surface">Server Slug</span>
                  <Input
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. erpnext, github, my-private-tool"
                    required
                    disabled={!!editingSlug}
                  />
                </label>

                {editorMode === "structured" ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-on-surface">Transport Type</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="transport"
                            value="sse"
                            checked={transport === "sse"}
                            onChange={() => setTransport("sse")}
                          />
                          <LuGlobe className="text-primary" /> Remote SSE / HTTP
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="transport"
                            value="stdio"
                            checked={transport === "stdio"}
                            onChange={() => setTransport("stdio")}
                          />
                          <LuTerminal className="text-primary" /> Local Stdio (Command)
                        </label>
                      </div>
                    </div>

                    {transport === "sse" ? (
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-on-surface">Server URL</span>
                        <Input
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://server.com/sse"
                          required
                        />
                      </label>
                    ) : (
                      <>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-sm font-medium text-on-surface">Command</span>
                          <select
                            className="w-full rounded-2xl bg-surface-container-low p-3 text-sm text-on-surface ghost-border focus:bg-surface-container-lowest"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                          >
                            <option value="npx">npx</option>
                            <option value="uvx">uvx</option>
                            <option value="node">node</option>
                            <option value="python">python</option>
                            <option value="python3">python3</option>
                            <option value="bun">bun</option>
                          </select>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-sm font-medium text-on-surface">Arguments</span>
                          <Input
                            value={args}
                            onChange={(e) => setArgs(e.target.value)}
                            placeholder="-y @modelcontextprotocol/server-filesystem /path"
                          />
                        </label>
                      </>
                    )}

                    <div className="flex flex-col gap-2 pt-2 border-t border-primary/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-on-surface flex items-center gap-1.5">
                          <LuKey className="text-primary size-4" />
                          {transport === "sse" ? "Headers & API Keys" : "Environment Variables"}
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddKeyValue}
                          className="text-xs py-1 px-2.5"
                        >
                          + Add Key/Value
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {keyValues.map((kv, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <Input
                              placeholder="Key (e.g. Authorization)"
                              value={kv.key}
                              onChange={(e) => handleKeyValueChange(idx, "key", e.target.value)}
                              className="w-1/3 text-xs"
                            />
                            <Input
                              placeholder="Value (e.g. Bearer sk-abc123...)"
                              value={kv.value}
                              onChange={(e) => handleKeyValueChange(idx, "value", e.target.value)}
                              className="w-2/3 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyValue(idx)}
                              className="text-red-500 hover:bg-surface-container p-1.5 rounded-lg transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-on-surface">JSON Configuration</span>
                    <textarea
                      className="w-full min-h-[220px] font-mono text-xs rounded-2xl bg-surface-container-low p-3 text-on-surface ghost-border focus:bg-surface-container-lowest"
                      value={jsonText}
                      onChange={(e) => {
                        setJsonText(e.target.value);
                        setJsonError(null);
                      }}
                      required
                    />
                    {jsonError && <span className="text-xs text-red-500">{jsonError}</span>}
                  </label>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" onClick={closeForm} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Configuration
                </Button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {showRawConfig && (
        <Portal>
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-surface-container-lowest p-6 rounded-2xl shadow-bloom ghost-border h-[80vh]">
              <JsonTab onClose={() => setShowRawConfig(false)} />
            </div>
          </div>
        </Portal>
      )}

      {loading ? (
        <p className="text-center text-sm text-on-surface-muted py-4">Loading installed servers...</p>
      ) : installedEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-container-low text-center gap-2 border border-primary/25">
          <p className="text-sm font-medium text-on-surface">No MCP servers installed yet.</p>
          <p className="text-xs text-on-surface-muted max-w-xs">
            Add a server above, or browse the global Marketplace to enable curated tools and configure their API keys here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {installedEntries.map(([slug, config]) => {
            const catItem = catalogueMap[slug];
            const cfg = (typeof config === "object" && config ? config : {}) as Record<
              string,
              unknown
            >;
            const isStdio = cfg.transport === "stdio" || cfg.command !== undefined;
            const transportLabel = isStdio ? "Stdio (Local)" : "SSE / HTTP (Remote)";

            return (
              <div
                key={slug}
                className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between shadow-bloom border border-primary/25 transition-all hover:border-primary/40"
              >
                <div className="flex flex-col gap-1 pr-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-primary">
                      {catItem ? catItem.name : slug}
                    </h4>
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-surface-container px-2 py-0.5 rounded-full text-on-surface-muted">
                      {slug}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-muted line-clamp-1">
                    {catItem?.description || (isStdio ? `Command: ${String(cfg.command || "npx")}` : `URL: ${String(cfg.url || "")}`)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                      {transportLabel}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openForm(slug)}
                    title="Configure API Keys & Settings"
                    className="flex items-center gap-1.5 text-xs font-medium bg-surface-container hover:bg-surface-container-high text-primary px-3 py-2 rounded-lg transition-colors"
                  >
                    <LuKey className="size-3.5" /> Configure
                  </button>
                  <button
                    onClick={() => handleDelete(slug)}
                    title="Uninstall / Remove Server"
                    className="text-red-500 hover:bg-surface-container p-2 rounded-lg transition-colors"
                  >
                    <LuTrash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Portal } from "@/components/atoms/Portal/Portal";
import { LuPlus, LuTrash2, LuPencil, LuCode, LuKey, LuTerminal, LuGlobe } from "react-icons/lu";
import { loadUserAiConfigFromIdb, saveUserAiConfigToIdb } from "@/lib/utils/mcp-idb";
import {
  getMcpDataAction,
  createMcpServerAction,
  updateMcpServerAction,
  deleteMcpServerAction,
} from "@/lib/domain/actions/mcp_server.actions";
import { saveMcpCredentialAction } from "@/lib/domain/actions/mcp.actions";
import {
  EMPTY_MCP_FORM,
  type UserAiConfig,
  type McpServerDetailed,
  type McpFormState,
  type McpCategorySelect,
} from "@/lib/entities/mcp_server.type";
import { JsonTab } from "./JsonTab";
import { McpServerForm } from "@/components/organisms/McpServerForm/McpServerForm";

/** Returns true if a value is already an opaque UUID credential reference. */
function isCredentialRef(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

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
        if (token && !isCredentialRef(token)) {
          const formData = new FormData();
          formData.set("slug", slug);
          formData.set("label", key);
          formData.set("plaintext", token);
          const result = await saveMcpCredentialAction(formData);
          if (result.ok && result.data?.credentialRef) {
            config.auth = { type: "bearer", credentialRef: result.data.credentialRef };
            delete headers[key];
            modified = true;
          }
        }
      } else if (
        lower.includes("key") ||
        lower.includes("token") ||
        lower.includes("secret")
      ) {
        if (!isCredentialRef(val)) {
          const formData = new FormData();
          formData.set("slug", slug);
          formData.set("label", key);
          formData.set("plaintext", val);
          const result = await saveMcpCredentialAction(formData);
          if (result.ok && result.data?.credentialRef) {
            config.auth = {
              type: "api-key",
              headerName: key,
              credentialRef: result.data.credentialRef,
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
        if (!isCredentialRef(val)) {
          const formData = new FormData();
          formData.set("slug", slug);
          formData.set("label", key);
          formData.set("plaintext", val);
          const result = await saveMcpCredentialAction(formData);
          if (result.ok && result.data?.credentialRef) {
            env[key] = result.data.credentialRef;
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
  const [categories, setCategories] = useState<McpCategorySelect[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showRawConfig, setShowRawConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<"installed" | "authored">("installed");

  // Local IDB Config Form
  const [editingConfigSlug, setEditingConfigSlug] = useState<string | null>(null);
  const [isConfigFormOpen, setIsConfigFormOpen] = useState(false);
  const [formSlug, setFormSlug] = useState("");
  const [editorMode, setEditorMode] = useState<"structured" | "json">("structured");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [transport, setTransport] = useState<"stdio" | "sse" | "streamable-http">("sse");
  const [url, setUrl] = useState("");
  const [command, setCommand] = useState("npx");
  const [args, setArgs] = useState("");
  const [keyValues, setKeyValues] = useState<Array<{ key: string; value: string }>>([
    { key: "Authorization", value: "Bearer " },
  ]);

  // Authored Server Metadata Form (McpServerForm)
  const [isMetaFormOpen, setIsMetaFormOpen] = useState(false);
  const [metaFormMode, setMetaFormMode] = useState<"create" | "edit">("create");
  const [metaForm, setMetaForm] = useState<McpFormState>(EMPTY_MCP_FORM);
  const [editingServer, setEditingServer] = useState<McpServerDetailed | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

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
      setCategories(catResult.data.categories);
      setCurrentUserId(catResult.data.currentUserId);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- LOCAL IDB CONFIG HANDLERS ---
  const openConfigForm = (slug?: string) => {
    setJsonError(null);
    if (slug && userConfig?.mcpServers && userConfig.mcpServers[slug]) {
      const existing = userConfig.mcpServers[slug] as Record<string, unknown>;
      setEditingConfigSlug(slug);
      setFormSlug(slug);
      setJsonText(JSON.stringify(existing, null, 2));

      const isStdio = existing.transport === "stdio" || existing.command !== undefined;
      if (isStdio) {
        setTransport("stdio");
      } else if (existing.transport === "streamable-http") {
        setTransport("streamable-http");
      } else {
        setTransport("sse");
      }
      setUrl(typeof existing.url === "string" ? existing.url : "");
      setCommand(typeof existing.command === "string" ? existing.command : "npx");
      setArgs(Array.isArray(existing.args) ? existing.args.join(" ") : "");

      const kvDict = isStdio
        ? (existing.env as Record<string, string>) || {}
        : (existing.headers as Record<string, string>) || {};
      const entries = Object.entries(kvDict).map(([k, v]) => ({ key: k, value: String(v) }));
      setKeyValues(entries.length > 0 ? entries : [{ key: "Authorization", value: "Bearer " }]);
    } else {
      setEditingConfigSlug(null);
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
    setIsConfigFormOpen(true);
  };

  const closeConfigForm = () => {
    setIsConfigFormOpen(false);
    setEditingConfigSlug(null);
  };

  const handleAddKeyValue = () => setKeyValues((prev) => [...prev, { key: "", value: "" }]);
  const handleRemoveKeyValue = (index: number) => setKeyValues((prev) => prev.filter((_, i) => i !== index));
  const handleKeyValueChange = (index: number, field: "key" | "value", val: string) => {
    setKeyValues((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)));
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
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
      const kvObject: Record<string, string> = {};
      keyValues.forEach(({ key, value }) => {
        const k = key.trim();
        if (k) kvObject[k] = value;
      });

      if (transport === "stdio") {
        configObj = {
          transport: "stdio",
          command: command.trim(),
          args: args.split(" ").map((s) => s.trim()).filter(Boolean),
          ...(Object.keys(kvObject).length > 0 ? { env: kvObject } : {}),
        };
      } else {
        configObj = {
          transport: transport as "sse" | "streamable-http",
          url: url.trim(),
          ...(Object.keys(kvObject).length > 0 ? { headers: kvObject } : {}),
        };
      }
    }

    const cleanedConfig = await migrateServerSecrets(targetSlug, configObj);
    const nextMcpServers = { ...(userConfig.mcpServers || {}) };
    if (editingConfigSlug && editingConfigSlug !== targetSlug) {
      delete nextMcpServers[editingConfigSlug];
    }
    nextMcpServers[targetSlug] = cleanedConfig;

    const nextConfig = { ...userConfig, mcpServers: nextMcpServers };
    setUserConfig(nextConfig);
    await saveUserAiConfigToIdb(nextConfig);
    closeConfigForm();
  };

  const handleDeleteConfig = async (slugToDelete: string) => {
    if (!userConfig || !userConfig.mcpServers) return;
    if (confirm(`Remove "${slugToDelete}" from your installed MCP servers?`)) {
      const nextMcpServers = { ...userConfig.mcpServers };
      delete nextMcpServers[slugToDelete];
      const nextConfig = { ...userConfig, mcpServers: nextMcpServers };
      setUserConfig(nextConfig);
      await saveUserAiConfigToIdb(nextConfig);
    }
  };


  // --- AUTHORED METADATA HANDLERS ---
  const openMetaForm = (server?: McpServerDetailed) => {
    if (server) {
      setMetaFormMode("edit");
      setEditingServer(server);
      setMetaForm({
        id: server.id,
        slug: server.slug,
        name: server.name,
        description: server.description,
        author: server.user?.name || "",
        category: server.category.slug,
        categoryId: server.categoryId,
        configTemplate: typeof server.configTemplate === "string" ? server.configTemplate : JSON.stringify(server.configTemplate, null, 2),
        isGlobal: server.isGlobal ?? false,
        tools: (server.tools || []).map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema ?? null
        })),
      });
    } else {
      setMetaFormMode("create");
      setEditingServer(null);
      const defaultCat = categories[0]?.id || "";
      setMetaForm({ ...EMPTY_MCP_FORM, categoryId: defaultCat, isGlobal: false });
    }
    setSaveState("idle");
    setIsMetaFormOpen(true);
  };

  const closeMetaForm = () => {
    setIsMetaFormOpen(false);
    setEditingServer(null);
    setMetaForm(EMPTY_MCP_FORM);
  };

  const setMetaFormField = (field: keyof McpFormState, value: unknown) => {
    setMetaForm((prev) => {
      if (field === "category" && typeof value === "string") {
        const matchingCat = categories.find((c) => c.slug === value);
        return { ...prev, category: value, categoryId: matchingCat ? matchingCat.id : prev.categoryId };
      }
      return { ...prev, [field]: value as never };
    });
  };

  const saveMetaServer = async () => {
    const { slug, name, description, category, categoryId, configTemplate, tools, isGlobal } = metaForm;

    if (!slug.trim() || !name.trim() || !description.trim()) {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    let parsedConfig: Record<string, unknown>;
    try {
      parsedConfig = JSON.parse(configTemplate);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    const targetCategoryId = categories.find((c) => c.slug === category)?.id || categoryId || categories[0]?.id || "";

    if (metaFormMode === "create") {
      const res = await createMcpServerAction({
        slug: slug.trim(),
        name: name.trim(),
        description: description.trim(),
        categoryId: targetCategoryId,
        configTemplate: parsedConfig,
        tools: tools || [],
        isGlobal: isGlobal ?? false,
      });
      if (!res.ok) {
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 2000);
        return;
      }
    } else if (metaFormMode === "edit" && editingServer) {
      const res = await updateMcpServerAction({
        id: editingServer.id,
        name: name.trim(),
        description: description.trim(),
        categoryId: targetCategoryId,
        configTemplate: parsedConfig,
        tools: tools || [],
        isGlobal: isGlobal ?? false,
      });
      if (!res.ok) {
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 2000);
        return;
      }
    }

    await loadData();
    setSaveState("saved");
    setTimeout(() => {
      setSaveState("idle");
      closeMetaForm();
    }, 800);
  };

  const handleDeleteAuthored = async (id: string, name: string) => {
    if (confirm(`Permanently delete the authored server "${name}"? This removes it from the marketplace.`)) {
      await deleteMcpServerAction({ id });
      await loadData();
    }
  };


  const installedEntries = userConfig?.mcpServers ? Object.entries(userConfig.mcpServers) : [];
  const authoredServers = Object.values(catalogueMap).filter((s) => s.userId === currentUserId);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs Switcher */}
      <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl">
        <button
          onClick={() => setActiveTab("installed")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === "installed"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-muted hover:bg-surface-container"
          }`}
        >
          Installed MCPs
        </button>
        <button
          onClick={() => setActiveTab("authored")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "authored"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-muted hover:bg-surface-container"
          }`}
        >
          My Authored Servers
          {authoredServers.length > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
              activeTab === "authored" ? "bg-on-primary/20" : "bg-surface/50"
            }`}>
              {authoredServers.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "installed" ? (
        <>
          <div className="flex flex-col w-full gap-2">
            <Button
              variant="primary"
              onClick={() => openConfigForm()}
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
                const cfg = (typeof config === "object" && config ? config : {}) as Record<string, unknown>;
                const isStdio = cfg.transport === "stdio" || cfg.command !== undefined;
                const transportLabel = isStdio
                  ? "Stdio (Local)"
                  : cfg.transport === "streamable-http"
                  ? "Streamable HTTP"
                  : "SSE / HTTP (Remote)";

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
                        onClick={() => openConfigForm(slug)}
                        title="Configure API Keys & Settings"
                        className="flex items-center gap-1.5 text-xs font-medium bg-surface-container hover:bg-surface-container-high text-primary px-3 py-2 rounded-lg transition-colors"
                      >
                        <LuKey className="size-3.5" /> Configure
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(slug)}
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
        </>
      ) : (
        <>
          <Button
            variant="primary"
            onClick={() => openMetaForm()}
            className="w-full flex items-center justify-center gap-2"
          >
            <LuPlus /> Create New MCP Server
          </Button>

          {loading ? (
            <p className="text-center text-sm text-on-surface-muted py-4">Loading authored servers...</p>
          ) : authoredServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-container-low text-center gap-2 border border-primary/25">
              <p className="text-sm font-medium text-on-surface">You haven't authored any servers.</p>
              <p className="text-xs text-on-surface-muted max-w-xs">
                Create a server to share it with the marketplace or use it privately across your teams.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {authoredServers.map((server) => (
                <div
                  key={server.id}
                  className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high ghost-border cursor-pointer"
                  onClick={() => openMetaForm(server)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-on-surface">{server.name}</h4>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${server.isGlobal ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-on-surface-muted'}`}>
                          {server.isGlobal ? 'Published' : 'Private'}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-muted">
                        {server.slug}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); openMetaForm(server); }} className="text-primary hover:bg-surface-container p-1.5 rounded-lg transition-colors">
                        <LuPencil className="size-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAuthored(server.id, server.name); }} className="text-red-500 hover:bg-surface-container p-1.5 rounded-lg transition-colors">
                        <LuTrash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-muted mt-1 line-clamp-2">{server.description}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}


      {/* Config Form Portal */}
      {isConfigFormOpen && (
        <Portal>
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
            <form
              onSubmit={handleConfigSubmit}
              className="flex w-full max-w-lg flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold text-primary">
                    {editingConfigSlug ? `Configure "${editingConfigSlug}"` : "Add Installed MCP"}
                  </h3>
                  <p className="text-xs text-on-surface-muted mt-0.5">
                    Changes save instantly to your local IndexedDB configuration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeConfigForm}
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
                    disabled={!!editingConfigSlug}
                  />
                </label>

                {editorMode === "structured" ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-on-surface">Transport Type</span>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="transport"
                            value="sse"
                            checked={transport === "sse"}
                            onChange={() => setTransport("sse")}
                          />
                          <LuGlobe className="text-primary" /> Remote SSE
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="transport"
                            value="streamable-http"
                            checked={transport === "streamable-http"}
                            onChange={() => setTransport("streamable-http")}
                          />
                          <LuGlobe className="text-primary" /> Streamable HTTP
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

                    {transport !== "stdio" ? (
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
                <Button variant="secondary" onClick={closeConfigForm} type="button">
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

      {/* Meta Form Portal (McpServerForm) */}
      {isMetaFormOpen && (
        <Portal>
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 px-4 py-8 backdrop-blur-sm">
            <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-surface-container-lowest shadow-bloom ghost-border h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-outline/10 px-6 py-4">
                <h3 className="text-lg font-semibold text-on-surface">
                  {metaFormMode === "create" ? "Create MCP Server" : "Edit MCP Server"}
                </h3>
                <button onClick={closeMetaForm} className="p-1 text-on-surface-muted hover:text-on-surface transition-colors">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <McpServerForm
                  mode={metaFormMode}
                  form={metaForm}
                  setFormField={setMetaFormField}
                  saveState={saveState}
                  onSave={saveMetaServer}
                  onCancel={closeMetaForm}
                  categories={categories}
                />
              </div>
            </div>
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
    </div>
  );
}

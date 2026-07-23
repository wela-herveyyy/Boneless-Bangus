import { LuChevronLeft, LuPlus, LuTrash2, LuWrench } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import { MCP_CATEGORIES } from "@/lib/entities/mcp_server.type";
import { useMcpServerForm, type McpServerFormProps } from "./mcpServerForm.hooks";

const FIELD_CLASS =
  "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors input-glow focus:bg-surface-container-lowest placeholder:text-on-surface-muted";

export function McpServerForm({
  mode,
  form,
  setFormField,
  saveState,
  onSave,
  onCancel,
  categories = [],
}: McpServerFormProps) {
  const {
    saveLabel,
    tools,
    addTool,
    removeTool,
    updateToolField,
    formatInputSchema,
  } = useMcpServerForm({ form, setFormField, saveState });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Back */}
      <div className="border-b border-primary/10 px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-medium text-on-surface-muted transition-colors hover:text-primary"
        >
          <LuChevronLeft className="size-4" aria-hidden />
          Back to catalogue
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Slug — create only */}
        {mode === "create" && (
          <label className="flex flex-col gap-1.5">
            <Label>Slug</Label>
            <Input
              type="text"
              value={form.slug}
              onChange={(e) => setFormField("slug", e.target.value)}
              placeholder="e.g. leave-filing"
              aria-label="Server slug"
            />
            <p className="text-[10px] text-on-surface-muted">
              Used as the key in{" "}
              <code className="text-on-surface">mcpServers</code>. Lowercase,
              hyphens only.
            </p>
          </label>
        )}

        {/* Name */}
        <label className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input
            type="text"
            value={form.name}
            onChange={(e) => setFormField("name", e.target.value)}
            placeholder="e.g. Leave Filing"
            aria-label="Server name"
          />
        </label>

        {/* Description */}
        <label className="flex flex-col gap-1.5">
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => setFormField("description", e.target.value)}
            placeholder="What does this MCP server enable the AI to do?"
            rows={3}
            className={[FIELD_CLASS, "resize-y"].join(" ")}
            aria-label="Server description"
          />
        </label>

        {/* Category */}
        <label className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <select
            value={form.category}
            onChange={(e) => setFormField("category", e.target.value)}
            className={FIELD_CLASS}
            aria-label="Server category"
          >
            {categories.length > 0
              ? categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))
              : MCP_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
          </select>
        </label>

        {/* Visibility */}
        <div className="flex flex-col gap-1.5">
          <Label>Visibility</Label>
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl">
            <button
              type="button"
              onClick={() => setFormField("isGlobal", false)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                !form.isGlobal
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-muted hover:bg-surface-container"
              }`}
            >
              Private
            </button>
            <button
              type="button"
              onClick={() => setFormField("isGlobal", true)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                form.isGlobal
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-muted hover:bg-surface-container"
              }`}
            >
              Published
            </button>
          </div>
          <p className="text-[10px] text-on-surface-muted mt-0.5 px-1">
            {form.isGlobal ? "Available to everyone in the marketplace." : "Only you can see and install this server."}
          </p>
        </div>

        {/* Config template */}
        <label className="flex flex-col gap-1.5">
          <Label>Connection Config</Label>
          <textarea
            value={form.configTemplate}
            onChange={(e) => setFormField("configTemplate", e.target.value)}
            spellCheck={false}
            rows={5}
            className={[FIELD_CLASS, "resize-y font-mono text-xs leading-6"].join(" ")}
            aria-label="Connection config JSON"
          />
          <p className="text-[10px] leading-relaxed text-on-surface-muted">
            HTTP/SSE server:{" "}
            <code className="text-on-surface">{'{ "url": "..." }'}</code>
            <br />
            npm package:{" "}
            <code className="text-on-surface">
              {'{ "command": "npx", "args": [...] }'}
            </code>
          </p>
        </label>

        {/* Dynamic Tools Section */}
        <div className="pt-2 border-t border-outline/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LuWrench className="size-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Tools Included ({tools.length})
              </span>
            </div>
            <button
              type="button"
              onClick={addTool}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2.5 py-1 rounded-lg"
            >
              <LuPlus className="size-3.5" />
              <span>Add Tool</span>
            </button>
          </div>

          <p className="text-[11px] text-on-surface-muted">
            Document individual functions/tools so users know what specific actions this server unlocks.
          </p>

          <div className="space-y-4">
            {tools.map((tool, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl bg-surface-container p-3.5 space-y-3 border border-outline/15 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-on-surface-muted uppercase tracking-wider">
                    Tool #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTool(idx)}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove Tool"
                  >
                    <LuTrash2 className="size-4" />
                  </button>
                </div>

                <div>
                  <Label className="text-xs">Tool Name</Label>
                  <Input
                    type="text"
                    value={tool.name || ""}
                    onChange={(e) => updateToolField(idx, "name", e.target.value)}
                    placeholder="e.g. query_database"
                    className="mt-1 bg-surface-container-low text-xs py-2"
                  />
                </div>

                <div>
                  <Label className="text-xs">Description</Label>
                  <textarea
                    value={tool.description || ""}
                    onChange={(e) => updateToolField(idx, "description", e.target.value)}
                    placeholder="What does this specific tool do?"
                    rows={2}
                    className={[FIELD_CLASS, "mt-1 bg-surface-container-low text-xs py-2 resize-y"].join(" ")}
                  />
                </div>

                <div>
                  <Label className="text-xs">Input Schema (JSON)</Label>
                  <textarea
                    value={formatInputSchema(tool.inputSchema)}
                    onChange={(e) => updateToolField(idx, "inputSchema", e.target.value)}
                    rows={3}
                    className={[FIELD_CLASS, "mt-1 bg-surface-container-low font-mono text-[11px] py-2 resize-y leading-5"].join(" ")}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="border-t border-primary/10 px-4 py-4">
        <Button
          onClick={onSave}
          className="w-full px-4 py-2 text-sm"
          variant={saveState === "error" ? "secondary" : "primary"}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

import { LuChevronLeft } from "react-icons/lu";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Label } from "@/components/atoms/Label/Label";
import {
  MCP_CATEGORIES,
  type McpFormState,
} from "@/lib/entities/mcp_server.type";

// Matches the Input atom's visual style for elements the atom doesn't cover
// (textarea, select)
const FIELD_CLASS =
  "w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none transition-colors input-glow focus:bg-surface-container-lowest placeholder:text-on-surface-muted";

export type McpServerFormProps = {
  mode: "create" | "edit";
  form: McpFormState;
  setFormField: (field: keyof McpFormState, value: string) => void;
  saveState: "idle" | "saved" | "error";
  onSave: () => void;
  onCancel: () => void;
};

export function McpServerForm({
  mode,
  form,
  setFormField,
  saveState,
  onSave,
  onCancel,
}: McpServerFormProps) {
  const saveLabel =
    saveState === "saved"
      ? "Saved!"
      : saveState === "error"
        ? "Check fields & JSON"
        : "Save server";

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

        {/* Author */}
        <label className="flex flex-col gap-1.5">
          <Label>Author</Label>
          <Input
            type="text"
            value={form.author}
            onChange={(e) => setFormField("author", e.target.value)}
            placeholder="e.g. Livro Systems"
            aria-label="Server author"
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
            {MCP_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>

        {/* Config template */}
        <label className="flex flex-col gap-1.5">
          <Label>Connection Config</Label>
          <textarea
            value={form.configTemplate}
            onChange={(e) => setFormField("configTemplate", e.target.value)}
            spellCheck={false}
            rows={7}
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

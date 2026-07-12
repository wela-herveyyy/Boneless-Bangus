import { useCallback, useMemo } from "react";
import type { McpFormState } from "@/lib/entities/mcp_server.type";

export type McpServerFormProps = {
  mode: "create" | "edit";
  form: McpFormState;
  setFormField: (field: keyof McpFormState, value: unknown) => void;
  saveState: "idle" | "saved" | "error";
  onSave: () => void;
  onCancel: () => void;
  categories?: { id: string; slug: string; name: string }[];
};

export function useMcpServerForm({
  form,
  setFormField,
  saveState,
}: {
  form: McpFormState;
  setFormField: (field: keyof McpFormState, value: unknown) => void;
  saveState: "idle" | "saved" | "error";
}) {
  const saveLabel = useMemo(() => {
    if (saveState === "saved") return "Saved!";
    if (saveState === "error") return "Check fields & JSON";
    return "Save server";
  }, [saveState]);

  const tools = useMemo(() => form.tools || [], [form.tools]);

  const addTool = useCallback(() => {
    const next = [
      ...tools,
      {
        name: "",
        description: "",
        inputSchema: '{\n  "type": "object",\n  "properties": {}\n}',
      },
    ];
    setFormField("tools", next);
  }, [tools, setFormField]);

  const removeTool = useCallback(
    (index: number) => {
      const next = tools.filter((_, i) => i !== index);
      setFormField("tools", next);
    },
    [tools, setFormField]
  );

  const updateToolField = useCallback(
    (index: number, field: string, val: string) => {
      const next = [...tools];
      next[index] = { ...next[index], [field]: val };
      setFormField("tools", next);
    },
    [tools, setFormField]
  );

  const formatInputSchema = useCallback((schema: unknown): string => {
    if (typeof schema === "string") return schema;
    if (schema) {
      try {
        return JSON.stringify(schema, null, 2);
      } catch {
        return '{\n  "type": "object",\n  "properties": {}\n}';
      }
    }
    return '{\n  "type": "object",\n  "properties": {}\n}';
  }, []);

  return {
    saveLabel,
    tools,
    addTool,
    removeTool,
    updateToolField,
    formatInputSchema,
  };
}

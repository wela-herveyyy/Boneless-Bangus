"use client";

import { McpServerForm } from "@/components/organisms/McpServerForm/McpServerForm";
import {
  useMcpNewServerPage,
  type McpNewServerPageProps,
} from "./mcpNewServerPage.hooks";

export function McpNewServerPage({ categories }: McpNewServerPageProps) {
  const {
    form,
    saveState,
    setFormField,
    handleSave,
    handleCancel,
  } = useMcpNewServerPage({ categories });

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-bloom border border-outline/10">
      <McpServerForm
        mode="create"
        form={form}
        setFormField={setFormField}
        saveState={saveState}
        onSave={handleSave}
        onCancel={handleCancel}
        categories={categories}
      />
    </div>
  );
}

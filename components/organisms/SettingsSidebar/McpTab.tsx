"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { Portal } from "@/components/atoms/Portal/Portal";
import { LuPlus, LuTrash2, LuPencil } from "react-icons/lu";
import { getMcpDataAction, createMcpServerAction, updateMcpServerAction, deleteMcpServerAction } from "@/lib/domain/actions/mcp_server.actions";
import type { McpServerDetailed } from "@/lib/entities/mcp_server.type";
import type { McpCategorySelect } from "@/lib/entities/mcp_category.type";
import { JsonTab } from "./JsonTab";

export function McpTab() {
  const [servers, setServers] = useState<McpServerDetailed[]>([]);
  const [categories, setCategories] = useState<McpCategorySelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingServer, setEditingServer] = useState<McpServerDetailed | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showRawConfig, setShowRawConfig] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const result = await getMcpDataAction();
    if (result.ok) {
      setServers(result.data.catalogue);
      setCategories(result.data.categories);
      if (result.data.categories.length > 0) {
        setCategoryId(result.data.categories[0].id);
      }
    } else {
      console.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openForm = (server?: McpServerDetailed) => {
    if (server) {
      setEditingServer(server);
      setName(server.name);
      setSlug(server.slug);
      setDescription(server.description);
      setCategoryId(server.categoryId);
    } else {
      setEditingServer(null);
      setName("");
      setSlug("");
      setDescription("");
      if (categories.length > 0) setCategoryId(categories[0].id);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingServer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingServer) {
      await updateMcpServerAction({ id: editingServer.id, name, description, categoryId });
    } else {
      if (!categoryId) {
        alert("Please select a category");
        return;
      }
      await createMcpServerAction({ name, slug, description, categoryId, configTemplate: {}, tools: [] });
    }
    await loadData();
    closeForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this MCP Connection?")) {
      await deleteMcpServerAction({ id });
      await loadData();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col w-full gap-2">
        <Button variant="primary" onClick={() => openForm()} className="w-full flex items-center justify-center gap-2">
          <LuPlus /> Add MCP Connection
        </Button>
        <Button variant="secondary" onClick={() => setShowRawConfig(true)} className="w-full flex items-center justify-center">
          Raw Config
        </Button>
      </div>

      {isFormOpen && (
        <Portal>
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-on-surface/40 px-4 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-5 rounded-2xl bg-surface-container-lowest p-6 shadow-bloom ghost-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-xl font-semibold text-primary">{editingServer ? "Edit MCP Connection" : "Add MCP Connection"}</h3>
              <button
                type="button"
                onClick={closeForm}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-primary"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-on-surface">Name</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-on-surface">Slug</span>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-on-surface">Category</span>
                <select
                  className="w-full rounded-2xl bg-surface-container-low p-3 text-sm text-on-surface ghost-border focus:bg-surface-container-lowest"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-on-surface">Description</span>
                <textarea
                  className="w-full min-h-[100px] resize-y rounded-2xl bg-surface-container-low p-3 text-sm text-on-surface placeholder:text-on-surface-muted/60 ghost-border focus:bg-surface-container-lowest"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={closeForm} type="button">Cancel</Button>
              <Button variant="primary" type="submit">Save</Button>
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
        <p className="text-center text-sm text-on-surface-muted">Loading...</p>
      ) : servers.length === 0 ? (
        <p className="text-center text-sm text-on-surface-muted">No MCP Connections found.</p>
      ) : (
        servers.map((server) => (
          <div key={server.id} className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between shadow-bloom">
            <div>
              <h4 className="font-semibold text-primary">{server.name}</h4>
              <p className="text-sm text-on-surface-muted">{server.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openForm(server)} className="text-primary hover:bg-surface-container p-2 rounded-lg transition-colors">
                <LuPencil />
              </button>
              <button onClick={() => handleDelete(server.id)} className="text-red-500 hover:bg-surface-container p-2 rounded-lg transition-colors">
                <LuTrash2 />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

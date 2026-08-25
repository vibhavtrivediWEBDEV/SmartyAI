/**
 * Workspace Manager Modal
 * Create, select, and manage workspaces
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  FolderOpen,
  Trash2,
  Clock,
  Star,
  Code,
  X,
  Loader2,
  Search,
  Globe,
  Lock,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description?: string;
  files: Array<{ path: string }>;
  settings: {
    runtime: string;
  };
  isPublic: boolean;
  tags: string[];
  lastAccessedAt: string;
  createdAt: string;
}

interface WorkspaceManagerProps {
  onSelect: (workspaceId: string) => void;
  onClose: () => void;
}

export function WorkspaceManager({ onSelect, onClose }: WorkspaceManagerProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    description: "",
    runtime: "react" as const,
  });

  // Load workspaces
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use test endpoint for development (no auth required)
      const response = await fetch("/api/test-workspaces");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load workspaces");
      }

      setWorkspaces(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspace.name.trim()) return;

    setIsCreating(true);

    try {
      // Use test endpoint for development (no auth required)
      const response = await fetch("/api/test-workspaces/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorkspace),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create workspace");
      }

      onSelect(result.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
      setIsCreating(false);
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (!confirm("Are you sure you want to delete this workspace?")) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete workspace");
      }

      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workspace");
    }
  };

  // Filter workspaces by search
  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Runtime icons
  const getRuntimeIcon = (runtime: string) => {
    switch (runtime) {
      case "react":
        return "⚛️";
      case "react-ts":
        return "🔷";
      case "html":
        return "🌐";
      case "node":
        return "🟢";
      case "python":
        return "🐍";
      case "java":
        return "☕";
      default:
        return "📄";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#1e1e1e] shadow-2xl">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-6">
          <div className="flex items-center gap-3">
            <Code size={20} className="text-[#007acc]" />
            <h2 className="text-lg font-semibold text-white">My Workspaces</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-[#2a2d2e]"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Search + Actions */}
        <div className="flex items-center gap-3 border-b border-[#2d2d2d] bg-[#252526] p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full rounded-lg border border-[#3c3c3c] bg-[#3c3c3c] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[#007acc] focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-[#007acc] px-4 py-2 text-sm font-medium text-white hover:bg-[#005a9e]"
          >
            <Plus size={16} />
            <span>New Workspace</span>
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#007acc]" />
          </div>
        )}

        {/* Workspace List */}
        {!isLoading && !isCreating && (
          <div className="h-[calc(80vh-15vh)] overflow-y-auto p-4">
            {filteredWorkspaces.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center text-center">
                <FolderOpen size={48} className="mb-4 text-gray-600" />
                <p className="text-sm text-gray-400">
                  {searchQuery ? "No workspaces found" : "No workspaces yet"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="mt-4 rounded-lg bg-[#007acc] px-4 py-2 text-sm text-white hover:bg-[#005a9e]"
                  >
                    Create your first workspace
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredWorkspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className="group relative cursor-pointer rounded-lg border border-[#2d2d2d] bg-[#252526] p-4 transition-all hover:border-[#007acc] hover:bg-[#2a2d2e]"
                    onClick={() => onSelect(workspace.id)}
                  >
                    {/* Workspace info */}
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getRuntimeIcon(workspace.settings.runtime)}</span>
                        <div>
                          <h3 className="font-medium text-white">{workspace.name}</h3>
                          {workspace.description && (
                            <p className="text-xs text-gray-500">{workspace.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {workspace.isPublic ? (
                          <Globe size={14} className="text-gray-500" title="Public" />
                        ) : (
                          <Lock size={14} className="text-gray-500" title="Private" />
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {workspace.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {workspace.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-[#1e1e1e] px-2 py-0.5 text-xs text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Files count */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{workspace.files.length} files</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(workspace.lastAccessedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Delete on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkspace(workspace.id);
                      }}
                      className="absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity hover:bg-[#1e1e1e] group-hover:opacity-100"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Workspace Form */}
        {isCreating && (
          <div className="h-[calc(80vh-15vh)] overflow-y-auto p-6">
            <div className="mx-auto max-w-md">
              <h3 className="mb-6 text-lg font-semibold text-white">Create New Workspace</h3>

              {/* Name */}
              <div className="mb-4">
                <label className="mb-2 block text-sm text-gray-400">Name</label>
                <input
                  type="text"
                  value={newWorkspace.name}
                  onChange={(e) =>
                    setNewWorkspace({ ...newWorkspace, name: e.target.value })
                  }
                  placeholder="My React Project"
                  className="w-full rounded-lg border border-[#3c3c3c] bg-[#3c3c3c] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#007acc] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="mb-2 block text-sm text-gray-400">Description (optional)</label>
                <input
                  type="text"
                  value={newWorkspace.description}
                  onChange={(e) =>
                    setNewWorkspace({ ...newWorkspace, description: e.target.value })
                  }
                  placeholder="A brief description..."
                  className="w-full rounded-lg border border-[#3c3c3c] bg-[#3c3c3c] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#007acc] focus:outline-none"
                />
              </div>

              {/* Runtime */}
              <div className="mb-6">
                <label className="mb-2 block text-sm text-gray-400">Runtime</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["react", "react-ts", "html", "node", "python", "java"] as const).map((runtime) => (
                    <button
                      key={runtime}
                      onClick={() => setNewWorkspace({ ...newWorkspace, runtime })}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                        newWorkspace.runtime === runtime
                          ? "border-[#007acc] bg-[#007acc]/10"
                          : "border-[#3c3c3c] bg-[#252526] hover:border-[#007acc]"
                      }`}
                    >
                      <span className="text-2xl">{getRuntimeIcon(runtime)}</span>
                      <span className="text-xs font-medium capitalize text-white">
                        {runtime}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={createWorkspace}
                  disabled={!newWorkspace.name.trim() || isCreating}
                  className="flex-1 rounded-lg bg-[#007acc] px-4 py-2 text-sm font-medium text-white hover:bg-[#005a9e] disabled:opacity-50"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Workspace"
                  )}
                </button>

                <button
                  onClick={() => setIsCreating(false)}
                  className="rounded-lg bg-[#3c3c3c] px-4 py-2 text-sm text-gray-400 hover:bg-[#2a2d2e]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

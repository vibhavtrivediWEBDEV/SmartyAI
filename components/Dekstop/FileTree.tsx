/**
 * File Tree Component - BuildUForward-style Nested Folder Tree
 * Supports expand/collapse, nested folders, file icons
 */

"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  FileCode,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import { getFileIconColor } from "@/lib/utils/language";

interface FileNode {
  type: "file" | "folder";
  name: string;
  path: string;
  children?: FileNode[];
  language?: string;
}

interface FileTreeProps {
  files: Array<{ path: string; language: string }>;
  activeFile?: string;
  onFileSelect: (path: string) => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
  onFileAdd?: (path: string) => void;
  onFolderAdd?: (folderPath: string) => void;
  onFolderCreate?: (folderPath: string) => void;
  readOnly?: boolean;
}

/**
 * Build tree structure from flat file list
 */
function buildFileTree(files: Array<{ path: string; language: string }>): FileNode[] {
  const root: FileNode[] = [];

  files.forEach(file => {
    const parts = file.path.split("/").filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;

      if (isFile) {
        // Add file node
        current.push({
          type: "file",
          name: part,
          path: file.path,
          language: file.language,
        });
      } else {
        // Add or find folder node
        let folder = current.find(n => n.type === "folder" && n.name === part);

        if (!folder) {
          folder = {
            type: "folder",
            name: part,
            path: parts.slice(0, index + 1).join("/"),
            children: [],
          };
          current.push(folder);
        }

        current = folder.children!;
      }
    });
  });

  // Sort: folders first, then files, alphabetically
  function sortNodes(nodes: FileNode[]): FileNode[] {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  function sortRecursive(nodes: FileNode[]): FileNode[] {
    return sortNodes(nodes).map(node => {
      if (node.children) {
        return { ...node, children: sortRecursive(node.children) };
      }
      return node;
    });
  }

  return sortRecursive(root);
}

/**
 * File Tree Node Component
 */
function TreeNode({
  node,
  activeFile,
  expandedFolders,
  onToggle,
  onFileSelect,
  onFileDelete,
  onFileRename,
  onFileAdd,
  onFolderCreate,
  level = 0,
}: {
  node: FileNode;
  activeFile?: string;
  expandedFolders: Set<string>;
  onToggle: (path: string) => void;
  onFileSelect: (path: string) => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
  onFileAdd?: (path: string) => void;
  onFolderCreate?: (path: string) => void;
  level?: number;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isActive = activeFile === node.path;
  const isExpanded = expandedFolders.has(node.path);

  const getFileIcon = (filename: string) => {
    const color = getFileIconColor(filename);
    const ext = filename.split(".").pop()?.toLowerCase();

    if (ext === "json") return <FileJson size={16} style={{ color }} />;
    if (ext === "csv") return <FileSpreadsheet size={16} style={{ color }} />;
    if (["js", "jsx", "ts", "tsx", "py", "java"].includes(ext || "")) {
      return <FileCode size={16} style={{ color }} />;
    }

    return <FileText size={16} style={{ color }} />;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  return (
    <div>
      <div
        className={`group relative mx-1 flex min-h-7 cursor-pointer items-center justify-between rounded-md border px-2 py-1 transition-all ${
          isActive
            ? "border-cyan-300/15 bg-linear-to-r from-cyan-400/16 via-blue-500/8 to-transparent text-white shadow-[inset_3px_0_0_#22d3ee]"
            : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (node.type === "folder") {
            onToggle(node.path);
          } else {
            onFileSelect(node.path);
          }
        }}
        onContextMenu={handleContextMenu}
      >
        <div className="flex flex-1 items-center gap-2">
          {node.type === "folder" ? (
            <>
              {isExpanded ? (
                <ChevronDown size={14} className="text-gray-500" />
              ) : (
                <ChevronRight size={14} className="text-gray-500" />
              )}
              <Folder size={16} className={isExpanded ? "text-amber-300" : "text-amber-500/75"} />
              <span className="truncate text-[13px] font-medium">{node.name}</span>
            </>
          ) : (
            <>
              <span style={{ width: 14 }} />
              {getFileIcon(node.name)}
              <span className={`truncate text-[13px] ${isActive ? "font-medium text-cyan-50" : "text-slate-300"}`}>{node.name}</span>
            </>
          )}
        </div>

        {/* Context Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e);
          }}
          className="rounded p-0.5 opacity-0 transition hover:bg-white/10 group-hover:opacity-100"
        >
          <MoreVertical size={12} className="text-gray-500" />
        </button>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div
          className="absolute z-50 rounded-lg border border-[#2d2d2d] bg-[#252526] p-2 shadow-xl"
          style={{
            left: `${(level + 1) * 12 + 50}px`,
            marginTop: "-28px",
          }}
        >
          {node.type === "file" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newName = prompt("New name:", node.name);
                  if (newName && newName !== node.name && onFileRename) {
                    const parentPath = node.path.split("/").slice(0, -1).join("/");
                    const newPath = parentPath ? `${parentPath}/${newName}` : newName;
                    onFileRename(node.path, newPath);
                  }
                  setShowMenu(false);
                }}
                className="w-full rounded px-3 py-1 text-left text-xs text-gray-300 hover:bg-[#2a2d2e]"
              >
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete ${node.path}?`) && onFileDelete) {
                    onFileDelete(node.path);
                  }
                  setShowMenu(false);
                }}
                className="w-full rounded px-3 py-1 text-left text-xs text-red-400 hover:bg-[#2a2d2e]"
              >
                Delete
              </button>
            </>
          )}
          {node.type === "folder" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const fileName = prompt("File name:");
                  if (fileName && onFileAdd) {
                    const newFilePath = node.path
                      ? `${node.path}/${fileName}`
                      : fileName;
                    onFileAdd(newFilePath);
                  }
                  setShowMenu(false);
                }}
                className="w-full rounded px-3 py-1 text-left text-xs text-gray-300 hover:bg-[#2a2d2e]"
              >
                New File
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const folderName = prompt("Folder name:");
                  if (folderName && onFolderCreate) {
                    onFolderCreate(`${node.path}/${folderName}`);
                    if (!isExpanded) onToggle(node.path);
                  }
                  setShowMenu(false);
                }}
                className="w-full rounded px-3 py-1 text-left text-xs text-gray-300 hover:bg-[#2a2d2e]"
              >
                New Folder
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete folder ${node.path}?`) && onFileDelete) {
                    // Delete all files in folder
                    // Note: This would need proper implementation
                  }
                  setShowMenu(false);
                }}
                className="w-full rounded px-3 py-1 text-left text-xs text-red-400 hover:bg-[#2a2d2e]"
              >
                Delete Folder
              </button>
            </>
          )}
        </div>
      )}

      {/* Render children (recursive) */}
      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              activeFile={activeFile}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              onFileSelect={onFileSelect}
              onFileDelete={onFileDelete}
              onFileRename={onFileRename}
              onFileAdd={onFileAdd}
              onFolderCreate={onFolderCreate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main File Tree Component
 */
export default function FileTree({
  files,
  activeFile,
  onFileSelect,
  onFileDelete,
  onFileRename,
  onFileAdd,
  onFolderAdd,
  onFolderCreate,
  readOnly = false,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build tree structure
  const tree = useMemo(() => buildFileTree(files), [files]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between border-y border-white/6 bg-black/10 px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Project files</span>
        {!readOnly && (
          <div className="flex gap-1">
            <button
              onClick={() => {
                const folderName = prompt("New folder name:");
                if (folderName && onFolderCreate) {
                  onFolderCreate(folderName);
                }
              }}
              className="rounded-md border border-transparent p-1 text-slate-500 transition hover:border-amber-300/15 hover:bg-amber-400/8 hover:text-amber-300"
              title="New folder"
            >
              <Folder size={14} />
            </button>
            <button
              onClick={() => {
                const fileName = prompt("New file name:");
                if (fileName && onFileAdd) {
                  onFileAdd(fileName);
                }
              }}
              className="rounded-md border border-transparent p-1 text-slate-500 transition hover:border-cyan-300/15 hover:bg-cyan-400/8 hover:text-cyan-300"
              title="New file"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
        {tree.map(node => (
          <TreeNode
            key={node.path}
            node={node}
            activeFile={activeFile}
            expandedFolders={expandedFolders}
            onToggle={toggleFolder}
            onFileSelect={onFileSelect}
            onFileDelete={onFileDelete}
            onFileRename={onFileRename}
            onFileAdd={onFileAdd}
            onFolderCreate={onFolderCreate}
          />
        ))}
      </div>
    </div>
  );
}

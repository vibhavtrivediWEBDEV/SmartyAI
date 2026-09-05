/**
 * Workspace Types for BuildUForward-style Project Management
 * Each workspace is an isolated project with virtual filesystem
 */

import { ObjectId } from "mongodb";

/**
 * File in a workspace
 */
export interface WorkspaceFile {
  path: string; // e.g., "src/App.jsx", "styles.css"
  content: string;
  language: string; // Monaco language ID
  lastModified?: Date;
  isEntry?: boolean; // Whether this is the entry point file
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  runtime: "react" | "react-ts" | "html" | "node" | "typescript" | "python" | "java" | "sql" | "mongodb";
  entryPoint: string; // e.g., "src/App.jsx"
  autoSave: boolean;
  theme?: string;
  fontSize?: number;
}

/**
 * Workspace Document (MongoDB)
 */
export interface WorkspaceDocument {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  description?: string;
  files: WorkspaceFile[];
  packageJson?: Record<string, any>;
  settings: WorkspaceSettings;
  isPublic: boolean;
  isTemplate: boolean;
  tags: string[];
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Serialized Workspace for API responses
 */
export interface SerializedWorkspace {
  id: string;
  name: string;
  description?: string;
  files: WorkspaceFile[];
  packageJson?: Record<string, any>;
  settings: WorkspaceSettings;
  isPublic: boolean;
  isTemplate: boolean;
  tags: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

/**
 * Console log entry
 */
export interface ConsoleLogEntry {
  id: string;
  type: "log" | "error" | "warn" | "info" | "success";
  message: string;
  timestamp: string;
}

/**
 * Create workspace request
 */
export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  template?: string; // workspace ID to clone
  runtime?: WorkspaceSettings["runtime"];
}

/**
 * Update workspace request
 */
export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  files?: WorkspaceFile[];
  packageJson?: Record<string, any>;
  settings?: Partial<WorkspaceSettings>;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * Run result
 */
export interface RunResult {
  success: boolean;
  output?: string;
  error?: string;
  preview?: string; // HTML content for preview
  logs?: ConsoleLogEntry[];
}

/**
 * Workspace template
 */
export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  runtime: WorkspaceSettings["runtime"];
  files: WorkspaceFile[];
  packageJson?: Record<string, any>;
  tags: string[];
}

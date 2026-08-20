/**
 * Workspace Repository - MongoDB Backend for VS Code Workspaces
 * BuildUForward-style project management
 */

import { ObjectId, type Collection } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { 
  WorkspaceDocument, 
  WorkspaceFile, 
  WorkspaceSettings,
  SerializedWorkspace 
} from "@/lib/types/workspace";

/**
 * Collection name
 */
const COLLECTION_NAME = "workspaces";

/**
 * Get workspaces collection
 */
async function getCollection(): Promise<Collection<WorkspaceDocument>> {
  const db = await getDatabase();
  const collection = db.collection<WorkspaceDocument>(COLLECTION_NAME);
  
  // Create indexes
  await collection.createIndex({ ownerId: 1, createdAt: -1 }, { name: "owner_date" });
  await collection.createIndex({ ownerId: 1, name: 1 }, { name: "owner_name" });
  await collection.createIndex({ isPublic: 1, isTemplate: 1 }, { name: "public_template" });
  await collection.createIndex({ ownerId: 1, lastAccessedAt: -1 }, { name: "recent_access" });
  
  return collection;
}

/**
 * Serialize workspace for API response
 */
function serialize(workspace: WorkspaceDocument): SerializedWorkspace {
  return {
    id: workspace._id.toHexString(),
    name: workspace.name,
    description: workspace.description,
    files: workspace.files,
    packageJson: workspace.packageJson,
    settings: workspace.settings,
    isPublic: workspace.isPublic,
    isTemplate: workspace.isTemplate,
    tags: workspace.tags,
    ownerId: workspace.ownerId.toHexString(),
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
    lastAccessedAt: workspace.lastAccessedAt.toISOString(),
  };
}

/**
 * Infer language from file path
 */
function inferLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    txt: "plaintext",
  };
  return languageMap[ext] || "plaintext";
}

/**
 * Create new workspace
 */
export async function createWorkspace(
  userId: string,
  data: {
    name: string;
    description?: string;
    files?: WorkspaceFile[];
    packageJson?: Record<string, any>;
    settings?: Partial<WorkspaceSettings>;
    isPublic?: boolean;
    tags?: string[];
  }
): Promise<SerializedWorkspace> {
  const collection = await getCollection();
  
  const now = new Date();
  
  // Default files if none provided
  const defaultFiles: WorkspaceFile[] = data.files || [
    {
      path: "App.jsx",
      content: `function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hello World</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
      language: "javascript",
    },
    {
      path: "styles.css",
      content: `body {
  font-family: Arial, sans-serif;
  background: #f5f5f5;
  padding: 20px;
}

h1 {
  color: #333;
}

button {
  padding: 10px 20px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #005a9e;
}`,
      language: "css",
    },
  ];
  
  // Add language if missing
  const filesWithLanguage = defaultFiles.map(file => ({
    ...file,
    language: file.language || inferLanguage(file.path),
  }));
  
  // Default settings
  const defaultSettings: WorkspaceSettings = {
    runtime: data.settings?.runtime || "react",
    entryPoint: data.settings?.entryPoint || "App.jsx",
    autoSave: data.settings?.autoSave ?? true,
    theme: data.settings?.theme || "vs-dark",
    fontSize: data.settings?.fontSize || 14,
    ...data.settings,
  };
  
  // Default package.json for React
  const defaultPackageJson = {
    name: data.name.toLowerCase().replace(/\s+/g, "-"),
    version: "1.0.0",
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
    },
    ...data.packageJson,
  };
  
  const workspace: WorkspaceDocument = {
    _id: new ObjectId(),
    ownerId: new ObjectId(userId),
    name: data.name,
    description: data.description,
    files: filesWithLanguage,
    packageJson: defaultPackageJson,
    settings: defaultSettings,
    isPublic: data.isPublic ?? false,
    isTemplate: false,
    tags: data.tags || [],
    lastAccessedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  
  await collection.insertOne(workspace);
  
  return serialize(workspace);
}

/**
 * Get workspace by ID
 */
export async function getWorkspace(
  userId: string,
  workspaceId: string
): Promise<SerializedWorkspace | null> {
  const collection = await getCollection();
  
  const workspace = await collection.findOne({
    _id: new ObjectId(workspaceId),
    ownerId: new ObjectId(userId),
  });
  
  if (!workspace) {
    return null;
  }
  
  // Update last accessed
  await collection.updateOne(
    { _id: workspace._id },
    { $set: { lastAccessedAt: new Date() } }
  );
  
  return serialize(workspace);
}

/**
 * List user's workspaces
 */
export async function listWorkspaces(
  userId: string,
  options?: {
    limit?: number;
    skip?: number;
    includePublic?: boolean;
  }
): Promise<SerializedWorkspace[]> {
  const collection = await getCollection();
  
  const query = options?.includePublic
    ? { $or: [{ ownerId: new ObjectId(userId) }, { isPublic: true }] }
    : { ownerId: new ObjectId(userId) };
  
  const workspaces = await collection
    .find(query)
    .sort({ lastAccessedAt: -1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 50)
    .toArray();
  
  return workspaces.map(serialize);
}

/**
 * Update workspace
 */
export async function updateWorkspace(
  userId: string,
  workspaceId: string,
  updates: {
    name?: string;
    description?: string;
    files?: WorkspaceFile[];
    packageJson?: Record<string, any>;
    settings?: Partial<WorkspaceSettings>;
    isPublic?: boolean;
    tags?: string[];
  }
): Promise<SerializedWorkspace | null> {
  const collection = await getCollection();
  
  const updateData: any = {
    updatedAt: new Date(),
    lastAccessedAt: new Date(),
  };
  
  if (updates.name) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.files) {
    updateData.files = updates.files.map(file => ({
      ...file,
      language: file.language || inferLanguage(file.path),
    }));
  }
  if (updates.packageJson) updateData.packageJson = updates.packageJson;
  if (updates.settings) updateData.settings = { ...updates.settings };
  if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
  if (updates.tags) updateData.tags = updates.tags;
  
  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(workspaceId),
      ownerId: new ObjectId(userId),
    },
    { $set: updateData },
    { returnDocument: "after" }
  );
  
  return result ? serialize(result) : null;
}

/**
 * Update single file content
 */
export async function updateFile(
  userId: string,
  workspaceId: string,
  filePath: string,
  content: string
): Promise<boolean> {
  const collection = await getCollection();
  
  const result = await collection.updateOne(
    {
      _id: new ObjectId(workspaceId),
      ownerId: new ObjectId(userId),
      "files.path": filePath,
    },
    {
      $set: {
        "files.$.content": content,
        "files.$.lastModified": new Date(),
        updatedAt: new Date(),
      },
    }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Add file to workspace
 */
export async function addFile(
  userId: string,
  workspaceId: string,
  file: WorkspaceFile
): Promise<boolean> {
  const collection = await getCollection();
  
  const fileWithLanguage = {
    ...file,
    language: file.language || inferLanguage(file.path),
  };
  
  const result = await collection.updateOne(
    {
      _id: new ObjectId(workspaceId),
      ownerId: new ObjectId(userId),
    },
    {
      $push: { files: fileWithLanguage },
      $set: { updatedAt: new Date() },
    }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Delete file from workspace
 */
export async function deleteFile(
  userId: string,
  workspaceId: string,
  filePath: string
): Promise<boolean> {
  const collection = await getCollection();
  
  const result = await collection.updateOne(
    {
      _id: new ObjectId(workspaceId),
      ownerId: new ObjectId(userId),
    },
    {
      $pull: { files: { path: filePath } },
      $set: { updatedAt: new Date() },
    }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Delete workspace
 */
export async function deleteWorkspace(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const collection = await getCollection();
  
  const result = await collection.deleteOne({
    _id: new ObjectId(workspaceId),
    ownerId: new ObjectId(userId),
  });
  
  return result.deletedCount > 0;
}

/**
 * Clone workspace (create from template)
 */
export async function cloneWorkspace(
  userId: string,
  templateId: string,
  newName?: string
): Promise<SerializedWorkspace | null> {
  const collection = await getCollection();
  
  const template = await collection.findOne({
    _id: new ObjectId(templateId),
    $or: [{ ownerId: new ObjectId(userId) }, { isPublic: true }],
  });
  
  if (!template) {
    return null;
  }
  
  return createWorkspace(userId, {
    name: newName || `${template.name} (Copy)`,
    description: template.description,
    files: template.files,
    packageJson: template.packageJson,
    settings: template.settings,
    tags: template.tags,
  });
}

/**
 * Get workspace templates
 */
export async function getTemplates(): Promise<SerializedWorkspace[]> {
  const collection = await getCollection();
  
  const templates = await collection
    .find({ isTemplate: true })
    .sort({ name: 1 })
    .toArray();
  
  return templates.map(serialize);
}

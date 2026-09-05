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
    sql: "sql",
    mongo: "json",
    mongodb: "json",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    txt: "plaintext",
  };
  return languageMap[ext] || "plaintext";
}

/**
 * Infer entry point based on template
 */
function inferEntryPoint(template: string): string {
  const entryPoints: Record<string, string> = {
    'react': 'src/App.js',
    'react-ts': 'src/App.tsx',
    'html': 'index.html',
    'node': 'index.js',
    'typescript': 'index.ts',
    'python': 'main.py',
    'java': 'src/Main.java',
    'sql': 'query.sql',
    'mongodb': 'pipeline.mongodb'
  };
  return entryPoints[template] || 'index.js';
}

/**
 * Generate template files based on runtime type
 */
function generateTemplateFiles(template: string, projectName: string): WorkspaceFile[] {
  switch (template) {
    case 'react-ts':
      return [
        {
          path: "package.json",
          content: JSON.stringify({
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            version: "1.0.0",
            description: "TypeScript React application",
            scripts: {
              start: "react-scripts start",
              build: "react-scripts build",
              test: "react-scripts test"
            },
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0"
            },
            devDependencies: {
              "@types/react": "^18.0.0",
              "@types/react-dom": "^18.0.0",
              typescript: "^5.0.0"
            }
          }, null, 2),
          language: "json",
        },
        {
          path: "public/index.html",
          content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>React TypeScript App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>`,
          language: "html",
        },
        {
          path: "src/App.tsx",
          content: `import React from 'react';\nimport './styles.css';\n\nconst App: React.FC = () => {\n  const [count, setCount] = React.useState<number>(0);\n  \n  return (\n    <div className="app">\n      <header className="app-header">\n        <h1>TypeScript React App</h1>\n        <p>Edit src/App.tsx and save to reload.</p>\n        <div className="counter">\n          <p>Count: {count}</p>\n          <button onClick={() => setCount(count + 1)}>\n            Increment\n          </button>\n        </div>\n      </header>\n    </div>\n  );\n};\n\nexport default App;`,
          language: "typescript",
        },
        {
          path: "src/styles.css",
          content: `.app { text-align: center; }\n.app-header { background-color: #3178c6; padding: 20px; color: white; min-height: 100vh; }\nh1 { font-size: 2.5rem; margin-bottom: 1rem; }\np { font-size: 1rem; color: #fff; }\n.counter { margin-top: 2rem; }\nbutton { padding: 10px 24px; background: #235a97; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }\nbutton:hover { background: #1a4a7a; }`,
          language: "css",
        },
        {
          path: "src/index.tsx",
          content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
          language: "typescript",
        },
      ];

    case 'html':
      return [
        {
          path: "index.html",
          content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Website</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div class="container">\n    <h1>Welcome</h1>\n    <p>Edit this HTML file to get started.</p>\n    <button id="btn">Click Me</button>\n    <p id="count">Count: 0</p>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>`,
          language: "html",
        },
        {
          path: "styles.css",
          content: `body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }\n.container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\nh1 { color: #333; }\nbutton { padding: 10px 20px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }\nbutton:hover { background: #005a9e; }`,
          language: "css",
        },
        {
          path: "script.js",
          content: `let count = 0;\nconst btn = document.getElementById('btn');\nconst countEl = document.getElementById('count');\n\nbtn.addEventListener('click', () => {\n  count++;\n  countEl.textContent = 'Count: ' + count;\n});`,
          language: "javascript",
        },
      ];

    case 'node':
      return [
        {
          path: "package.json",
          content: JSON.stringify({
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            version: "1.0.0",
            description: "Node.js coding playground",
            main: "index.js",
            scripts: {
              start: "node index.js"
            }
          }, null, 2),
          language: "json",
        },
        {
          path: "index.js",
          content: `function solve(values) {\n  return values.reduce((total, value) => total + value, 0);\n}\n\nconst answer = solve([1, 2, 3, 4]);\nconsole.log('Answer:', answer);`,
          language: "javascript",
        },
        {
          path: "README.md",
          content: `# ${projectName}\n\nJavaScript coding playground. Edit index.js and click Run.`,
          language: "markdown",
        },
      ];

    case 'typescript':
      return [
        {
          path: "index.ts",
          content: `type Score = { name: string; points: number };\n\nfunction highestScore(scores: Score[]): Score | undefined {\n  return scores.reduce<Score | undefined>((best, score) =>\n    !best || score.points > best.points ? score : best, undefined);\n}\n\nconsole.log(highestScore([\n  { name: 'Ada', points: 92 },\n  { name: 'Grace', points: 98 },\n]));`,
          language: "typescript",
        },
        {
          path: "README.md",
          content: `# ${projectName}\n\nTypeScript coding playground. Edit index.ts and click Run.`,
          language: "markdown",
        },
      ];

    case 'sql':
      return [
        {
          path: "query.sql",
          content: `-- SQL playground\nSELECT department, COUNT(*) AS employee_count\nFROM employees\nGROUP BY department\nORDER BY employee_count DESC;`,
          language: "sql",
        },
        {
          path: "README.md",
          content: `# ${projectName}\n\nWrite one or more SQL statements in query.sql and click Run to validate them.`,
          language: "markdown",
        },
      ];

    case 'mongodb':
      return [
        {
          path: "pipeline.mongodb",
          content: `[\n  { "$match": { "status": "active" } },\n  { "$group": { "_id": "$department", "total": { "$sum": 1 } } },\n  { "$sort": { "total": -1 } }\n]`,
          language: "json",
        },
        {
          path: "README.md",
          content: `# ${projectName}\n\nEdit pipeline.mongodb as a JSON aggregation pipeline and click Run to validate it.`,
          language: "markdown",
        },
      ];

    case 'python':
      return [
        {
          path: "main.py",
          content: `# Python Application\n\ndef main():\n    count = 0\n    while True:\n        user_input = input("Enter 'inc' to increment, 'quit' to exit: ")\n        \n        if user_input == 'quit':\n            print(f"Final count: {count}")\n            break\n        elif user_input == 'inc':\n            count += 1\n            print(f"Count: {count}")\n        else:\n            print("Unknown command")\n\nif __name__ == "__main__":\n    main()`,
          language: "python",
        },
        {
          path: "requirements.txt",
          content: `# Add your Python dependencies here\n# Example:\n# requests==2.31.0\n# flask==2.3.0`,
          language: "plaintext",
        },
        {
          path: "README.md",
          content: `# ${projectName}\n\nPython application.\n\n## Setup\n\n\`\`\`bash\npython main.py\n\`\`\``,
          language: "markdown",
        },
      ];

    case 'java':
      return [
        {
          path: "src/Main.java",
          content: `public class Main {\n    private static int count = 0;\n    \n    public static void main(String[] args) {\n        System.out.println("Java Application");\n        \n        for (int i = 0; i < 5; i++) {\n            increment();\n        }\n        System.out.println("Final count: " + count);\n    }\n    \n    public static void increment() {\n        count++;\n        System.out.println("Count: " + count);\n    }\n}`,
          language: "java",
        },
        {
          path: "README.md",
          content: `# ${projectName}\n\nJava application.\n\n## Compile\n\n\`\`\`bash\njavac src/Main.java\njava -cp src Main\n\`\`\``,
          language: "markdown",
        },
      ];

    case 'react':
    default:
      return [
        {
          path: "package.json",
          content: JSON.stringify({
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            version: "1.0.0",
            description: "React application",
            scripts: {
              start: "react-scripts start",
              build: "react-scripts build",
              test: "react-scripts test"
            },
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              "react-scripts": "5.0.1"
            }
          }, null, 2),
          language: "json",
        },
        {
          path: "public/index.html",
          content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>React App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>`,
          language: "html",
        },
        {
          path: "src/App.js",
          content: `import React from 'react';\nimport './styles.css';\n\nfunction App() {\n  const [count, setCount] = React.useState(0);\n  \n  return (\n    <div className="app">\n      <header className="app-header">\n        <h1>React App</h1>\n        <p>Edit src/App.js and save to reload.</p>\n        <div className="counter">\n          <p>Count: {count}</p>\n          <button onClick={() => setCount(count + 1)}>\n            Increment\n          </button>\n        </div>\n      </header>\n    </div>\n  );\n}\n\nexport default App;`,
          language: "javascript",
        },
        {
          path: "src/styles.css",
          content: `.app {\n  text-align: center;\n}\n\n.app-header {\n  background-color: #282c34;\n  padding: 20px;\n  color: white;\n  min-height: 100vh;\n}\n\nh1 {\n  font-size: 2.5rem;\n  margin-bottom: 1rem;\n}\n\np {\n  font-size: 1rem;\n  color: #61dafb;\n}\n\n.counter {\n  margin-top: 2rem;\n}\n\nbutton {\n  padding: 10px 24px;\n  background: #61dafb;\n  color: #282c34;\n  border: none;\n  border-radius: 4px;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n\nbutton:hover {\n  background: #21a9c7;\n}`,
          language: "css",
        },
        {
          path: "src/index.js",
          content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
          language: "javascript",
        },
      ];
  }
}

/**
 * Seed React Loader Project - Complete project with loader components
 */
export async function seedLoaderProject(userId: string): Promise<SerializedWorkspace> {
  const collection = await getCollection();
  const now = new Date();
  
  const loaderProject: WorkspaceDocument = {
    _id: new ObjectId(),
    ownerId: new ObjectId(userId),
    name: "CSS Loading Spinners",
    description: "React app with pure CSS loading spinners and button states",
    files: [
      {
        path: "package.json",
        content: JSON.stringify({
          name: "css-loading-spinners",
          version: "1.0.0",
          description: "Pure CSS loading spinners with React",
          scripts: {
            start: "react-scripts start",
            build: "react-scripts build",
            test: "react-scripts test"
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1"
          }
        }, null, 2),
        language: "json",
      },
      {
        path: "public/index.html",
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CSS Loading Spinners</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
        language: "html",
      },
      {
        path: "src/App.js",
        content: `import './styles.css';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '40px 24px' }}>
      <h1
        style={{
          textAlign: 'center',
          marginBottom: '8px',
          fontSize: '24px',
          fontWeight: 700,
        }}
      >
        CSS Loading Spinners
      </h1>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '48px' }}>
        Pure CSS — @keyframes, border-radius, animation
      </p>

      <div className="spinner-container">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-sm" role="status" aria-label="Loading" />
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>Small</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-md" />
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>Medium</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" />
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>Large</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '64px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600 }}>
          Button States
        </h2>
        <div className="button-container">
          <button className="btn-loading" type="button" disabled>
            Loading...
          </button>

          <button className="btn-loaded" type="button">
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
}`,
        language: "javascript",
      },
      {
        path: "src/styles.css",
        content: `.app {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40px 24px;
}

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 48px;
  margin-bottom: 64px;
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* Spinner Base Styles */
.spinner {
  border-radius: 50%;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  width: 24px;
  height: 24px;
}

.spinner-md {
  width: 40px;
  height: 40px;
}

.spinner-lg {
  width: 56px;
  height: 56px;
}

/* Keyframes */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Button Styles */
button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-loading {
  background: #94a3b8;
  color: white;
  cursor: not-allowed;
  position: relative;
  padding-left: 40px;
}

.btn-loading::before {
  content: '';
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-loaded {
  background: #10b981;
  color: white;
}

.btn-loaded:hover {
  background: #059669;
}`,
        language: "css",
      },
      {
        path: "src/index.js",
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
        language: "javascript",
      },
      {
        path: "README.md",
        content: `# CSS Loading Spinners

React application showcasing pure CSS loading spinners and button states.

## Features

- **3 Spinner Sizes**: Small (24px), Medium (40px), Large (56px)
- **Button States**: Loading state with spinner, Loaded state with checkmark
- **Pure CSS**: Uses @keyframes animations, no external libraries
- **Accessible**: Includes role="status" and aria labels

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Project Structure

- \`src/App.js\` - Main component with spinners and buttons
- \`src/styles.css\` - CSS animations and styling
- \`src/index.js\` - Entry point

## Customization

Edit \`src/styles.css\` to change:
- Spinner colors (change #3b82f6 and #e5e7eb)
- Animation speed (change 0.8s in animation duration)
- Sizes (modify spinner-sm, spinner-md, spinner-lg)`,
        language: "markdown",
      },
    ],
    packageJson: {
      name: "css-loading-spinners",
      version: "1.0.0",
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
    },
    settings: {
      runtime: "react",
      entryPoint: "src/App.js",
      autoSave: true,
      theme: "vs-dark",
      fontSize: 14,
    },
    isPublic: true,
    isTemplate: true,
    tags: ["react", "css", "animations", "loaders", "spinners"],
    lastAccessedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(loaderProject);
  return serialize(loaderProject);
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
  
  // Generate files based on selected template (fallback to 'react' if not specified)
  const template = data.settings?.runtime || 'react';
  const defaultFiles: WorkspaceFile[] = data.files || generateTemplateFiles(template, data.name);
  
  // Add language if missing
  const filesWithLanguage = defaultFiles.map(file => ({
    ...file,
    language: file.language || inferLanguage(file.path),
  }));
  
  // Default settings
  const defaultSettings: WorkspaceSettings = {
    runtime: template,
    entryPoint: data.settings?.entryPoint || inferEntryPoint(template),
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
    includeTemplates?: boolean;
  }
): Promise<SerializedWorkspace[]> {
  const collection = await getCollection();
  
  // Build query
  const orConditions: any[] = [{ ownerId: new ObjectId(userId) }];
  
  if (options?.includePublic) {
    orConditions.push({ isPublic: true });
  }
  
  if (options?.includeTemplates !== false) {
    // Include templates by default
    orConditions.push({ isTemplate: true });
  }
  
  const query = { $or: orConditions };
  
  const workspaces = await collection
    .find(query)
    .sort({ lastAccessedAt: -1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 50)
    .toArray();
  
  return workspaces.map(serialize);
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  fileCount: number;
  lastAccessedAt: string;
}

/**
 * List lightweight workspace metadata without transferring file contents.
 */
export async function listWorkspaceSummaries(
  userId: string,
  options?: {
    limit?: number;
    skip?: number;
    includePublic?: boolean;
    includeTemplates?: boolean;
  }
): Promise<WorkspaceSummary[]> {
  const collection = await getCollection();
  const orConditions: any[] = [{ ownerId: new ObjectId(userId) }];

  if (options?.includePublic) orConditions.push({ isPublic: true });
  if (options?.includeTemplates !== false) orConditions.push({ isTemplate: true });

  const workspaces = await collection
    .aggregate<{
      _id: ObjectId;
      name: string;
      fileCount: number;
      lastAccessedAt: Date;
    }>([
      { $match: { $or: orConditions } },
      { $sort: { lastAccessedAt: -1 } },
      { $skip: options?.skip || 0 },
      { $limit: options?.limit || 50 },
      {
        $project: {
          name: 1,
          fileCount: { $size: { $ifNull: ['$files', []] } },
          lastAccessedAt: 1,
        },
      },
    ])
    .toArray();

  return workspaces.map(workspace => ({
    id: workspace._id.toHexString(),
    name: workspace.name,
    fileCount: workspace.fileCount,
    lastAccessedAt: workspace.lastAccessedAt.toISOString(),
  }));
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
  try {
    const collection = await getCollection();
    
    console.log('[updateFile] Attempting to save:', { userId, workspaceId, filePath });
    
    // First check if workspace exists
    const workspace = await collection.findOne({
      _id: new ObjectId(workspaceId),
      ownerId: new ObjectId(userId),
    });
    
    if (!workspace) {
      console.error('[updateFile] Workspace not found:', { workspaceId, userId });
      return false;
    }
    
    console.log('[updateFile] Workspace found, checking files...', {
      filesCount: workspace.files?.length || 0,
      filesType: Array.isArray(workspace.files) ? 'array' : typeof workspace.files
    });
    
    // Ensure files is an array
    if (!workspace.files || !Array.isArray(workspace.files)) {
      console.log('[updateFile] Files not initialized, creating file...');
      const newFile: WorkspaceFile = {
        path: filePath,
        content,
        language: inferLanguage(filePath),
        lastModified: new Date(),
      };
      
      const result = await collection.updateOne(
        {
          _id: new ObjectId(workspaceId),
          ownerId: new ObjectId(userId),
        },
        {
          $set: {
            files: [newFile],
            updatedAt: new Date(),
          },
        }
      );
      
      console.log('[updateFile] Added first file:', result.modifiedCount > 0);
      return result.modifiedCount > 0;
    }
    
    const fileExists = workspace.files.some(f => f.path === filePath);
    
    if (!fileExists) {
      // File doesn't exist, add it instead
      console.log('[updateFile] File not found, adding new file:', filePath);
      const newFile: WorkspaceFile = {
        path: filePath,
        content,
        language: inferLanguage(filePath),
        lastModified: new Date(),
      };
      
      const result = await collection.updateOne(
        {
          _id: new ObjectId(workspaceId),
          ownerId: new ObjectId(userId),
        },
        {
          $push: { files: newFile } as any,
          $set: { updatedAt: new Date() },
        }
      );
      
      console.log('[updateFile] Added new file:', result.modifiedCount > 0);
      return result.modifiedCount > 0;
    }
    
    // File exists, update it
    console.log('[updateFile] Updating existing file:', filePath);
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
    
    console.log('[updateFile] Update result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('[updateFile] Error:', error);
    return false;
  }
}

/**
 * Update multiple file buffers with one workspace read and one database write.
 */
export async function updateFiles(
  userId: string,
  workspaceId: string,
  updates: Array<{ path: string; content: string }>
): Promise<Array<{ path: string; success: boolean }>> {
  if (updates.length === 0) return [];

  try {
    const collection = await getCollection();
    const workspace = await collection.findOne({
      _id: new ObjectId(workspaceId),
      ownerId: new ObjectId(userId),
    });
    if (!workspace) return updates.map(({ path }) => ({ path, success: false }));

    const updateMap = new Map(updates.map(file => [file.path, file.content]));
    const now = new Date();
    const existingFiles = Array.isArray(workspace.files) ? workspace.files : [];
    const existingPaths = new Set(existingFiles.map(file => file.path));
    const files = existingFiles.map(file => updateMap.has(file.path)
      ? { ...file, content: updateMap.get(file.path)!, lastModified: now }
      : file
    );

    for (const file of updates) {
      if (!existingPaths.has(file.path)) {
        files.push({
          path: file.path,
          content: file.content,
          language: inferLanguage(file.path),
          lastModified: now,
        });
      }
    }

    const result = await collection.updateOne(
      { _id: workspace._id, ownerId: new ObjectId(userId) },
      { $set: { files, updatedAt: now } }
    );
    const success = result.matchedCount === 1;
    return updates.map(({ path }) => ({ path, success }));
  } catch (error) {
    console.error('[updateFiles] Error:', error);
    return updates.map(({ path }) => ({ path, success: false }));
  }
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
      $push: { files: fileWithLanguage as WorkspaceFile },
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
      $pull: { files: { path: filePath } as WorkspaceFile },
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
 * Rename file in workspace
 */
export async function renameFile(
  userId: string,
  workspaceId: string,
  oldPath: string,
  newPath: string
): Promise<boolean> {
  const collection = await getCollection();
  
  // Get current workspace
  const workspace = await collection.findOne({
    _id: new ObjectId(workspaceId),
    ownerId: new ObjectId(userId),
  });
  
  if (!workspace) return false;
  
  // Update the file path
  const updatedFiles = workspace.files.map(file => {
    if (file.path === oldPath) {
      return {
        ...file,
        path: newPath,
        language: inferLanguage(newPath),
      };
    }
    return file;
  });
  
  const result = await collection.updateOne(
    {
      _id: new ObjectId(workspaceId),
      ownerId: new ObjectId(userId),
    },
    {
      $set: {
        files: updatedFiles,
        updatedAt: new Date(),
      },
    }
  );
  
  return result.modifiedCount > 0;
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


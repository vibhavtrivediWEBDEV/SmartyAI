/**
 * MongoDB Workspace Seeding Script
 * Creates 3 seed projects after clearing development data
 * 
 * Usage: npx tsx scripts/seed-workspace-projects.ts
 */

import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/db/mongodb";

const PROJECTS_COLLECTION = "workspaces";

interface SeedFile {
  path: string;
  content: string;
  language: string;
}

interface SeedProject {
  name: string;
  description: string;
  files: SeedFile[];
  settings: {
    runtime: "react" | "html" | "node" | "python" | "java";
    entryPoint: string;
    autoSave: boolean;
  };
  packageJson?: Record<string, any>;
}

const PROJECTS: SeedProject[] = [
  // Project A: HTML Starter
  {
    name: "HTML Starter",
    description: "Simple HTML project with index.html and README",
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Starter</title>
</head>
<body>
  <h1>Welcome to SmartyAI</h1>
  <p>This is a simple HTML starter project.</p>
  <button onclick="sayHello()">Click Me</button>
  
  <script>
    function sayHello() {
      alert('Hello from SmartyAI!');
    }
  </script>
</body>
</html>`,
        language: "html",
      },
      {
        path: "README.md",
        content: `# HTML Starter Project

A simple HTML starter template.

## Features
- Basic HTML5 structure
- Inline JavaScript example
- Responsive design

## Getting Started
Open \`index.html\` to start editing.
`,
        language: "markdown",
      },
    ],
    settings: {
      runtime: "html",
      entryPoint: "index.html",
      autoSave: true,
    },
  },

  // Project B: Web Starter
  {
    name: "Web Starter",
    description: "HTML/CSS/JS starter with modern styling",
    files: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Starter</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Web Starter Project</h1>
    <div class="card">
      <h2>Counter Example</h2>
      <p id="counter">Count: 0</p>
      <div class="buttons">
        <button onclick="increment()">Increment</button>
        <button onclick="decrement()">Decrement</button>
        <button onclick="reset()">Reset</button>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
        language: "html",
      },
      {
        path: "styles.css",
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  max-width: 800px;
  padding: 40px;
}

h1 {
  color: white;
  text-align: center;
  margin-bottom: 40px;
  font-size: 3em;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

#counter {
  font-size: 48px;
  text-align: center;
  color: #667eea;
  margin: 30px 0;
  font-weight: bold;
}

.buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

button {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background: #667eea;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

button:active {
  transform: translateY(0);
}`,
        language: "css",
      },
      {
        path: "script.js",
        content: `// Counter State
let count = 0;

// Update counter display
function updateDisplay() {
  const counterElement = document.getElementById('counter');
  counterElement.textContent = \`Count: \${count}\`;
  
  // Log to console (will show in SmartyAI console)
  console.log(\`Counter updated: \${count}\`);
}

// Increment counter
function increment() {
  count++;
  updateDisplay();
}

// Decrement counter
function decrement() {
  count--;
  updateDisplay();
}

// Reset counter
function reset() {
  count = 0;
  updateDisplay();
  console.log('Counter reset to 0');
}

// Initialize
updateDisplay();
console.log('Web Starter Project loaded successfully!');`,
        language: "javascript",
      },
      {
        path: "README.md",
        content: `# Web Starter Project

A modern web project with HTML, CSS, and JavaScript.

## Features
- Modern gradient design
- Counter example with state
- Responsive layout
- Clean CSS architecture
- Modular JavaScript

## Project Structure
\`\`\`
/
├── index.html    - Main HTML file
├── styles.css    - Styling
├── script.js     - JavaScript logic
└── README.md     - Documentation
\`\`\`

## Usage
1. Open \`index.html\` to see the preview
2. Edit \`styles.css\` to customize design
3. Modify \`script.js\` to change behavior
`,
        language: "markdown",
      },
    ],
    settings: {
      runtime: "html",
      entryPoint: "index.html",
      autoSave: true,
    },
  },

  // Project C: React Starter
  {
    name: "React Starter",
    description: "React project with components, state, and styling",
    files: [
      {
        path: "public/index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Starter</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
        language: "html",
      },
      {
        path: "src/App.jsx",
        content: `import React, { useState } from 'react';
import Counter from './components/Counter';
import Pagination from './components/Pagination';
import './styles.css';

function App() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="app">
      <header className="header">
        <h1>React Starter Project</h1>
        <p>SmartAI Workspace with Multi-File Support</p>
      </header>

      <main className="main">
        <Counter />
        
        <div className="section">
          <h2>Pagination Example</h2>
          <Pagination 
            currentPage={currentPage}
            totalPages={5}
            onPageChange={setCurrentPage}
          />
          <p className="page-info">Current Page: {currentPage}</p>
        </div>
      </main>

      <footer className="footer">
        <p>Built with ❤️ using SmartyAI</p>
      </footer>
    </div>
  );
}

export default App;`,
        language: "javascript",
      },
      {
        path: "src/main.jsx",
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('React Starter Project loaded!');`,
        language: "javascript",
      },
      {
        path: "src/components/Counter.jsx",
        content: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  const increment = () => {
    setCount(count + step);
    console.log(\`Counter incremented by \${step}: \${count + step}\`);
  };

  const decrement = () => {
    setCount(count - step);
    console.log(\`Counter decremented by \${step}: \${count - step}\`);
  };

  const reset = () => {
    setCount(0);
    console.log('Counter reset');
  };

  return (
    <div className="counter">
      <h2>Counter Component</h2>
      
      <div className="counter-display">
        <span className="count">{count}</span>
      </div>

      <div className="counter-controls">
        <button onClick={decrement} className="btn btn-secondary">
          -{step}
        </button>
        <button onClick={reset} className="btn btn-outline">
          Reset
        </button>
        <button onClick={increment} className="btn btn-primary">
          +{step}
        </button>
      </div>

      <div className="step-control">
        <label>Step: </label>
        <input
          type="number"
          value={step}
          onChange={(e) => setStep(parseInt(e.target.value) || 1)}
          min="1"
          max="10"
          className="step-input"
        />
      </div>
    </div>
  );
}

export default Counter;`,
        language: "javascript",
      },
      {
        path: "src/components/Pagination.jsx",
        content: `import React from 'react';

function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        Previous
      </button>

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={\`pagination-btn \${currentPage === page ? 'active' : ''}\`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;`,
        language: "javascript",
      },
      {
        path: "src/styles.css",
        content: `/* App Styles */
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.header h1 {
  font-size: 3em;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.header p {
  font-size: 1.2em;
  opacity: 0.9;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 40px;
  margin-top: 30px;
  color: #333;
}

.section h2 {
  margin-bottom: 20px;
  color: #667eea;
}

/* Counter Styles */
.counter {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  color: #333;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

.counter h2 {
  margin-bottom: 30px;
  color: #667eea;
}

.counter-display {
  margin: 40px 0;
}

.count {
  font-size: 72px;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.counter-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 30px;
}

.btn {
  padding: 12px 32px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #764ba2;
  color: white;
}

.btn-secondary:hover {
  background: #634091;
  transform: translateY(-2px);
}

.btn-outline {
  background: transparent;
  border: 2px solid #667eea;
  color: #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

.step-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.step-input {
  width: 60px;
  padding: 8px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 6px;
  text-align: center;
}

/* Pagination Styles */
.pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.pagination-btn {
  padding: 8px 16px;
  font-size: 14px;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.pagination-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.pagination-btn.active {
  background: #667eea;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

/* Footer */
.footer {
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  margin-top: 60px;
}`,
        language: "css",
      },
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: "react-starter",
            version: "1.0.0",
            description: "React Starter Project - SmartyAI Workspace",
            private: true,
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
          },
          null,
          2
        ),
        language: "json",
      },
      {
        path: "README.md",
        content: `# React Starter Project

A modern React application with component-based architecture.

## Features
- React 18 with Hooks
- Component-based architecture
- State management with useState
- Modern CSS styling
- Multi-file structure
- Pagination example
- Counter with customizable step

## Project Structure
\`\`\`
react-starter/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Counter.jsx
│   │   └── Pagination.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── package.json
└── README.md
\`\`\`

## Components

### Counter
Interactive counter with:
- Increment/Decrement buttons
- Customizable step size
- Reset functionality
- Console logging

### Pagination
Navigation component with:
- Previous/Next buttons
- Page number buttons
- Active state highlighting
- Disabled state handling

## Getting Started
1. Open \`src/App.jsx\` to see the main app
2. Edit \`src/components/Counter.jsx\` to modify counter
3. Edit \`src/components/Pagination.jsx\` to customize pagination
4. Modify \`src/styles.css\` to change styling

## Console Output
All counter operations log to the SmartyAI console.
`,
        language: "markdown",
      },
    ],
    settings: {
      runtime: "react",
      entryPoint: "src/main.jsx",
      autoSave: true,
    },
    packageJson: {
      name: "react-starter",
      version: "1.0.0",
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
      },
    },
  },
];

async function seedProjects() {
  try {
    console.log("🌱 Starting MongoDB workspace seeding...");
    console.log("");

    const db = await getDatabase();
    const collection = db.collection(PROJECTS_COLLECTION);

    // Step 1: Clear development data
    console.log("🗑️  Clearing development workspace data...");
    const deleteResult = await collection.deleteMany({});
    console.log(`   ✓ Deleted ${deleteResult.deletedCount} existing workspaces`);
    console.log("");

    // Step 2: Insert seed projects
    console.log("📦 Creating seed projects...");

    for (const project of PROJECTS) {
      const now = new Date();
      const doc = {
        _id: new ObjectId(),
        ownerId: new ObjectId(), // System user for seed projects
        name: project.name,
        description: project.description,
        files: project.files,
        packageJson: project.packageJson,
        settings: project.settings,
        isPublic: true,
        isTemplate: true,
        tags: [],
        lastAccessedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await collection.insertOne(doc);
      console.log(`   ✓ Created: ${project.name} (${project.files.length} files)`);
    }

    console.log("");
    console.log("✅ Seeding complete!");
    console.log(`   Created ${PROJECTS.length} projects:`);
    console.log("   - HTML Starter (2 files)");
    console.log("   - Web Starter (4 files)");
    console.log("   - React Starter (8 files)");
    console.log("");
    console.log("🎉 Ready to use! Open SmartyAI and start coding.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run seeding
seedProjects();

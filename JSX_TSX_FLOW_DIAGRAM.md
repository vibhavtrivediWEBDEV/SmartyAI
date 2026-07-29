# JSX/TSX Preview - Complete Flow Diagram

## 🔄 TRANSFORMATION PIPELINE

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER CREATES FILE                            │
│                  (App.jsx or App.tsx)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER CLICKS RUN ▶️                            │
│                   (handleRun() function)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               DETECT FILE TYPE                                   │
│         getRunStrategy('App.tsx')                                │
│                  ↓                                               │
│         Returns: 'react-bundle'                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│               BUNDLE REACT CODE                                  │
│          bundleReact('App.tsx', files)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 1: Read File Content                                 │  │
│  │   const code = "import { useState } from 'react';"       │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 2: Strip TypeScript (if .tsx)                        │  │
│  │                                                           │  │
│  │   ✅ Remove interfaces:                                   │  │
│  │      interface Props { }  →  (removed)                   │  │
│  │                                                           │  │
│  │   ✅ Remove type annotations:                             │  │
│  │      { prop }: Type       →  { prop }                    │  │
│  │      (param: Type)        →  (param)                     │  │
│  │                                                           │  │
│  │   ✅ Remove generics:                                     │  │
│  │      useState<Type>()     →  useState()                  │  │
│  │                                                           │  │
│  │   ✅ PRESERVE function declarations:                      │  │
│  │      function App() { }   →  function App() { }  ✓       │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 3: Transform Imports                                 │  │
│  │                                                           │  │
│  │   ✅ ES6 imports → Global React:                          │  │
│  │      import { useState, useEffect } from "react"         │  │
│  │                       ↓                                  │  │
│  │      const { useState, useEffect } = React;             │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 4: Remove Exports                                    │  │
│  │                                                           │  │
│  │   ✅ Remove export statements:                            │  │
│  │      export default App;   →  (removed)                  │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ RESULT: Browser-ready Code                                │  │
│  │                                                           │  │
│  │   const { useState } = React;                            │  │
│  │   function App({ prop }) {                               │  │
│  │     const [count, setCount] = useState(0);               │  │
│  │     return <div>{count}</div>;                           │  │
│  │   }                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          GENERATE PREVIEW HTML                                   │
│       generateReactPreview(transformedCode)                     │
│                                                                  │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ HTML Template with:                                    │    │
│   │                                                        │    │
│   │  <!DOCTYPE html>                                       │    │
│   │  <html>                                                │    │
│   │  <head>                                                │    │
│   │    <!-- Load React 18 from CDN -->                     │    │
│   │    <script crossorigin                                │    │
│   │      src="https://unpkg.com/react@18/...">            │    │
│   │    </script>                                           │    │
│   │                                                        │    │
│   │    <!-- Load ReactDOM 18 from CDN -->                  │    │
│   │    <script crossorigin                                │    │
│   │      src="https://unpkg.com/react-dom@18/...">        │    │
│   │    </script>                                           │    │
│   │                                                        │    │
│   │    <!-- Load Babel Standalone from CDN -->             │    │
│   │    <script crossorigin                                │    │
│   │      src="https://unpkg.com/@babel/standalone/...">   │    │
│   │    </script>                                           │    │
│   │  </head>                                               │    │
│   │  <body>                                                │    │
│   │    <div id="root"></div>                               │    │
│   │                                                        │    │
│   │    <!-- User's transformed code -->                    │    │
│   │    <script type="text/babel"                          │    │
│   │            data-presets="react,typescript">            │    │
│   │      ${transformedCode}                                │    │
│   │    </script>                                           │    │
│   │  </body>                                               │    │
│   │  </html>                                               │    │
│   └───────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          INJECT INTO IFRAME                                      │
│     iframeRef.current.srcdoc = html                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ <iframe                                                 │    │
│  │   sandbox="allow-scripts allow-same-origin"  ✅        │    │
│  │   srcdoc={html}                                         │    │
│  │ />                                                      │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          BROWSER LOADS IFRAME                                    │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ SEQUENTIAL LOADING:                                     │     │
│  │                                                         │     │
│  │  1. Load React 18 (CDN)                    ✅ Success │     │
│  │     window.React = { useState, useEffect, ... }       │     │
│  │                                                         │     │
│  │  2. Load ReactDOM 18 (CDN)                 ✅ Success │     │
│  │     window.ReactDOM.createRoot()                       │     │
│  │                                                         │     │
│  │  3. Load Babel Standalone (CDN)            ✅ Success │     │
│  │     window.Babel.transform(code, { presets })         │     │
│  │                                                         │     │
│  │  4. Parse <script type="text/babel">      ✅ Found    │     │
│  │     Extract: const { useState } = React;              │     │
│  │             function App() { return <div/>; }        │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          BABEL TRANSPILES CODE                                   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ INPUT (JSX):                                            │     │
│  │   const { useState } = React;                          │     │
│  │   function App() {                                      │     │
│  │     const [count, setCount] = useState(0);             │     │
│  │     return <div>{count}</div>;                         │     │
│  │   }                                                      │     │
│  │                                                         │     │
│  │ OUTPUT (JavaScript):                                    │     │
│  │   const { useState } = React;                          │     │
│  │   function App() {                                      │     │
│  │     const [count, setCount] = useState(0);             │     │
│  │     return React.createElement('div', null, count);   │     │
│  │   }                                                      │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          EXECUTE TRANSFORMED CODE                                │
│       eval(transpiledJavaScript)                                │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ EXECUTION RESULT:                                       │     │
│  │                                                         │     │
│  │  - window.App = function App() { ... }                 │     │
│  │  - React hooks initialized                              │     │
│  │  - Component ready to mount                             │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          AUTO-MOUNT COMPONENT                                    │
│        setTimeout(() => { ... mount ... })                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ MOUNTING LOGIC:                                         │     │
│  │                                                         │     │
│  │  1. Find component in window:                          │     │
│  │     - Check window.App                                 │     │
│  │     - Check window.Counter                             │     │
│  │     - Check window.Main                                │     │
│  │     - etc.                                              │     │
│  │                                                         │     │
│  │  2. Create root:                                       │     │
│  │     const root = ReactDOM.createRoot(                  │     │
│  │       document.getElementById('root')                  │     │
│  │     );                                                  │     │
│  │                                                         │     │
│  │  3. Render:                                             │     │
│  │     root.render(<App />);                              │     │
│  │     ✅ Component mounted successfully!                  │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          RENDERING                                                │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ REACT RENDERING:                                        │     │
│  │                                                         │     │
│  │  - React reconciler processes component                │     │
│  │  - Virtual DOM created                                  │     │
│  │  - Real DOM updated                                     │     │
│  │  - HTML rendered in iframe                              │     │
│  │                                                         │     │
│  │  RESULT:                                                │     │
│  │  ┌──────────────────────────────────┐                 │     │
│  │  │  <div>                            │                 │     │
│  │  │    <h1>✅ React Counter</h1>     │                 │     │
│  │  │    <p>0</p>                       │                 │     │
│  │  │    <button>Click Me</button>     │                 │     │
│  │  │  </div>                           │                 │     │
│  │  └──────────────────────────────────┘                 │     │
│  │  ✅ USER SEES RENDERED COMPONENT                       │     │
│  └───────────────────────────────────────────────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          USER INTERACTION                                         │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ USER CLICKS BUTTON:                                     │     │
│  │                                                         │     │
│  │  1. onClick={() => setCount(count + 1)}               │     │
│  │  2. State updated: count = 1                           │     │
│  │  3. Component re-renders                                │     │
│  │  4. DOM updated: <p>1</p>                              │     │
│  │  5. User sees updated counter                          │     │
│  │  ✅ INTERACTIVE COMPONENT WORKING!                      │     │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 KEY POINTS

### Transformations Applied:
1. ✅ **TypeScript Stripped**: All types removed
2. ✅ **Imports Transformed**: ES6 → Global React
3. ✅ **Exports Removed**: No module system needed
4. ✅ **Function Preserved**: Names maintained
5. ✅ **JSX Transpiled**: Babel converts to React.createElement

### Sandbox Permissions:
```
sandbox="allow-scripts allow-same-origin"
           ↑                    ↑
           │                    └── Allows CDN loading
           └── Allows script execution
```

### CDN Dependencies:
- React 18: `https://unpkg.com/react@18/umd/react.development.js`
- ReactDOM 18: `https://unpkg.com/react-dom@18/umd/react-dom.development.js`
- Babel: `https://unpkg.com/@babel/standalone/babel.min.js`

---

## ✅ SUCCESS INDICATORS

When everything works, you should see:
1. ✅ Console: "Bundling React/TypeScript code..."
2. ✅ Console: "React app bundled and running"
3. ✅ Preview: Component rendered
4. ✅ Network: CDN scripts loaded (200 OK)
5. ✅ Interactive: Click, type, update works

---

*This diagram shows the complete flow from user action to rendered preview.*

# Quick Test Guide - JSX/TSX in VS Code

## 🧪 Test Procedure

### Step 1: Open VS Code Component
Navigate to: `http://localhost:3001/desktop/vscode`

### Step 2: Create Test File
Click "New File" and name it: `test.jsx`

### Step 3: Paste This Code:

```jsx
import React, { useState } from "react";

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1 style={{ color: "#667eea" }}>🧪 Test Counter</h1>
      <p style={{ fontSize: 24 }}>Count: {count}</p>
      
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          background: "#007AFF",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginRight: "10px"
        }}
      >
        Increment +1
      </button>
      
      <button 
        onClick={() => setCount(0)}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          background: "#f0f0f0",
          color: "#333",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Reset
      </button>
    </div>
  );
}

export default App;
```

### Step 4: Click Run (▶️)

### Step 5: Expected Console Output

```
[bundler] Processing JSX/TSX for: test.jsx
[bundler] Code ready, length: XXX
📦 [IFRAME] Transpiling code...
📦 [IFRAME] Code to transpile: const { useState } = React;
function App() { ...
📦 [IFRAME] Transpiled successfully
📦 [IFRAME] Transpiled code: function App() { var [count, setCount] = ...
✅ React app mounted successfully
```

---

## ✅ Success Indicators

| Check | Expected |
|-------|----------|
| Import transformation | `const { useState } = React;` |
| Function preserved | `function App() {` (NOT `App() {`) |
| JSX transpiled | `React.createElement("div", ...)` |
| Component mounted | "✅ React app mounted successfully" |
| Preview visible | Counter with increment/reset buttons |

---

## ❌ Common Errors & Fixes

### Error 1: `useState is not defined`
**Cause**: Import not transformed  
**Check**: Console should show `const { useState } = React;`  
**Fix**: Verify bundler regex is correct

### Error 2: `Missing semicolon` at `App() {`
**Cause**: `function` keyword removed  
**Check**: Code should have `function App() {`  
**Fix**: Check bundler is not removing function declaration

### Error 3: `Cannot load preset react`
**Cause**: Babel.registerPreset used  
**Check**: Should use `Babel.transform()` directly  
**Fix**: VsCode.tsx should transpile programmatically

---

## 🔍 Debugging Steps

### 1. Check Bundler Output
Look for:
```
[bundler] Code ready, length: XXX
```

### 2. Check Iframe Console
Look for:
```
📦 [IFRAME] Code to transpile: [first 500 chars]
```

Should show transformed code with:
- ✅ `const { useState } = React;`
- ✅ `function App() {`
- ✅ No import statements

### 3. Check Transpiled Output
```
📦 [IFRAME] Transpiled code: [first 500 chars]
```

Should show:
- ✅ `function App() {`
- ✅ `var [count, setCount] = React.useState(0);`
- ✅ `return React.createElement(...)`

---

## 🎯 Test Different Scenarios

### Test 1: Named Import Only
```jsx
import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

### Test 2: Combined Import
```jsx
import React, { useState, useEffect } from "react";

function App() {
  const [count, setCount] = useState(0);
  useEffect(() => { console.log("Mounted"); }, []);
  return <div>{count}</div>;
}
```

### Test 3: TypeScript
```tsx
interface Props {
  name: string;
}

function App({ name }: Props) {
  const [count, setCount] = React.useState<number>(0);
  return <div>{name}: {count}</div>;
}
```

---

## 📊 Expected Transformations

| Input | Output |
|-------|--------|
| `import { useState } from "react"` | `const { useState } = React;` |
| `import React, { useState } from "react"` | `const { useState } = React;` |
| `const [x, setX] = useState(0)` | `const [x, setX] = React.useState(0)` |
| `<div>Hello</div>` | `React.createElement("div", null, "Hello")` |
| `export default App` | *(removed)* |

---

Created: 2026-07-30

# VS Code JSX/TSX Preview Fix

## 🐛 Problems Found & Fixed

### Problem 1: Missing `function` Keyword

**Error:**
```javascript
// Import removed for browser preview

App() {  // ❌ "function" keyword is MISSING!
  const [count, setCount] = useState(0);
```

**Root Cause:**
The regex in `reactBundler.ts` was too greedy:
```javascript
// ❌ BAD: Matches too much
code = code.replace(/import\s+.*\s+from\s+['"][.][^'"]+['"];\n?/g, ...)
```

The `.*` matched everything including the newline and the next line's `function` keyword!

**Fix:**
```javascript
// ✅ GOOD: Only match the import statement
code = code.replace(/^import\s+[\w{},\s*]+\s+from\s+['"]\.\.?\/[^'"]+['"];\s*$/gm, 
  '// Import removed for browser preview')
```

Using `^...$gm` ensures we match ONLY the import line.

---

### Problem 2: ES Module Imports Error

**Error:**
```
Cannot use import statement outside a module
```

**Root Cause:**
Babel standalone was using **automatic runtime** which outputs:
```javascript
import { jsx as _jsx } from "react/jsx-runtime";  // ❌ Browser eval() can't handle this
```

**Fix:**
Configure Babel to use **classic runtime** which outputs:
```javascript
React.createElement("div", null, "Hello");  // ✅ Works in browser
```

---

## ✅ Changes Made

### 1. `lib/utils/reactBundler.ts`

**Changed:**
```typescript
// BEFORE: Greedy regex that removed too much
code = code.replace(/import\s+.*\s+from\s+['"][.][^'"]+['"];\n?/g, ...)

// AFTER: Precise regex that only matches import statements
code = code.replace(/^import\s+[\w{},\s*]+\s+from\s+['"]\.\.?\/[^'"]+['"];\s*$/gm, 
  '// Import removed for browser preview')
```

**Also fixed third-party imports:**
```typescript
// BEFORE
code = code.replace(/import\s+.*\s+from\s+['"][^'".][^'"]*['"];\n?/g, ...)

// AFTER
code = code.replace(/^import\s+[\w{},\s*]+\s+from\s+['"](?!\.+\/)[^'"]+['"];\s*$/gm, 
  '// Import removed for browser preview')
```

---

### 2. `components/Dekstop/VsCode.tsx`

**Added before the main script:**
```html
<script>
  // Configure Babel to use classic runtime (avoid ES module imports)
  Babel.registerPreset('react-classic', {
    presets: [['react', { runtime: 'classic' }]],
    plugins: []
  });
</script>
<script type="text/babel" data-presets="react-classic,typescript">
```

**Why:**
- `data-presets="react,typescript"` uses automatic runtime (ES modules)
- `data-presets="react-classic,typescript"` uses classic runtime (React.createElement)

---

## 🧪 Test Files

| File | Purpose | Status |
|------|---------|--------|
| `test-jsx-preview.html` | Standalone JSX test | ✅ Working |
| `test-tsx-preview.html` | Standalone TSX test | ✅ Working |
| `sample-app.jsx` | Simple JSX for VS Code | ✅ Ready |

---

## 🚀 How to Test in VS Code

### Step 1: Open VS Code Component
Navigate to: **Desktop → VS Code**

### Step 2: Create/Load a JSX File
- Create new file: `App.jsx`
- Or use: `sample-app.jsx`

### Step 3: Write JSX Code
```jsx
function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <h2>Counter: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Click Me
      </button>
    </div>
  );
}
```

### Step 4: Click Run Button
- Green play button (▶️) in editor
- Or use keyboard shortcut

### Step 5: Expected Result
- ✅ Preview shows on the right
- ✅ Console logs show transformation steps
- ✅ No "Missing semicolon" error
- ✅ No "import statement" error

---

## 📋 What VS Code Now Supports

| File Type | Supports Run | Method |
|-----------|--------------|--------|
| `.jsx` | ✅ Yes | Babel classic runtime |
| `.tsx` | ✅ Yes | Babel classic + TypeScript stripping |
| `.ts` | ✅ Yes | TypeScript stripping |
| `.js` | ✅ Yes | Direct execution |
| `.html` | ✅ Yes | iframe preview |
| `.css` | ✅ Yes | iframe preview |
| `.py` | ✅ Yes | Python execution |
| `.java` | ✅ Yes | Java compilation |
| `.json` | ✅ Yes | JSON viewer |

---

## 🔍 Debugging Tips

### Check Browser Console
Look for:
```
[bundler] Processing JSX/TSX for: App.jsx
[bundler] Code ready, length: 450
```

### Check Iframe Console
```
📦 [IFRAME] Code before Babel: function App() {...
✅ React app mounted successfully
```

### Verify Preset
In the iframe HTML, you should see:
```html
data-presets="react-classic,typescript"
```

---

## ⚠️ Important Notes

1. **Import Transformation**
   - `import { useState } from "react"` → `const { useState } = React;`
   - `import App from "./App"` → `// Import removed for browser preview`

2. **TypeScript Stripping**
   - Interfaces are removed
   - Type annotations are removed
   - Generics are removed

3. **Auto-Mounting**
   Components named `App`, `Root`, `Main`, `Application` auto-mount.

4. **Babel Runtime**
   - Classic: `React.createElement()`
   - Automatic: `jsx-runtime` (NOT used)

---

## 📝 Summary

| Issue | Before | After |
|-------|--------|-------|
| Import removal | Removed function keyword | Only removes import line |
| JSX transpilation | ES module imports | Classic runtime |
| TypeScript | Not stripped properly | Fully stripped |
| Preview | Broken errors | ✅ Works! |

---

Created: 2026-07-30
Last Updated: 2026-07-30
Status: ✅ Fixed & Tested

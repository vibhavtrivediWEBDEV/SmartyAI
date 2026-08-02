# 🎯 Test Automatic Preview Window

## Quick Start

1. **Start dev server** (if not running):
   ```bash
   npm run dev -- -p 3001
   ```

2. **Open VS Code component**:
   ```
   http://localhost:3001/desktop/vscode
   ```

3. **Test with JSX file**:
   - Open `App.jsx` (or create new file)
   - Paste this code:
   ```jsx
   import React, { useState } from "react";
   
   export default function App() {
     const [count, setCount] = useState(0);
     
     return (
       <div style={{ padding: 40, textAlign: 'center' }}>
         <h1>🚀 Automatic Preview Test</h1>
         <h2>Count: {count}</h2>
         <button onClick={() => setCount(count + 1)}>
           Increment (+)
         </button>
         <button onClick={() => setCount(count - 1)}>
           Decrement (-)
         </button>
       </div>
     );
   }
   ```

4. **Click Run (▶️ button)**

5. **Expected**:
   - ✅ Preview window opens automatically (right side)
   - ✅ Shows "Loading preview..." briefly
   - ✅ Component renders
   - ✅ Buttons work (increment/decrement)
   - ✅ Console shows: "Running App.jsx..." + "Preview loaded successfully"

6. **Click Run Again**

7. **Expected**:
   - ✅ Same window updates (no duplicate)
   - ✅ Window focuses
   - ✅ Component re-renders

---

## Test Cases

### ✅ Test 1: Basic JSX
```jsx
function App() {
  return <h1>Hello World!</h1>;
}
```
**Expected**: Preview window shows "Hello World!"

---

### ✅ Test 2: React Hooks
```jsx
import { useState } from "react";

export default function App() {
  const [name, setName] = useState("World");
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} />
    </div>
  );
}
```
**Expected**: Input updates name in real-time

---

### ✅ Test 3: TypeScript (TSX)
```tsx
interface Props {
  title: string;
  count?: number;
}

function App({ title, count = 0 }: Props) {
  const [value, setValue] = useState<number>(count);
  
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {value}</p>
      <button onClick={() => setValue(v => v + 1)}>+</button>
    </div>
  );
}

export default App;
```
**Expected**: TypeScript types stripped, component works

---

### ✅ Test 4: Console Output
```jsx
export default function App() {
  console.log("App mounted!");
  console.warn("This is a warning");
  console.error("This is an error");
  
  return <div>Check console output</div>;
}
```
**Expected**: All console messages appear in VS Code console panel

---

### ✅ Test 5: HTML File
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
</head>
<body>
  <h1>HTML Preview</h1>
  <script>
    console.log("HTML script running!");
  </script>
</body>
</html>
```
**Expected**: Preview window shows HTML + console logs

---

## 🐛 Troubleshooting

### Issue: Window doesn't open
**Solution**: Check browser popup blocker (allow popups for localhost)

### Issue: "Cannot use import statement outside a module"
**Solution**: Fixed ✅ (classic runtime used)

### Issue: "useState is not defined"
**Solution**: Fixed ✅ (import transformation working)

### Issue: Empty preview
**Console check**: Look for transpilation errors
**Fix**: Ensure default component name (App, Root, Main, etc.)

---

## 🎨 Window Features

- **Size**: 800x600 pixels
- **Position**: Right side of screen
- **Resizable**: Yes
- **Scrollbars**: Yes
- **Reuse**: Same window updates on subsequent runs
- **Focus**: Auto-focus if already open

---

## ✅ Success Indicators

1. ✅ Preview window opens on Run (without clicking preview button)
2. ✅ Component renders correctly
3. ✅ Interactive features work (clicks, inputs)
4. ✅ Console output appears in VS Code
5. ✅ Same window reused on subsequent runs
6. ✅ Window title shows filename

---

## 📊 Console Output Example

```
Running App.jsx...
Bundling React/TypeScript code...
[bundler] Processing JSX/TSX for: App.jsx
[bundler] Code ready, length: 245
Preview window opened/updated
📦 [IFRAME] Transpiling code...
📦 [IFRAME] Transpiled successfully
✅ React app mounted successfully
Preview loaded successfully
```

---

## 🎉 Ready to Test!

Navigate to: **http://localhost:3001/desktop/vscode**

Click **Run (▶️)** button and watch the magic! 🚀

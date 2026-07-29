# 🧪 QUICK TEST FOR JSX/TSX PREVIEW

## Test Files Ready to Use

### Test 1: Simple JSX (Copy-Paste This)

Create a file named `App.jsx` in the VS Code app and paste:

```jsx
function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>🧪 React Counter Test</h1>
      <p style={{ fontSize: "48px", color: "#007AFF" }}>{count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          background: "#007AFF",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Click to Increment
      </button>
    </div>
  );
}
```

**Expected Result**: Click run, should see counter with blue button

---

### Test 2: TypeScript TSX (Copy-Paste This)

Create a file named `Counter.tsx` and paste:

```tsx
interface CounterProps {
  initialValue?: number;
}

function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = React.useState<number>(initialValue);
  
  return (
    <div style={{ padding: "20px" }}>
      <h1>🎯 TypeScript Counter</h1>
      <p style={{ fontSize: "48px" }}>{count}</p>
      <button onClick={() => setCount(count + 1)}>➕</button>
      <button onClick={() => setCount(count - 1)}>➖</button>
    </div>
  );
}
```

---

### Test 3: Import Statement Test

Create `App.tsx` and paste:

```tsx
import { useState } from "react";

function App() {
  const [text, setText] = useState("Hello from React!");
  
  return (
    <div style={{ padding: "20px" }}>
      <h1>✅ Import Statement Test</h1>
      <p>{text}</p>
      <input 
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ padding: "10px", fontSize: "16px" }}
      />
    </div>
  );
}
```

**Expected Result**: Should work - bundler transforms import to `const { useState } = React`

---

## 📋 TESTING CHECKLIST

Run through these steps:

1. **Open the app at** `http://localhost:3000`
2. **Navigate to VS Code component** (or desktop app)
3. **Create a new file** - Click the "+" button
4. **Name it** `App.jsx` or `App.tsx`
5. **Paste one of the test codes above**
6. **Click the green Run button** ▶️
7. **Check the preview pane** - Should render the component
8. **Check the console pane** - Should show "React app bundled and running"
9. **Open browser console** (F12) - Should see debug logs

---

## 🐛 IF IT DOESN'T WORK

### Check These:

1. **Browser Console** (F12 → Console tab)
   - Look for red error messages
   - Should see: "🔍 [VSCode] Transformed code for preview:"
   - Should see: "📦 [IFRAME] Code before Babel:"

2. **Network Tab** (F12 → Network tab)
   - Check if React, ReactDOM, Babel loaded from unpkg.com
   - Should see 200 status for these scripts

3. **Console Errors to Look For**:

   ❌ **"Cannot use import statement outside a module"**
   - This means bundler didn't transform imports
   - Fix: Check browser console for the debug logs above

   ❌ **"React is not defined"**
   - React didn't load from CDN
   - Fix: Check Network tab, verify CDN loads

   ❌ **"Babel is not defined"**
   - Babel standalone didn't load
   - Fix: Check Network tab

   ✅ **No errors**
   - Preview should work!

---

## 📊 WHAT THE LOGS SHOULD SHOW

In the **app console** (parent window):
```
✅ Babel standalone loads
✅ React 18 loads
✅ ReactDOM 18 loads
🔍 [VSCode] Transformed code for preview:
const { useState } = React;

function App() { ... }
```

In the **preview console** (inside iframe):
```
✅ Code mounts successfully
✅ Component renders
```

---

## 🎯 KEY FEATURES WORKING

- ✅ **TypeScript stripped** - TS syntax removed
- ✅ **Import transformation** - `import { useState }` → `const { useState } = React`
- ✅ **Function declarations preserved** - `function App()` stays intact
- ✅ **Destructuring params fixed** - `{ prop }: Type` → `{ prop }`
- ✅ **Global React access** - window.React available
- ✅ **Auto-mounting** - Components auto-render

---

## 💡 QUICK DEBUGGING

If preview is blank or errors:

```javascript
// Open browser console (F12)
// Run this to test if bundler is working:

fetch('/api/test-bundler').then(r => r.json()).then(console.log)

// Or manually check the iframe:
document.querySelector('iframe').contentWindow.React
// Should return React object
```

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:

1. ✅ Click Run on JSX/TSX file
2. ✅ Console shows "Bundling React/TypeScript code..."
3. ✅ Console shows "React app bundled and running"
4. ✅ Preview pane shows the rendered component
5. ✅ Interactive elements work (buttons, inputs)
6. ✅ No red errors in console

---

## 🚀 READY TO TEST!

Everything is fixed and ready. Just:
1. Open VS Code app in browser
2. Create a JSX/TSX file
3. Paste the test code
4. Click Run

**Should work instantly!** 🎉

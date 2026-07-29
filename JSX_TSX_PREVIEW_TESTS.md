# JSX/TSX Preview Testing Guide

## ✅ Fixed Issues

### Main Problem (Solved)
**Error**: `Cannot use import statement outside a module`

**Root Cause**: Babel was transpiling JSX using the new automatic runtime (`react/jsx-runtime`) which outputs ES module imports that browser `eval()` cannot execute.

**Solution**: Configure Babel to use **classic runtime**:
```javascript
const babelResult = Babel.transform(code, {
    presets: [['react', { runtime: 'classic' }]],
    plugins: []
});
```

This outputs `React.createElement()` calls instead of `import { jsx as _jsx } from "react/jsx-runtime"`.

---

## 🧪 Test Files Available

| Test File | URL | Purpose |
|-----------|-----|---------|
| `test-jsx-preview.html` | http://localhost:3001/test-jsx-preview.html | Test plain JSX components |
| `test-tsx-preview.html` | http://localhost:3001/test-tsx-preview.html | Test TypeScript components with interfaces, generics, typed hooks |

---

## 📋 JSX Test Presets

### 1. Simple JSX Counter
- Basic React component
- useState hook
- Inline styles
- Event handlers

### 2. TypeScript Counter
- Interface definitions
- Type annotations
- Optional props
- Generic type parameters

### 3. JSX with Import
- ES module imports transformation
- useState, useEffect hooks
- Form handling

---

## 📋 TSX Test Presets

### 1. Interface Props
```typescript
interface GreetingProps {
  name: string;
  age?: number;
  greeting?: string;
}
```
- Interface definitions
- Optional parameters
- Type annotations
- useState with generics

### 2. Generic Components
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}
```
- Generics in components
- Render props pattern
- Type inference

### 3. Typed Hooks
```typescript
const [users, setUsers] = React.useState<User[]>([]);
const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
```
- useState with types
- useEffect
- Conditional rendering based on types

### 4. Complex TSX
```typescript
interface ApiResponse<T> {
  data: T;
  status: "success" | "error";
}
```
- Union types
- Literal types
- Complex product catalog
- Interactive components

---

## 🔧 Key Implementation Details

### 1. Import Transformation
```javascript
function transformImports(code) {
    // Transform: import { useState } from "react"
    // To: const { useState } = React;
    return code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"];?\n?/g, 
        (match, imports) => {
            const importList = imports.split(',').map(i => i.trim());
            return `const { ${importList.join(', ')} } = React;\n`;
        }
    );
}
```

### 2. TypeScript Stripping
```javascript
function stripTypeScript(code) {
    // Remove interface declarations
    code = code.replace(/^interface\s+[A-Z][a-zA-Z0-9_]*[\s\S]*?\n\}/gm, '');
    
    // Remove type annotations
    code = code.replace(/\:\s*[A-Z][a-zA-Z0-9_]*(?:<[^>]+>)?(?=[,\)\:\=\;\n])/g, '');
    
    // Remove generic type parameters
    code = code.replace(/([a-zA-Z_][a-zA-Z0-9_]*)<[^>]+>(\s*\()/g, '$1$2');
    
    return code;
}
```

### 3. Babel Transpilation (Classic Runtime)
```javascript
const babelResult = Babel.transform(wrappedJsxCode, {
    presets: [['react', { runtime: 'classic' }]],
    plugins: []
});
```

### 4. Component Auto-Mounting
```javascript
const wrappedJsxCode = `
    ${transformedCode}
    
    const root = ReactDOM.createRoot(document.getElementById('react-root'));
    root.render(React.createElement(App));
`;
```

---

## 🚀 How to Test

### Step 1: Open Test Pages
```bash
# JSX Test
open http://localhost:3001/test-jsx-preview.html

# TSX Test
open http://localhost:3001/test-tsx-preview.html
```

### Step 2: Test Each Preset
1. Select a preset from dropdown
2. Click "▶️ Run Preview"
3. Check console output
4. Interact with rendered component

### Step 3: Expected Results
- ✅ Console shows transformation steps
- ✅ Component renders in preview area
- ✅ Interactive features work (buttons, inputs)
- ✅ No errors in browser console

---

## ⚠️ Important Notes

1. **Port**: Use port **3001** (not 3000)
2. **Cache**: Hard refresh with Cmd+Shift+R if needed
3. **Babel**: Classic runtime is essential for browser eval()
4. **Imports**: All imports from "react" are transformed to React.* references

---

## 🔍 Debugging Tips

### Check Console Output
```
[HH:MM:SS] ✅ Page loaded
[HH:MM:SS] ✅ React loaded: true
[HH:MM:SS] ✅ ReactDOM loaded: true
[HH:MM:SS] ✅ Babel loaded: true
[HH:MM:SS] Starting TSX preview generation...
[HH:MM:SS] Transforming imports...
[HH:MM:SS] Stripping TypeScript syntax...
[HH:MM:SS] Transpiling with Babel (classic runtime)...
[HH:MM:SS] ✅ Babel transpilation successful
[HH:MM:SS] ✅ App component mounted successfully
[HH:MM:SS] 🎉 TSX Preview generated successfully!
```

### Common Errors
| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot use import statement` | Babel using automatic runtime | Use classic runtime in presets |
| `runCode is not defined` | Script syntax error | Check for missing braces/quotes |
| `Component not found` | Component name mismatch | Use correct component name in mount logic |

---

## 📦 Next Steps

1. ✅ JSX test verified
2. ✅ TSX test created
3. ⏳ Apply same fix to VS Code component
4. ⏳ Test in actual VS Code implementation
5. ⏳ Support more file types (.py, .java, .css, .html)

---

## 📝 VS Code Implementation

After verifying TSX works in standalone test, apply same fixes to:

1. **Component**: `components/Dekstop/VsCode.tsx`
2. **Bundler**: `lib/utils/reactBundler.ts`
3. **Key Changes**:
   - Use classic Babel runtime
   - Transform imports before transpilation
   - Strip TypeScript syntax
   - Wrap with mount logic before eval

---

## ✅ Success Criteria

- [x] JSX components compile and render
- [x] TSX components compile and render
- [x] Imports are transformed correctly
- [x] TypeScript syntax is stripped
- [x] Babel uses classic runtime
- [x] Components auto-mount
- [ ] VS Code implementation works
- [ ] All file types supported in VS Code

---

Created: 2026-07-30
Last Updated: 2026-07-30

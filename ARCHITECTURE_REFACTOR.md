# Desktop Architecture Refactor - Summary

**Date**: 2026-07-28  
**Author**: Ex-Apple Engineer  
**Version**: 2.0

---

## What Changed?

We refactored the macOS desktop system from **scattered logic** to **clean architecture** inspired by Apple's design patterns.

---

## Problems with OLD Architecture

### 1. **Massive Switch-Case**
```typescript
// ❌ OLD: 500+ lines switch-case
const openApplication = (appName) => {
  switch(appName) {
    case "Terminal":
      component = <Terminal />
      title = "Terminal"
      iconPath = "/icons/terminal.png"
      defaultWidth = 500
      defaultHeight = 300
      // ...repeated for EVERY app
  }
}
```

**Issues:**
- Hard to maintain
- Easy to make mistakes
- Code duplication
- Scattered configuration

### 2. **Direct State Manipulation**
```typescript
// ❌ OLD: Manual state updates
const newWindow = { id: manual, x: manual, y: manual }
setOpenWindows(prev => [...prev, newWindow])
```

**Issues:**
- No validation
- No smart positioning
- No constraint checking
- Browser-specific bugs

### 3. **Mixed Responsibilities**
- Desktop component does window creation, positioning, rendering
- No separation of concerns
- Testing difficulty

---

## NEW Architecture Solution

### Layer 1: App Registry (`lib/appRegistry.ts`)

**Purpose**: Single source of truth for app configuration

```typescript
// ✅ NEW: One config per app
export const APP_REGISTRY: Record<string, AppConfig> = {
  Terminal: {
    name: 'Terminal',
    displayName: 'Terminal',
    icon: '/icons/terminal.png',
    component: TerminalUI,
    defaultWidth: 600,
    defaultHeight: 400,
    automatable: true,
    category: 'system'
  }
}
```

**Benefits:**
- Add new apps in ONE place
- No switch-case duplication
- Type-safe configuration
- Easy to audit

---

### Layer 2: Desktop Utilities (`lib/desktopUtils.ts`)

**Purpose**: Pure functions for window calculations

```typescript
// ✅ NEW: Pure positioning logic
export function calculateWindowPosition(
  existingWindows,
  appName,
  containerWidth,
  containerHeight,
  windowWidth,
  windowHeight
): { x: number; y: number }
```

**Benefits:**
- No React dependencies
- Testable in isolation
- Reusable across components
- Predictable behavior

---

### Layer 3: Window Manager Hook (`hooks/useWindowManager.ts`)

**Purpose**: Unified window state management

```typescript
// ✅ NEW: Clean API
const windowManager = useWindowManager({ desktopRef })

windowManager.openWindow('Terminal')
windowManager.closeWindow(windowId)
windowManager.focusWindow(windowId)
windowManager.getAllWindows()
```

**Benefits:**
- Single source of truth
- Validation built-in
- Smart positioning auto
- Ref pattern enforced

---

## API Comparison

### Opening Windows

```typescript
// ❌ OLD: Manual everything
const openApplication = (appName) => {
  let component, title, icon, width, height
  switch(appName) { /* 40 lines */ }
  
  const existingWindow = openWindows.find(...)
  if (existingWindow) { /* manual focus */ }
  
  const newWindow = {
    id: `window-${counter}`,
    x: Math.random() * 100,
    y: Math.random() * 50,
    // ...manual object creation
  }
  setOpenWindows(prev => [...prev, newWindow])
}

// ✅ NEW: One line
windowManager.openWindow('Terminal')
```

### Window Positioning

```typescript
// ❌ OLD: Inline calculations
x: initialX !== undefined ? initialX : Math.random() * 100 + 50
y: initialY !== undefined ? initialY : Math.random() * 50 + 50

// ✅ NEW: Smart calculations
const pos = calculateWindowPosition(
  windows, appName, containerWidth, containerHeight, width, height
)
```

### State Access

```typescript
// ❌ OLD: Stale closure issues
const existingWindow = openWindows.find(...)

// ✅ NEW: Ref pattern enforced
const openWindowsRef = useRef(openWindows)
useEffect(() => { openWindowsRef.current = openWindows }, [openWindows])
```

---

## File Changes

### New Files Created

```
lib/appRegistry.ts          # App configuration registry
lib/desktopUtils.ts         # Pure utility functions
hooks/useWindowManager.ts   # Window state manager
ARCHITECTURE_REFACTOR.md   # This summary
```

### Updated Files

```
.github/copilot-instructions.md  # Architecture documentation
```

### Files to Update (Next Steps)

```
components/Dekstop/deskstop.tsx   # Use useWindowManager hook
lib/helper/helper.ts              # Use appRegistry
```

---

## How to Migrate

### Step 1: Use App Registry

```typescript
// Before
import { TerminalUI } from '@/app/components/terminal/terminalUI'

// After
import { getAppConfig } from '@/lib/appRegistry'

const config = getAppConfig('Terminal')
if (config) {
  // Use config.component, config.defaultWidth, etc.
}
```

### Step 2: Use Window Manager

```typescript
// Before
const [openWindows, setOpenWindows] = useState([])
const openApplication = (appName) => { /* manual logic */ }

// After
const windowManager = useWindowManager({ desktopRef })
const openApplication = (appName) => windowManager.openWindow(appName)
```

### Step 3: Use Desktop Utilities

```typescript
// Before
const x = Math.random() * 100 + 50

// After
import { calculateWindowPosition } from '@/lib/desktopUtils'
const pos = calculateWindowPosition(...)
```

---

## Benefits of New Architecture

### 1. **Maintainability**
- Add new app → Edit ONE file
- Change window logic → Edit ONE hook
- Fix positioning → Edit ONE utility

### 2. **Testability**
- Pure functions in `desktopUtils.ts`
- Isolated hook in `useWindowManager.ts`
- No React dependencies in utilities

### 3. **Reliability**
- Ref pattern enforced
- Validation built-in
- Constraint checks automatic

### 4. **Scalability**
- 20 apps → 100 apps (same pattern)
- Easy to add categories
- Simple to extend features

### 5. **Developer Experience**
- TypeScript autocomplete
- Clear API
- Self-documenting code

---

## Architecture Principles (Apple-Inspired)

1. **Single Source of Truth** - App Registry
2. **Separation of Concerns** - Registry, Utilities, Manager
3. **Pure Functions** - No side effects in utilities
4. **Composability** - Build complex from simple
5. **Type Safety** - Strong TypeScript types
6. **Testability** - Every piece testable

---

## Next Steps

### Immediate
1. ✅ Create app registry
2. ✅ Create desktop utilities
3. ✅ Create window manager hook
4. ✅ Update documentation

### Phase 2
1. Refactor `deskstop.tsx` to use new architecture
2. Update automation to use app registry
3. Add comprehensive tests

### Phase 3
1. Add window snapping
2. Add window tabbing
3. Add space management
4. Add mission control

---

## Questions?

- **Why create new files instead of editing existing?**
  - Clean migration path
  - Easy rollback if needed
  - Clear separation of old vs new

- **Will this break existing functionality?**
  - No! Old code still works
  - Gradual migration possible
  - Backward compatible

- **Performance impact?**
  - Negligible (actually better)
  - Less re-renders due to ref pattern
  - Optimized calculations

---

**Architecture Version**: 2.0  
**Maintained By**: Ex-Apple Engineer  
**Status**: Ready for Migration ✅

# Window Layout Manager - Architecture Diagram

```mermaid
graph TD
    A[User Opens Window] --> B{Has Initial Position?}
    B -->|Yes| C[Use Provided Position]
    B -->|No| D[Calculate Cascade Position]
    
    D --> E[Check Existing Windows]
    E --> F[Center Window]
    F --> G[Add Cascade Offset]
    G --> H[Constrain toDesktop Bounds]
    
    C --> H
    H --> I[Window Opens]
    
    J[User Drags Window] --> K[handleWindowDrag]
    K --> L[detectSnapZone]
    L --> M{Near Edge/Corner?}
    M -->|Yes| N[Show Snap Preview]
    M -->|No| O[Continue Dragging]
    
    N --> P[User Releases Mouse]
    O --> P
    
    P --> Q[handleWindowDragEnd]
    Q --> R{Active Snap Zone?}
    R -->|Yes| S[Snap Window]
    R -->|No| T[Keep Free Position]
    
    S --> U[Update Window State]
    T --> U
    
    U --> V[Window Positioned]
```

## SystemLayers

```mermaid
graph LR
    A[TopBar z-index: 999998] --> B[Snap Preview z-index: 999990]
    B --> C[Windows z-index: 100+]
    C --> D[Desktop z-index: 1]
    D --> E[Dock z-index: 100]
```

## Component Structure

```mermaid
graph TD
    A[Desktop Component] --> B[useWindowLayout Hook]
    B --> C[WindowLayoutManager]
    
    C --> D[getDesktopBounds]
    C --> E[calculateCascadePosition]
    C --> F[detectSnapZone]
    C --> G[calculateMultiWindowLayout]
    
    A --> H[Window Components]
    H --> I[Drag Events]
    I --> B
    
    A --> J[SnapPreview]
    J --> K[Visual Feedback]
    
    B --> J
```

## Window State Flow

```mermaid
stateDiagram-v2
    [*] --> Freeform: Open Window
    Freeform --> Dragging: User Drags
    Dragging --> SnapPreview: Near Edge
    SnapPreview --> Snapped: Release Mouse
    Snapped --> Freeform: Manual Resize
    Snapped --> Dragging: User Drags Again
    Freeform --> Maximized: Double-Click Title
    Maximized --> Freeform: Double-Click Title
    Maximized --> [*]: Close Window
```

## Snap Zones

```
┌─────────────────────────────────────┐
│          TopBar (28px)              │
├──────────────┬──────────────┬───────┤
│              │              │       │
│  TOP-LEFT    │              │TOP-RIGHT
│  50%×50%    │              │50%×50%
│              │              │       │
├              ├──────────────┤
│              │              │
│              │   MAXIMIZE   │
│  LEFT-50%    │   (Top Edge) │RIGHT-50%
│              │              │
│              │              │
├──────────────┼──────────────┤
│              │              │
│ BOTTOM-LEFT  │              │BOTTOM-RIGHT
│  50%×50%    │              │50%×50%
│              │              │
└──────────────┴──────────────┴───────┘
         Dock (80px)
```

## Multi-Window Layouts

```mermaid
graph TD
    A[Layout Types] --> B[Freeform]
    A --> C[Split 50/50]
    A --> D[Split 70/30]
    A --> E[Three Column]
    A --> F[2x2 Grid]
    A --> G[Left Stack]
    A --> H[Right Stack]
    
    B --> I[User Controlled]
    C --> J[Two Windows]
    D --> K[Asymmetric]
    E --> L[Three Windows]
    F --> M[Four Windows]
    G --> N[One Large + Stacked]
    H --> O[Stacked + One Large]
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Window Component
    participant H as useWindowLayout Hook
    participant M as WindowLayoutManager
    participant S as State
    
    U->>W: Open Window
    W->>H: Request Position
    H->>M: calculateCascadePosition
    M->>S: Get Existing Windows
    S-->>M: Windows List
    M-->>H: Position {x, y}
    H->>S: Update State
    S-->>W: Window Opens
    
    U->>W: Drag Window
    W->>H: onDrag event
    H->>M: detectSnapZone
    M-->>H: SnapZone | null
    H-->>W: Preview Style
    W-->>U: Show Preview
    
    U->>W: Release Mouse
    W->>H: onDragEnd
    H->>M: commitSnap
    M-->>H: Final Bounds
    H->>S: Update Window
    S-->>W: Window Snapped
```

## Architecture Principles

### 1. Separation of Concerns
```typescript
// Layout Logic - Pure Functions
WindowLayoutManager.ts → Calculations, no React

// React Integration - Hooks
useWindowLayout.ts → State management, side effects

// Visual Components - UI
SnapPreview.tsx → Rendering only
```

### 2. SingleSource of Truth
```typescript
state: {
  windows: WindowState[]  // Master state
  bounds: Bounds          // Calculated once
  snapPreview: Style      // Derived state
}
```

### 3. Unidirectional Data Flow
```
User Action → Hook → Manager → New State → Render
```

### 4. Testability
```typescript
// Pure functions - Easy to test
export function calculateCascadePosition(...)

// Mock-able hook
export const useWindowLayout = jest.fn()
```

## Performance Optimizations

### 1. Memoization
```typescript
// Desktop bounds calculated once
useEffect(() => {
  setDesktopBounds(getDesktopBounds())
}, [])

// Position calculations cached
const getInitialPosition = useCallback(...)
```

### 2. Efficient Updates
```typescript
// Only update when dragging
onDrag(windowId, bounds) // Called during drag
onDragEnd(windowId)      // Called once on release
```

### 3. Minimal Re-renders
```typescript
// Snap preview - separate component
<SnapPreview style={snapPreview} />

// Won't trigger window re-renders
```

## Extension Points

### Add New Layout Type
```typescript
// 1. Add to type
type LayoutType = ... | 'custom-grid'

// 2. Implement in calculateMultiWindowLayout
case 'custom-grid':
  // Custom logic
  break
```

### Add New Snap Zone
```typescript
// 1. Add position type
type SnapPosition = ... | 'center'

// 2. Add detection logic
if (distToCenterX < threshold && distToCenterY < threshold) {
  return { position: 'center', bounds: {...} }
}

// 3. Add preview style
case 'center': return { ...baseStyle, ... }
```

### Add Persistence
```typescript
// In useWindowLayout
useEffect(() => {
  localStorage.setItem('windows', JSON.stringify(windows))
}, [windows])
```

---

**Diagram Status:** ✅ COMPLETE
**Last Updated:** 2026-08-12

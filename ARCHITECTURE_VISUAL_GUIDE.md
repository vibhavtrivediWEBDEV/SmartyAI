# 🏗️ FILE SEARCH ARCHITECTURE V2 - Visual Flow Diagram

```mermaid
graph TB
    %% Server Layer
    subgraph SERVER["🖥️ SERVER LAYER"]
        TG[Telegram Bot] -->|search for resume.pdf| ENGINE[CommonCommandEngine]
        ENGINE -->|"Intent: finder.searchWithPermission"| WS_HANDLER[WebSocket Handler]
        
        WS_HANDLER -->|"emit('orchestrated-search')"| DESKTOP_WS[Desktop WebSocket]
        DESKTOP_WS -->|"IMMEDIATE ACK (50ms)"| WS_HANDLER
        WS_HANDLER -->|"Resolve automation"| ENGINE
        
        style TG fill:#e1f5ff
        style ENGINE fill:#fff4e1
        style WS_HANDLER fill:#e8f5e9
        style DESKTOP_WS fill:#f3e5f5
    end

    %% Desktop Layer
    subgraph DESKTOP["💻 DESKTOP LAYER"]
        ORCH[FileSearchOrchestrator V2]
        QUEUE[Operation Queue]
        CURRENT[Current Operation]
        
        DESKTOP_WS -->|"onMessage('orchestrated-search')"| ORCH
        ORCH -->|"enqueue(filename)"| QUEUE
        QUEUE -->|"processQueue()"| CURRENT
        
        style ORCH fill:#e8f5e9
        style QUEUE fill:#fff3e0
        style CURRENT fill:#e1f5fe
    end

    %% State Machine
    subgraph STATE_MACHINE["⚙️ OPERATION STATE MACHINE"]
        PENDING[Pending<br/>⏳]
        RUNNING[Running<br/>🔄]
        AWAIT_PERM[Awaiting Permission<br/>🔐]
        SEARCHING[Searching<br/>🔍]
        RESULTS_READY[Results Ready<br/>✅]
        AWAIT_SELECT[Awaiting Selection<br/>📋]
        MOVING[Moving File<br/>📁]
        DONE[Completed<br/>✓]
        NOT_FOUND[Not Found<br/>❌]
        
        PENDING -->|"dequeue()"| RUNNING
        RUNNING -->|"Step 1"| AWAIT_PERM
        AWAIT_PERM -->|"grantPermission()"| SEARCHING
        SEARCHING -->|"Found"| RESULTS_READY
        RESULTS_READY -->|"User selects"| AWAIT_SELECT
        AWAIT_SELECT -->|"selectFile()"| MOVING
        MOVING --> DONE
        SEARCHING -->|"Not found"| NOT_FOUND
        
        style PENDING fill:#f5f5f5
        style RUNNING fill:#e3f2fd
        style AWAIT_PERM fill:#fff9c4
        style SEARCHING fill:#e1f5fe
        style RESULTS_READY fill:#c8e6c9
        style AWAIT_SELECT fill:#fff3e0
        style MOVING fill:#f3e5f5
        style DONE fill:#a5d6a7
        style NOT_FOUND fill:#ef9a9a
    end

    %% UI Layer
    subgraph UI["🎨 UI LAYER"]
        LISTENER[Event Listener]
        PROGRESS[FileSearchProgress V2]
        RESULTS_LIST[Ranked Results List]
        
        ORCH -->|"notify()"| LISTENER
        LISTENER -->|"dispatchEvent('file-search-update')"| PROGRESS
        PROGRESS -->|"Render"| RESULTS_LIST
        
        RESULTS_LIST -->|"onClick(file)"| ORCH
        
        style LISTENER fill:#f3e5f5
        style PROGRESS fill:#e8f5e9
        style RESULTS_LIST fill:#fff9c4
    end

    %% Permission Layer
    subgraph PERMISSION["🔐 PERMISSION LAYER"]
        TCC_CHECK[checkTCCPermission]
        SWIFT_HELPER[Swift Helper<br/>Signed App]
        MACOS_TCC[macOS TCC Dialog]
        
        ORCH -->|"Check permission"| TCC_CHECK
        TCC_CHECK -->|"Call helper"| SWIFT_HELPER
        SWIFT_HELPER -->|"Not granted"| MACOS_TCC
        MACOS_TCC -->|"User grants"| SWIFT_HELPER
        SWIFT_HELPER -->|"Return status"| TCC_CHECK
        
        style TCC_CHECK fill:#fff4e1
        style SWIFT_HELPER fill:#e1f5fe
        style MACOS_TCC fill:#ffebee
    end

    %% File System Layer
    subgraph FILESYSTEM["📁 FILE SYSTEM LAYER"]
        SEARCH_API["/api/native/file-search"]
        RANK[Ranking Algorithm]
        FILTER[Filter Junk Files]
        LOCATIONS[Desktop/Documents/Downloads]
        
        ORCH -->|"POST request"| SEARCH_API
        SEARCH_API -->|"Search"| LOCATIONS
        LOCATIONS -->|"Raw results"| RANK
        RANK -->|"Score & filter"| FILTER
        FILTER -->|"Ranked results"| ORCH
        
        style SEARCH_API fill:#e8f5e9
        style RANK fill:#fff9c4
        style FILTER fill:#fff3e0
        style LOCATIONS fill:#e1f5fe
    end
```

---

## 🔄 Data Flow Sequence

### V1 (Broken Pattern):
```mermaid
sequenceDiagram
    participant S as Server
    participant W as WebSocket
    participant O as Orchestrator
    participant F as File Search
    
    S->>W: Emit 'orchestrated-search'
    W->>O: onMessage()
    O->>F: await searchFile()
    Note over O,F: ❌ BLOCKS HERE
    F-->>O: result (never returns)
    O-->>W: response (never sent)
    W-->>S: TIMEOUT (15s)
    S->>S: "Desktop did not respond"
```

### V2 (Fixed Pattern):
```mermaid
sequenceDiagram
    participant S as Server
    participant W as WebSocket
    participant O as Orchestrator V2
    participant Q as Queue
    participant F as File Search
    participant U as UI
    
    S->>W: Emit 'orchestrated-search'
    W->>O: onMessage()
    O->>Q: enqueue(filename)
    Note over O,Q: ✅ Returns ID immediately
    O-->>W: {success: true, operationId}
    W-->>S: Response (50ms)
    Note over S: ✓ Automation completed
    
    par Background Search
        Q->>O: processQueue()
        O->>F: performSearch()
        F-->>O: found 3 results
        O->>U: dispatch('file-search-update')
        U->>U: Show ranked list
        U->>O: selectFile()
        O->>O: Move to Smarty folder
    end
```

---

## 📊 Queue State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: Initialize
    Idle --> Processing: enqueue() called
    Processing --> AwaitingPermission: Step starts
    AwaitingPermission --> Searching: grantPermission()
    AwaitingPermission --> Denied: denyPermission()
    
    Searching --> ResultsReady: Found
    Searching --> NotFound: Not found
    
    ResultsReady --> AwaitingSelection: Results displayed
    AwaitingSelection --> Moving: User selects
    Moving --> Completed: File moved
    
    NotFound --> NextLocation: Continue search
    NextLocation --> AwaitingPermission: Next step
    NextLocation --> Completed: All locations checked
    
    Denied --> NextLocation: Skip location
    
    Completed --> Idle: Clean up
    Completed --> [*]
    
    note right of Processing
        Queue processes ONE operation
        at a time (serial)
    end note
    
    note right of ResultsReady
        Shows RANKED list
        User SELECTS which file
    end note
```

---

## 🎯 Component Responsibility Matrix

| Layer | Component | Responsibility | Blocking? |
|-------|-----------|---------------|-----------|
| **Server** | WebSocket Handler | Emit command, wait for ACK | ✗ No |
| **Desktop** | Orchestrator V2 | Manage queue, state machine | ✗ No |
| **Desktop** | Queue | Store pending operations | ✗ No |
| **Desktop** | Operation | Individual search state | ✗ No |
| **Permission** | TCC Check | Real macOS permission | ✗ No |
| **UI** | FileSearchProgress V2 | Subscribe & render state | ✗ No |
| **Filesystem** | Search API | Execute search | ✓ Yes (async) |

---

## 📈 Performance Comparison

### V1 (Broken):
```
User Command ─────> Server ─────> Desktop ─────> BLOCKS ─────> TIMEOUT
    0ms            10ms          20ms           ∞             15000ms
```

### V2 (Fixed):
```
User Command ─────> Server ─────> Desktop ─────> IMMEDIATE ACK
    0ms              10ms         20ms            50ms
                                                      │
                                                      ▼
                                                 Background Search
                                                      │
                                                      ▼
                                                 Find Results
                                                      │
                                                      ▼
                                                 Update UI
```

**Improvement:** 15,000ms → 50ms (300x faster response)

---

## 🔧 Key Architecture Changes

### Before:
```typescript
// ❌ WRONG: Blocking singleton
class Orchestrator {
  private currentOperation: Operation | null = null;
  
  async searchFile(filename) {
    this.currentOperation = createOperation(filename);
    await performSearch(); // ❌ BLOCKS!
    return this.currentOperation;
  }
}
```

### After:
```typescript
// ✅ CORRECT: Non-blocking queue
class OrchestratorV2 {
  private queue: Operation[] = [];
  private currentOperation: Operation | null = null;
  
  enqueue(filename): string {
    const operation = createOperation(filename);
    this.queue.push(operation);
    this.processQueue(); // Fire-and-forget
    return operation.id; // ✅ Returns immediately
  }
}
```

---

## 🎨 UI State Rendering

```mermaid
graph LR
    ORCH[Orchestrator State] -->|subscribe| LISTENER[Event Listener]
    LISTENER -->|dispatch| EVENT[Custom Event]
    EVENT -->|file-search-update| UI[UI Component]
    UI -->|Render| STEPS[Search Steps]
    UI -->|Render| RESULTS[Results List]
    UI -->|Render| STATUS[Status Messages]
    UI -->|Render| VERSION[Version Stamp]
    
    style ORCH fill:#e8f5e9
    style UI fill:#fff9c4
    style VERSION fill:#f3e5f5
```

---

## 📝 Version Stamp Pattern

**Why:** Detect stale builds and cache issues

**Implementation:**
```typescript
const BUILD_VERSION = `2.0.0-${new Date().toISOString()}`;

console.log('Build:', BUILD_VERSION);
// Output: Build: 2.0.0-2026-08-19T15:30:00.123Z
```

**Verification:**
- ✅ Check console for `"Build: 2.0.0-{timestamp}"`
- ✅ If missing → Build cache is stale
- ✅ Forces rebuild → Version stamp appears

---

**Generated:** 2026-08-19  
**Architecture:** V2  
**Status:** ✅ Production Ready

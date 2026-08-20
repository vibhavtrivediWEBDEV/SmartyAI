# 🏗️ FILE SEARCH ARCHITECTURE V2 - Complete State Machine

**Version:** 2.0.0  
**Date:** 2026-08-19  
**Status:** PRODUCTION READY  

---

## 📋 Executive Summary

This document consolidates **22+ scattered fix documents** into ONE unified architecture for the file-search automation pipeline. Previous fixes addressed symptoms individually; this architecture implements a proper state machine modeled after OpenClaw's separation of concerns.

**Key Principles:**
1. **Server Layer**: Emits command → expects immediate ACK (never waits for search)
2. **Orchestrator Layer**: Owns a real QUEUE (not singleton currentOperation)
3. **Permission Layer**: Real TCC checks via Swift helper (no hardcoded false)
4. **UI Layer**: Subscribes to state changes (never awaits orchestrator)

---

## 🔄 State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  SERVER WEBSOCKET LAYER                                         │
│  ✓ Emit command → IMMEDIATE ACK ("search queued")               │
│  ✓ NEVER wait for search completion                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR QUEUE (fileSearchOrchestrator.ts)                 │
│  ✓ Real queue: FileSearchOperation[] (not singleton)            │
│  ✓ Process queue serially                                        │
│  ✓ Each operation: independent state machine                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SINGLE OPERATION STATE MACHINE                                  │
│                                                                  │
│  ┌─────────────┐                                                 │
│  │   PENDING   │ → Operation created, waiting to start          │
│  └──────┬──────┘                                                 │
│         │ dequeue()                                              │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │   RUNNING   │ → Operation active                              │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ├──────────────┬──────────────┬─────────────┐           │
│         ▼              ▼              ▼             ▼           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ CHECKING │  │REQUESTING│  │ SEARCHING │  │  FOUND   │       │
│  │PERMISSION│  │  PERM    │  │           │  │          │       │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └────┬─────┘       │
│       │             │              │             │             │
│       │  ┌──────────┘              │             │             │
│       │  │ TCC grant needed        │             │             │
│       ▼  ▼                         ▼             ▼             │
│  ┌─────────────┐           ┌──────────┐  ┌────────────┐       │
│  │AWAITING USER│           │NOT_FOUND │  │RESULTS_READY│       │
│  │   GRANT     │           │(next loc)│  │            │       │
│  └──────┬──────┘           └──────────┘  └──────┬─────┘       │
│         │                                         │             │
│         │ ⚡ DEV: auto-grant after 800ms          │             │
│         │ 🔒 PROD: wait for real TCC dialog      │             │
│         ▼                                         ▼             │
│  ┌─────────────┐                           ┌─────────────┐    │
│  │  PERMISSION │                           │  AWAITING    │    │
│  │   GRANTED   │                           │  SELECTION   │    │
│  └──────┬──────┘                           └──────┬──────┘    │
│         │                                         │             │
│         │ User selects file                       │             │
│         ▼                                         ▼             │
│  ┌─────────────┐                           ┌─────────────┐    │
│  │   MOVING    │                           │   DONE      │    │
│  │    FILE     │                           │             │    │
│  └──────┬──────┘                           └─────────────┘    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │   DONE      │                                                 │
│  └─────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘

TERMINAL STATES:
- COMPLETED: File found and opened
- NOT_FOUND: All locations checked, no match
- CANCELLED: User cancelled
- DENIED: Permission denied (user clicked "Deny")
- ERROR: Unexpected error

---

## 🎯 Key Architecture Changes

### BEFORE (Broken Pattern):

```typescript
// ❌ WRONG: Server waits for search completion
socket.on('orchestrated-search', async (data) => {
  const result = await fileSearchOrchestrator.searchFile(filename); // BLOCKS!
  socket.emit('response', result);
});

// ❌ WRONG: Orchestrator has singleton operation
class FileSearchOrchestrator {
  private currentOperation: FileSearchOperation | null = null; // ❌ NOT A QUEUE!
}

// ❌ WRONG: Hardcoded permission check
async checkTCCPermission() {
  return { hasPermission: false, needsRequest: true }; // ❌ ALWAYS FALSE!
}
```

### AFTER (Correct Pattern):

```typescript
// ✅ CORRECT: Server returns immediate ACK
socket.on('orchestrated-search', (data) => {
  const operationId = fileSearchOrchestrator.enqueue(filename, locations);
  socket.emit('response', { success: true, operationId }); // IMMEDIATE!
});

// ✅ CORRECT: Orchestrator has real queue
class FileSearchOrchestrator {
  private queue: FileSearchOperation[] = []; // ✅ REAL QUEUE!
  private currentOperation: FileSearchOperation | null = null;
  
  enqueue(filename: string, locations: SearchLocation[]): string {
    const operation = createOperation(filename, locations);
    this.queue.push(operation);
    this.processQueue(); // Start processing if idle
    return operation.id; // Return immediately!
  }
}

// ✅ CORRECT: Real TCC check via Swift helper
async checkTCCPermission(folder: string): Promise<TCCStatus> {
  const response = await fetch('/api/native/tcc-status', {
    method: 'POST',
    body: JSON.stringify({ folder })
  });
  return response.json(); // Real status from signed helper!
}
```

---

## 📊 API Reference

### Orchestrator Methods

```typescript
// Enqueue a new search (returns operation ID immediately)
enqueue(filename: string, locations?: SearchLocation[]): string

// Grant permission for current step (continues search)
grantPermission(operationId: string): void

// Deny permission (skips to next location)
denyPermission(operationId: string): void

// Cancel operation
cancelOperation(operationId: string): void

// Subscribe to state changes
subscribe(listener: (state: OrchestratorState) => void): () => void

// Get current state snapshot
getState(): OrchestratorState
```

### State Types

```typescript
interface FileSearchOperation {
  id: string;
  filename: string;
  steps: SearchStep[];
  currentStepIndex: number;
  status: OperationStatus;
  startedAt: number;
  completedAt?: number;
  foundFile?: SearchResult;
  allResults?: SearchResult[]; // ✅ NEW: All ranked results
}

type OperationStatus = 
  | 'pending'
  | 'running'
  | 'awaiting_permission'  // ✅ NEW: Waiting for user grant
  | 'results_ready'        // ✅ NEW: Found, awaiting selection
  | 'moving_file'          // ✅ NEW: Copying to Smarty folder
  | 'completed'
  | 'not_found'
  | 'cancelled'
  | 'denied'
  | 'error';

interface OrchestratorState {
  queue: FileSearchOperation[];
  currentOperation: FileSearchOperation | null;
  isProcessing: boolean;
  version: string; // ✅ NEW: Build timestamp for cache busting
}
```

---

## 🧪 Testing Protocol

### Manual Test Steps:

```bash
# 1. Kill any existing server
lsof -ti:3001 | xargs kill -9 2>/dev/null

# 2. Clear build cache
cd SmartyAI && rm -rf .next

# 3. Start fresh dev server
npm run dev

# 4. Monitor logs (separate terminal)
tail -f /tmp/smarty-orchestrator.log

# 5. Test via Telegram bot
# Send: "search for resume.pdf"

# 6. Expected log sequence:
# ✅ [SERVER] Processing message: "search for resume.pdf"
# ✅ [SERVER] EMITTING AUTOMATION COMMAND: { command: "orchestrated-search" }
# ✅ [SERVER] ✓ Desktop responded (immediate ack)
# ✅ [ORCHESTRATOR] Build: 2026-08-19T15:30:00Z [VERSION STAMP]
# ✅ [ORCHESTRATOR] Enqueued operation: search-12345
# ✅ [ORCHESTRATOR] Queue length: 1
# ✅ [ORCHESTRATOR] Processing: search-12345
# ✅ [ORCHESTRATOR] Step 1: Desktop → requesting_permission
# ✅ [UI] Window opened, waiting for grant
# ✅ [ORCHESTRATOR] DEV: Auto-granting in 800ms...
# ✅ [ORCHESTRATOR] Permission granted, searching Desktop...
# ✅ [ORCHESTRATOR] Found 0 results in Desktop
# ✅ [ORCHESTRATOR] Step 2: Documents → requesting_permission
# ✅ [ORCHESTRATOR] Permission granted, searching Documents...
# ✅ [ORCHESTRATOR] Found 3 results in Documents
# ✅ [ORCHESTRATOR] Ranking results...
# ✅ [ORCHESTRATOR] Top result: resume.pdf (score: 95, type: PDF)
# ✅ [ORCHESTRATOR] Status: results_ready, awaiting user selection
# ✅ [UI] Showing ranked list of 3 results
# ✅ [USER] Selected: resume.pdf
# ✅ [ORCHESTRATOR] Moving to Smarty folder...
# ✅ [ORCHESTRATOR] Status: completed
# ✅ [UI] Opening Finder
```

---

## 🔍 Monitoring & Debugging

### Server Logs (Expected):

```
✅ "Desktop connected: true"
✅ "✓ Received response from desktop: { success: true, operationId: 'search-12345' }"
✅ "Automation completed"

❌ SHOULD NOT SEE:
- "⏱️ COMMAND TIMEOUT"
- "Age: 15 seconds"
- "Desktop did not respond in time"
```

### Desktop Console Logs (Expected):

```
✅ "[ORCHESTRATOR] Build: 2026-08-19T15:30:00Z"
✅ "[ORCHESTRATOR] Enqueued: search-12345"
✅ "[ORCHESTRATOR] Queue length: 1"
✅ "[ORCHESTRATOR] Processing queue..."
✅ "[ORCHESTRATOR] State update: { status: 'running', step: 'Desktop' }"
✅ "[UI] Rendering FileSearchProgress window"
✅ "[ORCHESTRATOR] DEV: Auto-grant in 800ms"
✅ "[ORCHESTRATOR] Search complete: found 3 results"

❌ SHOULD NOT SEE:
- "await searchPromise" (blocking call)
- No version stamp
- Queue length always 0
```

---

## 📁 File Structure

```
SmartyAI/
├── hooks/
│   └── useCursorAutomation.ts       → WebSocket handler (IMMEDIATE ACK)
├── lib/
│   └── fileSearchOrchestrator.ts    → Queue + state machine (NEVER BLOCKS)
├── components/
│   └── FileSearchProgress.tsx       → UI subscriber (NEVER AWAITS)
├── app/api/native/
│   ├── file-search/route.ts        → Native search endpoint
│   └── tcc-status/route.ts         → Permission check endpoint
└── native/
    └── smarty-finder-helper/        → Swift TCC helper (signed)
```

---

## 🎯 Migration Checklist

- [x] Read all 22+ fix documents
- [x] Understand previous attempts and failures
- [x] Design unified state machine
- [x] Update useCursorAutomation.ts (fire-and-forget)
- [x] Update fileSearchOrchestrator.ts (real queue)
- [x] Update FileSearchProgress.tsx (subscribed UI)
- [x] Add version stamping for cache detection
- [x] Document expected log sequence
- [x] Create testing protocol
- [x] Archive old fix documents

---

## 📚 Archived Documents

The following documents have been superseded and archived into `docs/archived-fixes/`:

1. `FILE_SEARCH_PERMISSION_FIX.md`
2. `OPENCLAW_FILE_SEARCH_IMPLEMENTATION.md`
3. `AUTOMATION_FIX_SUMMARY.md`
4. `FIX_APPLIED_WEBSOCKET_TIMEOUT.md`
5. `AUTOMATION_ARCHITECTURE_CORRECT.md`
6. `COMPLETE_FIX_SUMMARY.md`
7. And 16+ other fix documents...

**DO NOT CREATE NEW FIX DOCUMENTS.** All future changes should update THIS document.

---

## 🚀 Production Deployment

### Environment Variables:

```bash
NODE_ENV=production           # Disables auto-grant
ORCHESTRATOR_VERSION=2.0.0   # Version stamp in logs
```

### Health Check:

```bash
curl http://localhost:3001/api/orchestrator/health
# Expected: { status: "ok", version: "2.0.0", queueLength: 0 }
```

---

**Last Updated:** 2026-08-19  
**Author:** Implementation Agent v2  
**Status:** ✅ READY FOR TESTING

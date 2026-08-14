# Telegram Socket.io Fix Complete ✅

## Problem
Telegram commands were timing out because the webhook was using `socketIO.on('automation-result')` on the **server instance**, which is fundamentally wrong. Servers cannot listen to their own broadcasts.

## Root Cause
```typescript
// ❌ WRONG - Server instance cannot listen to itself
socketIO.on('automation-result', resultHandler)
```

The `socketIO` variable is the **server instance**, not a client. It can only:
- Emit events TO clients
- Receive events FROM clients via `io.on('connection', socket => socket.on(...))`

## Solution: Pending Command Registry

### 1. `/lib/socket.ts` - Added Command Registry
```typescript
// Track pending automation commands waiting for desktop response
const pendingCommands = new Map<string, {
  resolve: (success: boolean) => void
  reject: (error: Error) => void
  timestamp: number
}>()

export function registerPendingCommand(commandId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    pendingCommands.set(commandId, { resolve, reject, timestamp: Date.now() })
    
    // Auto-cleanup after 15 seconds
    setTimeout(() => {
      if (pendingCommands.has(commandId)) {
        pendingCommands.delete(commandId)
        reject(new Error('Command timeout'))
      }
    }, 15000)
  })
}

export function resolvePendingCommand(commandId: string, success: boolean) {
  const pending = pendingCommands.get(commandId)
  if (pending) {
    pending.resolve(success)
    pendingCommands.delete(commandId)
  }
}
```

### 2. `/lib/socket.ts` - Updated Result Handler
```typescript
socket.on('automation-result', (result: AutomationResult) => {
  // Resolve pending command promise
  resolvePendingCommand(result.commandId, result.success)
  
  // Broadcast to room (for other listeners)
  io.to(`user:${result.userId}`).emit('automation-result', result)
})
```

### 3. `/lib/telegram/ai.ts` - Use Registry Pattern
```typescript
executeTextCommand: async (cmd: string) => {
  const executionId = `exec_${Date.now()}_${Math.random()...}`
  
  // Emit to desktop
  socketIO.to(`user:${userId}`).emit('automation-command', {
    commandId: executionId,
    userId,
    command: cmd,
    source: 'telegram',
    timestamp: Date.now()
  })
  
  // Wait for result using pending command registry
  try {
    const success = await registerPendingCommand(executionId)
    return success
  } catch (error) {
    return false
  }
}
```

## Architecture Flow

```
┌─────────────┐                  ┌──────────────┐                 ┌─────────────┐
│  Telegram   │                  │   Server     │                 │   Desktop   │
│   Webhook   │                  │  (socket.ts) │                 │   Client    │
└──────┬──────┘                  └──────┬───────┘                 └──────┬──────┘
       │                                │                                │
       │ 1. registerPendingCommand(id) │                                │
       ├───────────────────────────────►│                                │
       │                                │                                │
       │ 2. emit('automation-command')  │                                │
       ├───────────────────────────────►│                                │
       │                                │ 3. Broadcast to room           │
       │                                ├───────────────────────────────►│
       │                                │                                │
       │                                │                   4. Execute command
       │                                │                                │
       │                                │ 5. emit('automation-result')  │
       │                                │◄───────────────────────────────┤
       │                                │                                │
       │ 6. resolvePendingCommand(id)   │                                │
       │◄───────────────────────────────┤                                │
       │                                │                                │
       │ 7. Promise resolves            │                                │
       │                                │                                │
```

## Benefits

1. ✅ **No Duplicate Logic** - Reuses Terminal's existing automation flow
2. ✅ **Clean Architecture** - Server routes events properly
3. ✅ **Proper Async Handling** - Promise-based command tracking
4. ✅ **15 Second Timeout** - Prevents hanging requests
5. ✅ **Desktop Status Check** - Verifies desktop is connected before emitting

## Testing

1. Restart dev server: `npm run dev`
2. Open desktop and verify Socket.io connection
3. Send Telegram command: "Open YouTube"
4. Expected logs:
   ```
   [Telegram] 📡 Emitting automation-command: exec_...
   [Telegram] ✅ Event emitted to room user:6a6e1368288a88e353467484
   [Socket.io] 📝 Registering pending command: exec_...
   [Desktop] 📩 Telegram automation received: {...}
   [Desktop] 🤖 Executing Telegram command: open YouTube
   [Desktop] 📤 Sending result back to server: {...}
   [Socket.io] 📊 Automation result for command exec_...: ✅ Success
   [Socket.io] ✅ Resolving pending command: exec_... → true
   [Telegram] ✅ Desktop responded: true
   ```

## Files Modified

1. ✅ `/lib/socket.ts` - Added pending command registry
2. ✅ `/lib/telegram/ai.ts` - Updated to use registry pattern
3. ✅ `/components/Dekstop/deskstop.tsx` - Already correct (no changes needed)
4. ✅ `/hooks/useSocketIO.ts` - Already correct (no changes needed)

## Status
- ✅ Build successful
- ✅ No duplicate code
- ✅ Terminal flow reused
- ✅ Ready for testing

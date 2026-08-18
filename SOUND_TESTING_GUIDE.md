# Sound System Testing Guide 🔊

## Quick Start

**Visit the test page:** `http://localhost:3000/test/sounds`

This page provides an interactive UI to test all sound triggers.

---

## Where Sounds Play Automatically

### 1. ⚠️ Global Error Handler (Faaah Sound)

**When:** ANY uncaught JavaScript error or unhandled promise rejection

**How to test:**
```javascript
// In browser console:
throw new Error('Test error');
// OR
Promise.reject('Test rejection');
```

**Expected:** "Faaah" (Challo) sound plays immediately

**Implementation:** `app/components/ErrorSoundHandler.tsx`

---

### 2. 🖥️ Terminal Commands

**When:** 
- Command sent → "Faaah" plays
- Command complete → "Correct" plays

**How to test:**
1. Open Terminal app: `/terminal`
2. Type any command: `ls`, `pwd`, etc.
3. Press Enter

**Expected:** 
- "Faaah" plays when command starts
- "Correct" plays when command finishes

**Implementation:** `lib/handleCommand.tsx`

---

### 3. 🔴 Reaction Engine - Error Events

**When:** Events with severity ≥ 0.6 and error-related intent

**Triggers:**
- `error`, `failure`, `bug`, `critical` in intent
- `shock`, `frustration` emotions
- Severity threshold: 0.6+

**How to test programmatically:**
```typescript
import { react } from '@/lib/sound/reactionEngine';

// High severity error → plays faaah
await react({
  event: 'deployment_failed',
  severity: 0.85,  // ≥ 0.6 triggers faaah
  source: 'deployment'
});

// API error → plays faaah
await react({
  event: 'api_error',
  severity: 0.7,
  source: 'api'
});

// Low severity success → NO faaah
await react({
  event: 'deployment_success',
  severity: 0.1,  // < 0.6, no faaah
  source: 'deployment'
});
```

**Implementation:** `lib/sound/reactionEngine.ts` (lines 165-180)

---

### 4. ⚙️ Settings UI - Preview Sounds

**When:** Clicking play buttons in settings

**How to test:**
1. Visit: `/settings/sounds`
2. Click any 🔊 play button

**Expected:** Sound plays immediately

**Implementation:** `app/(root)/settings/sounds/page.tsx`

---

### 5. 🛠️ Programmatic Usage

**Manual sound playback:**
```typescript
import { playById } from '@/lib/sound/reactionEngine';

await playById('faaah');  // Play Challo
await playById('correct'); // Play Job's Done
```

**Wrap functions with error sound:**
```typescript
import { wrapWithErrorSound } from '@/lib/sound/errorSoundMiddleware';

const riskyFunction = async () => {
  // If this throws, faaah plays
  throw new Error('Failed!');
};

const safeFunction = wrapWithErrorSound(riskyFunction);
await safeFunction(); // Faaah plays on error
```

**Catch with sound:**
```typescript
import { catchWithErrorSound } from '@/lib/sound/errorSoundMiddleware';

try {
  await catchWithErrorSound(somePromise());
} catch (error) {
  // Sound already played
}
```

---

## Testing Scenarios

### Test 1: Manual Sounds
```typescript
// Browser console or code
import { playById } from '@/lib/sound/reactionEngine';

await playById('faaah');    // ✓ Should hear Challo
await playById('correct'); // ✓ Should hear Job's Done
```

### Test 2: Error Events
```typescript
import { react } from '@/lib/sound/reactionEngine';

// High severity errors
await react({ event: 'critical_error', severity: 0.9 }); // ✓ Faaah plays
await react({ event: 'api_error', severity: 0.7 });      // ✓ Faaah plays

// Low severity = no faaah
await react({ event: 'success', severity: 0.2 });        // ✗ No faaah
```

### Test 3: Terminal Integration
1. Open `/terminal`
2. Type: `echo "test"`
3. Press Enter

**Timeline:**
- T+0ms: "Faaah" plays (command sent)
- T+Xms: Command executes
- T+Yms: "Correct" plays (command complete)

### Test 4: Global Errors
```typescript
// Browser console
throw new Error('Test');
// ✓ Faaah plays

// Unhandled rejection
Promise.reject('test');
// ✓ Faaah plays
```

---

## Sound Event Mappings

### Always Play Faaah (High Severity)
- `critical_error` (severity: 0.85)
- `deployment_failed` (severity: 0.85)
- `runtime_error` (severity: 0.75)
- `build_failed` (severity: 0.75)
- `api_error` (severity: 0.65)

### Pattern Matching
```typescript
// Any event matching these patterns:
/error|failed|failure/i     → Error intent
/critical|severe|major/i     → Critical error

// With emotion:
emotion: 'shock'             → Faaah plays
emotion: 'frustration'       → Faaah plays

// Threshold:
severity >= 0.6              → Faaah plays
```

---

## Debug Tips

### Check Sound Files
```bash
ls -lh public/sounds/
# Should see: faaah.mp3, correct.mp3, error_CDOxCYm.mp3
```

### Check Console Logs
```
[SoundEngine] Initializing...
[SoundEngine] ✓ Preloaded faaah
[SoundEngine] Reacted to "critical_error" → faaah
[ReactionEngine] 🚨 Error detected, playing faaah sound
```

### Browser DevTools
```javascript
// Check audio context state
console.log('Audio elements:', document.querySelectorAll('audio').length);

// Manual test
await import('/lib/sound/reactionEngine').then(m => m.playById('faaah'));
```

---

## Test Page Features

Visit: `http://localhost:3000/test/sounds`

**Features:**
1. ✅ Play individual sounds manually
2. ✅ Test error events with different severities
3. ✅ Test success events (low severity)
4. ✅ Trigger global errors
5. ✅ See real-time test results
6. ✅ Clear results and re-test

---

## Quick Reference

| Trigger | Sound | When |
|---------|-------|------|
| Global Error | Faaah | Any uncaught error (console) |
| Terminal Start | Faaah | Command sent (`/terminal`) |
| Terminal End | Correct | Command completes (`/terminal`) |
| High Severity (≥0.6) | Faaah | Error events via react() |
| Manual Play | Any | Click in `/settings/sounds` |
| Programmatic | Any | playById() or react() |

---

## Files to Check

- ✅ **Reaction Engine:** `lib/sound/reactionEngine.ts` (line 165-180)
- ✅ **Error Middleware:** `lib/sound/errorSoundMiddleware.ts`
- ✅ **Terminal Integration:** `lib/handleCommand.tsx`
- ✅ **Global Handler:** `app/components/ErrorSoundHandler.tsx`
- ✅ **Test Page:** `app/(root)/test/sounds/page.tsx`

---

## Troubleshooting

### No sound plays?
1. Check browser console for errors
2. Verify files in `public/sounds/` exist
3. Click "Play Faaah" button on test page
4. Check if sounds are enabled in settings

### Sound plays but not from events?
1. Check event severity (must be ≥ 0.6 for faaah)
2. Check console for "[ReactionEngine] 🚨 Error detected"
3. Verify reaction engine initialized: look for "[SoundEngine] ✓ Sound system ready"

### Global errors not triggering sound?
1. Verify `<ErrorSoundHandler />` is in layout
2. Check console: should see "✓ Global error handler installed"
3. Try manual trigger: `throw new Error('test')`

---

**Ready to test!** 🎉

Open `http://localhost:3000/test/sounds` and start testing!

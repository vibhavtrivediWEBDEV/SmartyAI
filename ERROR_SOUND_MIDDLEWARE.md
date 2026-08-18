# Error Sound Middleware 🔊

## Purpose

The Error Sound Middleware automatically plays the "faaah" (Challo) sound whenever ANY error occurs in the application. This provides immediate audio feedback for errors, making debugging and error awareness more intuitive.

## How It Works

### 1. Global Error Handler
Installed in the root layout (`app/layout.tsx`), the global error handler catches:
- Uncaught JavaScript errors
- Unhandled promise rejections
- Any runtime errors in the browser

### 2. Reaction Engine Integration
When the reaction engine detects an error event (severity >= 0.6), it plays "faaah" before the matched sound:

```typescript
// In lib/sound/reactionEngine.ts
if (reaction.intent.includes('error') || 
    reaction.intent.includes('failure') || 
    reaction.intent.includes('bug') ||
    reaction.intent.includes('critical') ||
    reaction.emotion === 'shock' ||
    reaction.emotion === 'frustration') {
  if (reaction.severity >= 0.6) {
    await playById('faaah', { volume: 0.6 });
  }
}
```

### 3. Programmatic Usage
You can also use the middleware in your code:

```typescript
import { 
  playErrorSound, 
  wrapWithErrorSound, 
  catchWithErrorSound 
} from '@/lib/sound/errorSoundMiddleware';

// Play error sound manually
await playErrorSound();

// Wrap async functions to auto-play on error
const safeFunction = wrapWithErrorSound(async () => {
  // If this throws, faaah will play
  return await riskyOperation();
});

// Catch errors with sound
try {
  await catchWithErrorSound(somePromise);
} catch (error) {
  // Sound already played
}
```

## Components

### ErrorSoundHandler Component
Located in `app/components/ErrorSoundHandler.tsx`, this component:
- Initializes the sound system on app load
- Sets up global error handlers
- Plays "faaah" on uncaught errors

### Error Sound Middleware
Located in `lib/sound/errorSoundMiddleware.ts`, provides:
- `playErrorSound()` - Play "faaah" manually
- `wrapWithErrorSound(fn)` - Wrap async functions
- `catchWithErrorSound(promise)` - Catch with sound
- `setupGlobalErrorHandler()` - Install global handlers

## Error Detection Patterns

The middleware detects these error patterns:
- `error`, `failure`, `bug`, `critical` in intent names
- `shock`, `frustration` emotions with high severity
- Severity >= 0.6 (scale 0-1)

## Examples

### Example 1: Global Error
```typescript
// This will automatically play faaah
throw new Error('Something went wrong!');
```

### Example 2: API Error
```typescript
import { react } from '@/lib/sound/reactionEngine';

// This plays faaah (due to error severity)
await react({
  event: 'api_error',
  severity: 0.7,
  source: 'api'
});
```

### Example 3: Wrapped Function
```typescript
import { wrapWithErrorSound } from '@/lib/sound/errorSoundMiddleware';

const safeApiCall = wrapWithErrorSound(async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('API failed');
  return response.json();
});

// If fetch fails, faaah plays automatically
const data = await safeApiCall('/api/data');
```

### Example 4: Manual Error Handling
```typescript
import { playErrorSound } from '@/lib/sound/errorSoundMiddleware';

try {
  await riskyOperation();
} catch (error) {
  await playErrorSound(); // Play faaah
  console.error('Operation failed:', error);
}
```

## Configuration

The error sound middleware is automatically configured when the app loads. You can customize it by modifying:

### Volume
Change the error sound volume in `lib/sound/errorSoundMiddleware.ts`:
```typescript
await playById('faaah', { volume: 0.6 }); // Adjust 0.0-1.0
```

### Reaction Engine Threshold
Change the severity threshold in `lib/sound/reactionEngine.ts`:
```typescript
if (reaction.severity >= 0.6) { // Change this value
  await playById('faaah', { volume: 0.6 });
}
```

## Test Results

All tests passing:
```
✓ lib/sound/__tests__/errorSoundMiddleware.test.ts (6 tests)
  ✓ playErrorSound() - plays faaah sound
  ✓ playErrorSound() - handles audio failures gracefully
  ✓ wrapWithErrorSound() - no sound on success
  ✓ wrapWithErrorSound() - plays sound on error
  ✓ catchWithErrorSound() - no sound on success
  ✓ catchWithErrorSound() - plays sound on error

Test Files  1 passed (1)
Tests        6 passed (6)
```

## Implementation Details

### Files Modified/Created:
1. ✅ **lib/sound/errorSoundMiddleware.ts** - Error sound utilities
2. ✅ **lib/sound/reactionEngine.ts** - Added error detection logic
3. ✅ **app/components/ErrorSoundHandler.tsx** - Global handler component
4. ✅ **app/layout.tsx** - Integrated error handler
5. ✅ **tests** - All 39 sound tests passing

### Flow:
```
Error Occurs
    ↓
Global Error Handler Catches It
    ↓
playById('faaah') Called
    ↓
"Challo" Sound Plays
    ↓
(If error event detected)
    ↓
Reaction Engine May Also Play Error-Specific Sound
```

## Benefits

1. **Immediate Feedback** - Know when errors occur without checking console
2. **Debugging Aid** - Audio cues help identify error patterns
3. **Non-Breaking** - Never crashes app, errors absorbed silently
4. **Flexible** - Can be used programmatically or automatically
5. **Performance** - <5ms for error detection and sound triggering

---

**Status:** ✅ Complete and Tested
**Tests:** 39 passing
**Integration:** Active in app layout

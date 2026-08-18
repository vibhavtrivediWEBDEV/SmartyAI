# Sound Reaction Engine - Quick Start

## For Users

### Add Sound Reactions to Your Component

```tsx
import { useSoundReaction } from '@/hooks/useSoundReaction';

function MyComponent() {
  const { react, play } = useSoundReaction();
  
  const handleSuccess = async () => {
    await doWork();
    await react({ event: 'automation_success' });
  };
  
  const handleSpecial = async () => {
    await play('vine_boom');
  };
  
  return <div>...</div>;
}
```

### Common Events

```typescript
// Success events
react({ event: 'automation_success' });
react({ event: 'deployment_success' });
react({ event: 'test_passed' });

// Error events
react({ event: 'runtime_error', severity: 0.75 });
react({ event: 'deployment_failed', severity: 0.85 });
react({ event: 'api_error', severity: 0.65 });

// Informational
react({ event: '404', severity: 0.5 });
react({ event: 'warning', severity: 0.4 });
```

### Direct Playback

```typescript
// Play specific sound
play('vine_boom');
play('fahh');
play('sad_violin');

// With options
play('success_chime', { volume: 0.5 });
```

## For Developers

### Add Custom Event

```typescript
import { registerFastEvent } from '@/lib/sound/eventMapper';

registerFastEvent('my_custom_event', {
  intent: 'bug',
  severity: 0.6,
  confidence: 0.85,
  emotion: 'frustration',
  humor: 0.8
});
```

### Add New Sound

1. Add audio file to `/public/sounds/my_sound.mp3`
2. Update sound library:

```typescript
// In lib/sound/soundLibrary.ts
{
  id: 'my_sound',
  name: 'My Custom Sound',
  intent: ['custom_intent'],
  emotion: 'celebration',
  severity: { min: 0.3, max: 0.7 },
  humor: 0.8,
  energy: 0.7,
  confidence_threshold: 0.65
}
```

### Integration Pattern

```typescript
// In your existing code
import { react } from '@/lib/sound';

async function someFunction() {
  try {
    const result = await doWork();
    
    // Optional: Add sound reaction
    await react({
      event: 'success',
      severity: 0.2,
      source: 'gui'
    });
    
    return result;
    
  } catch (error) {
    // Absorb sound reaction errors
    await react({ event: 'error', severity: 0.7 }).catch(() => {});
    
    throw error;
  }
}
```

## Performance Notes

- Common events: <5ms (local classification)
- Unknown events: ~200-500ms (AI fallback)
- Direct playback: Instant (preloaded)

## Important Rules

✅ **DO**
- Use react() for intelligent selection
- Use play() for explicit playback
- Pass context for better reactions
- Absorb sound errors gracefully

❌ **DON'T**
- Block critical operations awaiting react()
- Throw errors from sound reactions
- Hardcode sound IDs everywhere
- Call AI for every UI event

## Next Steps

1. Add actual audio files to `/public/sounds/`
2. Test playback in your components
3. Customize event mappings as needed
4. Monitor performance and adjust

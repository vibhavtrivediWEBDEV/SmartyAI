# Sound Files Placeholder

This directory should contain audio files for the Sound Reaction Engine.

## Required Files

Add the following MP3 files (or other supported formats):

1. `fahh.mp3` - FAHHHH reaction
2. `are_baap_re.mp3` - ARE BAAP RE reaction
3. `gadbad.mp3` - Gadbad reaction
4. `vine_boom.mp3` - Vine Boom reaction
5. `sad_violin.mp3` - Sad Violin reaction
6. `success_chime.mp3` - Success chime
7. `celebration.mp3` - Celebration sound
8. `airhorn.mp3` - Air horn alert
9. `bruh.mp3` - Bruh reaction
10. `womp_womp.mp3` - Womp womp reaction
11. `oof.mp3` - Oof reaction
12. `jobs_done.mp3` - Job's done reaction

## Audio Sources

⚠️ **IMPORTANT: AUDIO LICENSING**

You must use:
- Original audio files you create/own
- Properly licensed royalty-free audio
- Audio with appropriate attribution

Do NOT download and redistribute sounds from third-party sources without proper rights.

## Recommended Sources

- [Freesound.org](https://freesound.org) - Creative Commons licensed sounds
- [Pixabay](https://pixabay.com/music/) - Royalty-free music and sounds
- Create your own using tools like:
  - GarageBand (macOS)
  - Audacity (Free)
  - Online tone generators

## File Format

- Format: MP3 (recommended), WAV, or OGG
- Sample rate: 44.1 kHz
- Bit rate: 128-256 kbps
- Duration: 1-3 seconds (optimal for reactions)

## Testing

After adding files, test playback:

```typescript
import { playById } from '@/lib/sound';

await playById('vine_boom');
```

## Volume Normalization

Ensure all audio files are normalized to similar volume levels
to provide consistent playback experience.

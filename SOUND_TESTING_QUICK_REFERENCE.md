# Sound Testing Quick Reference 🎵

## How to Test Sounds

### 1. 🎯 Interactive Test Page (Recommended)
Visit: `http://localhost:3000/test/all-sounds`

**Features:**
- All 31+ sounds organized by category
- Click any sound to play instantly
- "Test All Sounds" button plays everything
- Live test log with results
- Sound metadata displayed (ID, description, playsOn)

### 2. 🖥️ Terminal Testing
**What Changed:**
- ❌ **Before:** Played "Faaah" on command enter
- ✅ **Now:** Silent on enter, only plays "Correct" when done

**How to Test:**
1. Open Terminal: `/terminal`
2. Type any command: `ls`, `pwd`, `echo "test"`
3. Press Enter
4. **Expected:** Silent → Command executes → "Correct" plays on completion

### 3. 🎨 Settings UI
Visit: `http://localhost:3000/settings/sounds`

**Features:**
- All sounds with play buttons
- Volume sliders for each sound
- Enable/disable toggles
- Search functionality

### 4. 💻 Browser Console Testing

Paste in browser console:

```javascript
// Test single sound
const { playById } = await import('/lib/sound/reactionEngine.ts');
await playById('faaah');

// Test multiple sounds
const sounds = ['faaah', 'correct', 'applepay', 'anime-wow-sound-effect'];
for (const id of sounds) {
  await playById(id);
  await new Promise(r => setTimeout(r, 500));
}

// List all sounds
const schema = await import('/lib/sound/soundSettingsSchema.ts');
const all = schema.getAllSoundsFlat();
console.log(`Found ${all.length} sounds:`);
all.forEach((s, i) => console.log(`${i+1}. ${s.id} - ${s.name}`));
```

### 5. 📱 Quick Console Helper

Load the helper script:
```javascript
// Load from page
const script = document.createElement('script');
script.src = '/test-sounds-console.js';
document.head.appendChild(script);

// Then use:
testSounds.play('faaah');
testSounds.list();
testSounds.status();
```

---

## All Available Sounds (31+)

### 🖥️ Terminal (3 sounds)
1. `faaah` - Challo (Let's go!)
2. `correct` - Job's Done
3. `error_CDOxCYm` - Error Beep

### 🎉 Success (3 sounds)
4. `applepay` - Apple Pay
5. `abhi-maza-ayagga` - Abhi Maza Ayagga
6. `anime-wow-sound-effect` - Anime Wow

### ❌ Errors (4 sounds)
7. `wrong-answer-sound-effect` - Wrong Answer
8. `are-baap-re-yaad-aya` - Are Baap Re
9. `depression-indian` - Depression
10. `shocked-sound-effect` - Shocked

### 😂 Reactions (6 sounds)
11. `aayein-meme` - Aayein (What?)
12. `baigan` - Baigan
13. `maa-tari-oo-bhai` - Maa Tari Oo Bhai
14. `ab-tu-gaya-beta-ab-dekh-tu-puneet` - Ab Tu Gaya
15. `galaxy-meme` - Galaxy Meme
16. `anime-ahh` - Anime Ahh

### 🎭 Dramatic (4 sounds)
17. `run-vine-sound-effect` - Vine Boom
18. `nahi-nahi-saluke-yaha-kuchh-to-gadbad-hai` - Gadbad Hai
19. `tf_nemesis` - Nemesis
20. `eh-eh-ehhhh` - Eh Eh Ehhh

### 🔔 Notifications (4 sounds)
21. `notification_o14egLP` - Notification
22. `mouse-click-sound` - Click
23. `camera-flash-sound-effect` - Camera Flash
24. `censor-beep-1` - Censor Beep

### 🎬 TV & Movies (3 sounds)
25. `a-few-moments-later-sponge-bob-sfx-fun` - SpongeBob Time Card
26. `cid-acp-mc` - CID MC
27. `cid-le-mdc` - CID Daya

### ⚡ Actions (4 sounds)
28. `punch-gaming-sound-effect-hd_RzlG1GE` - Punch
29. `gunshotjbudden` - Gunshot
30. `yo-phone-is-ringing` - Phone Ringing
31. `ny-video-online-audio-converter` - Loading

---

## Terminal Behavior - Updated

### What Changed:
**Before:**
```
Enter command → Faaah plays → Command runs → Correct plays
```

**Now:**
```
Enter command → Silent → Command runs → Correct plays
```

### Why:
- Removed "Faaah" sound on terminal input
- Only plays "Correct" sound when command completes
- Less noisy during typing

---

## Sound Triggers

### Automatic Triggers:
1. **Terminal Complete** → `correct` (Job's Done)
2. **Error Event** (severity ≥ 0.6) → `faaah` + error sound
3. **Global Error** → `faaah` (Challo)
4. **Success Events** (low severity) → No sound

### Manual Triggers:
1. Settings UI - Play buttons
2. Test pages - Click to play
3. Browser console - `playById()`
4. Programmatic - `react()` function

---

## Quick Test Commands

### Browser Console:
```javascript
// Single sound
await playById('faaah');

// Multiple sounds
['faaah', 'correct', 'applepay'].forEach(async id => {
  await playById(id);
  await new Promise(r => setTimeout(r, 300));
});
```

### Terminal:
```bash
# Test terminal completion sound
ls
pwd
echo "test"
# Each command plays "Correct" when done
```

---

## Test Pages

1. **All Sounds Test:** `/test/all-sounds`
   - Complete testing of all 31+ sounds
   - Category organized
   - Play all at once

2. **Quick Test:** `/test/sounds`
   - Test specific scenarios
   - Error events
   - Success events

3. **Settings:** `/settings/sounds`
   - Preview sounds
   - Adjust volumes
   - Enable/disable

---

## Files Modified

- ✅ `lib/handleCommand.tsx` - Removed faaah on input, kept correct on completion
- ✅ `app/(root)/test/all-sounds/page.tsx` - Comprehensive testing page
- ✅ `SOUND_TESTING_QUICK_REFERENCE.md` - This file

---

**Ready to test!** Visit `/test/all-sounds` to try all sounds! 🎉

# Test Plan: Automation Architecture Verification

## Objective

Verify that Terminal and Telegram use the **EXACT SAME** automation resolution system.

---

## Test 1: Direct Command - Open Chrome

### Terminal Test
**Input:** `open chrome`

**Expected Flow:**
```
1. handleCommand.tsx receives command
2. executeSmartyCommand("open chrome", {source:'terminal', automationAPI})
3. Common engine builds sequence: [{action:'open', target:'chrome', delay:100}]
4. automationAPI.executeSequence([{action:'open', target:'chrome', delay:100}])
5. Chrome opens
```

**Pass Criteria:**
- [ ] Console shows: `[CommonCommandEngine] AUTOMATION SEQUENCE BUILT`
- [ ] Console shows: `Mapped Target: "chrome" → "chrome"`
- [ ] Console shows: `LOCAL SOURCE: Executing via automationAPI.executeSequence()`
- [ ] Chrome opens successfully

---

### Telegram Test
**Input:** `/open chrome`

**Expected Flow:**
```
1. telegram/ai.ts receives command
2. executeSmartyCommand("open chrome", {source:'telegram', automationAPI:null})
3. Common engine builds sequence: [{action:'open', target:'chrome', delay:100}]
4. Returns {automation: [{action:'open', target:'chrome', delay:100}]}
5. WebSocket emits 'automation-command' with sequence
6. Desktop receives and calls executeSequence()
7. Chrome opens
```

**Pass Criteria:**
- [ ] Console shows: `[CommonCommandEngine] AUTOMATION SEQUENCE BUILT`
- [ ] Console shows: `Mapped Target: "chrome" → "chrome"`
- [ ] Console shows: `REMOTE SOURCE: Returning sequence for WebSocket`
- [ ] Console shows: `[Telegram] EMITTING automation-command TO WEBSOCKET`
- [ ] Console shows: `[Desktop] EXECUTING AUTOMATION SEQUENCE`
- [ ] Chrome opens successfully

---

## Test 2: Direct Command - Close Terminal

### Terminal Test
**Input:** `close Terminal`

**Expected Flow:**
```
1. Common engine builds sequence: [{action:'close', target:'Terminal', delay:100}]
2. automationAPI.executeSequence([{action:'close', target:'Terminal', delay:100}])
3. Terminal window closes
```

**Pass Criteria:**
- [ ] Console shows: `Mapped Target: "Terminal" → "Terminal"`
- [ ] automationAPI.executeSequence is called
- [ ] Terminal window closes

---

### Telegram Test
**Input:** `/close Terminal`

**Expected Flow:**
```
1. Common engine builds sequence: [{action:'close', target:'Terminal', delay:100}]
2. WebSocket sends sequence to Desktop
3. Desktop.executeSequence([{action:'close', target:'Terminal', delay:100}])
4. Terminal window closes
```

**Pass Criteria:**
- [ ] Console shows: `REMOTE SOURCE: Returning sequence for WebSocket`
- [ ] WebSocket emission logged
- [ ] Desktop execution logged
- [ ] Terminal window closes

---

## Test 3: Direct Command - Maximize Settings

### Terminal Test
**Input:** `maximize Settings`

**Expected Flow:**
```
1. Common engine builds sequence: [{action:'maximize', target:'Settings', delay:100}]
2. automationAPI.executeSequence checks if Settings is open
3. If open: maximize it
4. If closed: return error "Settings is not open"
```

**Pass Criteria:**
- [ ] Console shows: `Mapped Target: "Settings" → "Settings"`
- [ ] Correct behavior based on window state

---

### Telegram Test
**Input:** `/maximize Settings`

**Expected Flow:**
```
1. Common engine builds sequence: [{action:'maximize', target:'Settings', delay:100}]
2. WebSocket sends to Desktop
3. Desktop.executeSequence checks window state
4. Correct behavior based on window state
```

**Pass Criteria:**
- [ ] Same behavior as Terminal
- [ ] WebSocket flow completes

---

## Test 4: App Name Mapping

### Test Various App Names

**Test Cases:**
```
Input: "open browser" → Mapped: "chrome"
Input: "open app store" → Mapped: "App Store"
Input: "open face time" → Mapped: "FaceTime"
Input: "open youtube" → Mapped: "Youtube"
```

**Terminal Verification:**
- [ ] Console shows correct mapping for all test cases
- [ ] Correct app opens in all cases

**Telegram Verification:**
- [ ] Console shows correct mapping for all test cases
- [ ] Correct app opens in all cases

---

## Test 5: Complex Automation Sequence

### AI Command Test
**Input:** "Change my wallpaper to nature"

**Terminal Expected Flow:**
```
1. Common engine calls /api/terminalAI
2. AI returns: "intent: change_wallpaper | parameters: {prompt:'nature'}"
3. parseAIResponseAndExecute processes intent
4. automationRegistry.getTemplate('change_wallpaper')
5. automationRegistry.resolveDynamicTargets(template, {prompt:'nature'})
6. Returns resolvedSequence with:
   - {action:'open', target:'Settings'}
   - {action:'click', target:'wallpaper_tab'}
   - {action:'type', target:'search_input', text:'nature'}
   - {action:'wait', target:'wallpaper_results_container', params:{...}}
   - {action:'click', target:'new_wallpaper_0'}
7. automationAPI.executeSequence(resolvedSequence)
```

**Telegram Expected Flow:**
```
1. Same as Terminal steps 1-6
2. Returns {automation: resolvedSequence}
3. WebSocket sends resolvedSequence to Desktop
4. Desktop.executeSequence(resolvedSequence)
```

**Pass Criteria:**
- [ ] Console shows: `[parseAIResponseAndExecute] PARSING AI RESPONSE`
- [ ] Console shows: `automationRegistry.resolveDynamicTargets`
- [ ] Console shows full resolved sequence
- [ ] Wallpaper changes to nature image
- [ ] Both Terminal and Telegram produce SAME result

---

## Test 6: Edge Cases

### Desktop Offline
**Telegram Input:** `/open chrome` (when Desktop app is closed)

**Expected Behavior:**
```
1. Console shows: isDesktopOnline(userId) = false
2. Returns friendly message:
   "🖥️ **Smarty Desktop is offline**
   
   To execute automation commands:
   1️⃣ Open SmartyAI Desktop app
   2️⃣ Make sure you're signed in
   3️⃣ Try the command again"
```

**Pass Criteria:**
- [ ] Correct error message returned
- [ ] No automation sequence sent
- [ ] User knows what to do

---

### Invalid App Name
**Input:** `open invalid_app_123`

**Expected Behavior:**
```
1. Common engine builds sequence: [{action:'open', target:'invalid_app_123', delay:100}]
2. Execute attempts to find app
3. Returns error (handled by automationAPI)
```

**Pass Criteria:**
- [ ] Error handled gracefully
- [ ] User-friendly error message

---

## Test 7: Sequence Format Verification

### Verify Sequence Structure

**Expected Format:**
```typescript
[{
  action: 'open' | 'close' | 'minimize' | 'maximize' | 'focus',
  target: string,
  delay: number
}]
```

**Verification Points:**
- [ ] Action is valid string literal
- [ ] Target is properly mapped string
- [ ] Delay is included (default: 100ms)
- [ ] No extra fields in simple commands
- [ ] Complex sequences include additional fields (text, params, etc.)

---

## Test 8: WebSocket Payload Format

### Desktop WebSocket Event

**Expected Payload:**
```typescript
{
  requestId: string,
  commandId: string,
  userId: string,
  sequence: any[],  // ← Automation sequence
  source: 'telegram',
  timestamp: number
}
```

**Verification Points:**
- [ ] requestId is unique
- [ ] commandId is unique
- [ ] userId matches sender
- [ ] sequence is properly formatted array
- [ ] source is 'telegram'

---

## Test 9: Desktop Response

### WebSocket Result Event

**Expected Payload:**
```typescript
{
  requestId: string,
  commandId: string,
  userId: string,
  success: boolean,
  message: string,
  timestamp: number
}
```

**Verification Points:**
- [ ] success reflects execution result
- [ ] message is human-readable
- [ ] Response received within timeout (15s)

---

## Test 10: Performance

### Execution Time

**Measurements:**
- [ ] Terminal direct command: < 500ms
- [ ] Telegram direct command: < 2s (including WebSocket round-trip)
- [ ] Terminal AI command: < 3s (including AI processing)
- [ ] Telegram AI command: < 5s (including WebSocket round-trip)

---

## Test Results Summary

### Direct Commands
| Test | Terminal | Telegram | Match |
|------|----------|----------|-------|
| Open Chrome | ⬜ | ⬜ | ⬜ |
| Close Terminal | ⬜ | ⬜ | ⬜ |
| Maximize Settings | ⬜ | ⬜ | ⬜ |
| App Name Mapping | ⬜ | ⬜ | ⬜ |

### AI Commands
| Test | Terminal | Telegram | Match |
|------|----------|----------|-------|
| Change Wallpaper | ⬜ | ⬜ | ⬜ |
| Open Settings | ⬜ | ⬜ | ⬜ |

### Edge Cases
| Test | Result |
|------|--------|
| Desktop Offline | ⬜ |
| Invalid App | ⬜ |

---

## Test Execution Commands

### Terminal Tests
```bash
# Test 1
> open chrome

# Test 2
> close Terminal

# Test 3 (open Settings first)
> open Settings
> maximize Settings

# Test 4
> open browser
> open app store
> open facetime
> open youtube
```

### Telegram Tests
```bash
# Test 1
/open chrome

# Test 2
/close Terminal

# Test 3
/maximize Settings

# Test 4
/open browser
/open app store
/open facetime
/open youtube

# Test 5
Change my wallpaper to nature
```

---

## Pass/Fail Criteria

### Overall Test Pass
- ✅ All direct commands work identically
- ✅ All AI commands produce same resolved sequences
- ✅ WebSocket payload format is correct
- ✅ Desktop executes sequences correctly
- ✅ Edge cases handled gracefully
- ✅ Performance within acceptable limits

### Success Metrics
- **Architecture Correctness:** 100% match between Terminal and Telegram
- **Code Quality:** No duplicate logic, type-safe sequences
- **User Experience:** Consistent behavior across all input methods

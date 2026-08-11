# 🧪 Test Automation Planner Guide

## Prerequisites
1. Server running at http://localhost:3000 ✅
2. User logged in with profile in MongoDB ✅
3. Build passing ✅

---

## Test 1: GitHub Automation (Multi-Step)

**Steps:**
1. Open browser → http://localhost:3000
2. Log in with user credentials
3. Click Terminal app (or say "open terminal")
4. Type: `github`
5. Press Enter

**Expected Behavior:**
- AI generates JSON automation:
```json
{
  "automation": [
    {"action": "open", "target": "Chrome", "delay": 300},
    {"action": "setValue", "target": "browser_url", "params": {"value": "https://github.com/adarshagnihotri0"}}
  ]
}
```
- Chrome window opens
- Browser navigates to user's GitHub
- Terminal shows: "Opening your GitHub profile"

---

## Test 2: Portfolio Automation

**Steps:**
1. In Terminal, type: `open my portfolio`
2. Press Enter

**Expected Behavior:**
- AI generates JSON automation:
```json
{
  "automation": [
    {"action": "open", "target": "Chrome"},
    {"action": "setValue", "target": "browser_url", "params": {"value": "https://smarty-ai.com/u/vibhav"}}
  ]
}
```
- Chrome opens user's portfolio

---

## Test 3: Simple Command

**Steps:**
1. In Terminal, type: `open finder`
2. Press Enter

**Expected Behavior:**
- AI returns simple text: `appName: Finder | action: open`
- Finder window opens
- Terminal shows: "Opening Finder"

---

## Test 4: User-Specific Context

**Steps:**
1. In Terminal, type: `who am I`
2. Press Enter

**Expected Behavior:**
```
You are Adarsh, a Developer.
GitHub: https://github.com/adarshagnihotri0
Portfolio: https://smarty-ai.com/u/vibhav
Skills: [Your actual skills from MongoDB]
Projects: [Your actual projects from MongoDB]
```

---

## Test 5: Voice Agent

**Steps:**
1. Click microphone icon
2. Say: "What's my name?"

**Expected Behavior:**
- Voice responds: "Aapka naam Adarsh hai"
- Uses user's actual name from MongoDB

---

## What to Check

✅ Terminal username shows: `adarsh@MacBook-Pro` (not email)
✅ AI uses: "I am Adarsh AI, Adarsh's personal assistant"
✅ GitHub automation opens correct URL
✅ Portfolio automation opens correct URL
✅ Voice agent uses user's name
✅ All responses are user-specific

---

## Debugging

### If automation doesn't execute:
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Look for:
   ```
   ✅ Automation completed
   ```
4. If error, check:
   ```
   ❌ Automation failed: [error]
   ```

### If user context not loading:
1. Check MongoDB connection
2. Verify user has profile in `userProfiles` collection
3. Check server logs for:
   ```
   ✅ User context loaded for: Adarsh - Skills: X - Projects: Y
   ```

### If AI not generating JSON:
1. Check system prompt in `/lib/ai/userAIContext.ts`
2. Verify automation format instructions present
3. Check AI model response in Network tab

---

## Success Criteria

🎯 **All tests pass when:**
1. Terminal shows correct username
2. GitHub automation executes multi-step sequence
3. Portfolio automation executes multi-step sequence
4. Voice agent uses user's actual name
5. All responses are personalized from MongoDB
6. Chrome opens + navigates automatically

---

## Known Working Commands

| Command | Action | Expected |
|---------|--------|----------|
| `github` | Automation | Chrome → User's GitHub |
| `portfolio` | Automation | Chrome → User's portfolio |
| `open finder` | Simple | Finder opens |
| `who am I` | Information | User's profile data |
| `linkedin` | Automation | Chrome → User's LinkedIn |

---

## Architecture Verified

✅ `/lib/ai/userAIContext.server.ts` - MongoDB loading
✅ `/lib/ai/userAIContext.ts` - System prompt with automation
✅ `/app/api/terminalAI/route.ts` - User context injection
✅ `/lib/handleCommand.tsx` - JSON parsing + execution
✅ `/hooks/useCursorAutomation.ts` - Automation execution

---

**Status:** READY FOR TESTING ✅
**Server:** Running at localhost:3000 ✅
**Build:** Passing ✅
**Implementation:** Complete ✅

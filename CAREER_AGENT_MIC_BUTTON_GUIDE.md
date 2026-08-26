# Career Agent MIC Button - Complete Guide 🎯

## What Is This?

The **Career Agent MIC Button** is a voice-activated interface that provides:

✅ **Full Voice Interaction** - Speak naturally to create and control career missions
✅ **Real-Time Orchestration Logs** - Watch every step as it happens
✅ **Complete Visibility** - See all MongoDB operations, API calls, and service coordination
✅ **One-Click Testing** - Quick actions to test without voice

---

## Location

**Button Position:** Fixed at bottom-right corner of the desktop (next to the Voice Control button)

**Visual Appearance:**
- Green gradient when inactive (🟢)
- Red pulsing animation when active (🔴)
- Displays "CAREER" label

---

## How to Use

### Method 1: Voice Commands

**Step 1:** Click the green MIC button to activate
**Step 2:** Speak any of these commands:

#### Create Mission
```
"I have an interview at Google in 5 days for Senior React Developer"
```

#### Check Status
```
"Check my career status"
"What's my preparation progress?"
"How's my career mission going?"
```

#### Pause Mission
```
"Pause career preparation"
"Stop the career agent"
```

#### Resume Mission
```
"Resume career preparation"
"Continue my mission"
```

### Method 2: Quick Actions

Click the **📋** button (top-right of MIC button) to open the log panel, then use:

- **📊 Check Status** - Fetch current mission status
- **➕ Create Test Mission** - Quickly create a test mission (Google, Software Engineer, 7 days)

---

## What You'll See

### When You Create a Mission

The log panel shows every step in real-time:

```
✅ Mission Created: ID: 68e3f2a1b1234c5678901234
ℹ️ Company: Google
ℹ️ Role: Senior React Developer
ℹ️ Interview Date: 9/2/2026

🎯 Orchestrator: Starting mission orchestration...
ℹ️ Phase 1: Analyzing job description
ℹ️ Phase 2: Creating preparation plan
⚠️ Permission: Awaiting user approval
ℹ️ Progress: 25% complete
✅ Complete: All preparation tasks finished!
```

### MongoDB Collections Updated

```javascript
// career_missions
{
  "_id": ObjectId("..."),
  "company": "Google",
  "role": "Senior React Developer",
  "interviewDate": ISODate("2026-09-02"),
  "status": "EXECUTING",
  "progress": 45,
  "skillGaps": [...]
}

// career_agent_logs
{
  "timestamp": ISODate("2026-08-26T14:30:00Z"),
  "action": "Creating calendar events",
  "details": "Set up preparation schedule",
  "status": "success"
}
```

---

## Real-Time Orchestration

Every 2 seconds, the Career Agent:

1. **Fetches Mission Status** from MongoDB
2. **Updates Progress** in the UI
3. **Logs All Actions** to the panel
4. **Shows Current Phase** at the top

### Status Indicators

- 🟢 **ANALYZING** - Extracting job requirements
- 🔵 **PLANNING** - Creating daily schedule
- 🟡 **WAITING_FOR_PERMISSION** - Needs your approval
- 🔵 **EXECUTING** - Running preparation tasks
- 🟢 **COMPLETED** - All tasks finished

---

## Behind the Scenes: What Happens

### Voice Command Flow

```
1. You Speak
   ↓
2. Voice System Detects "interview" keyword
   ↓
3. CareerAgentButton processes transcript
   ↓
4. Extracts: company="Google", role="React Developer", days=5
   ↓
5. Calls POST /api/career/mission
   ↓
6. MongoDB creates career_missions document
   ↓
7. Career Agent starts async orchestration
   ↓
8. Monitor polls every 2 seconds for updates
   ↓
9. UI shows real-time progress
```

### Service Orchestration

The Career Agent automatically coordinates:

#### Calendar Adapter
```
ℹ️ API Call: POST /api/career/mission
✅ Mission Created
ℹ️ Checking calendar.write permission
⚠️ Permission: Needs approval
```

#### Notes Adapter
```
ℹ️ Creating interview notes
✅ Notes generated: "Google Interview Preparation"
```

#### Teacher Adapter
```
ℹ️ Generating teaching sessions
✅ 3 sessions scheduled for next 5 days
```

#### Telegram Adapter
```
ℹ️ Sending Telegram notification
✅ Notification sent to user
```

---

## Testing Checklist

### ✅ Phase 1: Voice Activation
- [ ] Click MIC button turns it red
- [ ] Say "I have an interview at Google in 5 days"
- [ ] See transcript in log panel
- [ ] Log shows "Extracting interview details"

### ✅ Phase 2: Mission Creation
- [ ] Mission created successfully
- [ ] See mission ID in logs
- [ ] Status shows "ANALYZING"
- [ ] Progress bar appears

### ✅ Phase 3: Real-Time Updates
- [ ] Status changes to "PLANNING"
- [ ] Progress updates every 2 seconds
- [ ] See detailed action logs
- [ ] MongoDB collections populated

### ✅ Phase 4: Voice Controls
- [ ] Say "Check my career status"
- [ ] See current mission details
- [ ] Say "Pause career preparation"
- [ ] Mission status changes to "WAITING_FOR_USER"
- [ ] Say "Resume career preparation"
- [ ] Mission continues execution

---

## API Endpoints Used

### Create Mission
```
POST /api/career/mission
Body: {
  "company": "Google",
  "role": "Software Engineer",
  "interviewDate": "2026-09-02T00:00:00.000Z",
  "priority": "high"
}

Response: {
  "mission": {
    "_id": "...",
    "company": "Google",
    "role": "Software Engineer",
    "status": "CREATED",
    "progress": 0
  }
}
```

### Get Mission Status
```
GET /api/career/mission?missionId=...&userId=...

Response: {
  "mission": {
    "_id": "...",
    "status": "EXECUTING",
    "progress": 45,
    "skillGaps": [...]
  }
}
```

### Fetch Logs
```
GET /api/career/logs?missionId=...

Response: {
  "logs": [
    {
      "timestamp": "2026-08-26T14:30:00Z",
      "action": "Creating calendar events",
      "details": "Set up preparation schedule",
      "status": "success"
    },
    ...
  ]
}
```

---

## Common Issues & Fixes

### Issue: Button Doesn't Appear
**Fix:** Clear browser cache and reload. Button should appear at bottom-right.

### Issue: Voice Not Detected
**Fix:** 
1. Ensure browser has microphone permission
2. Click the green MIC button to activate
3. Speak clearly into microphone

### Issue: Logs Not Showing
**Fix:** 
1. Click the 📋 button to open log panel
2. Check console for errors
3. Verify MongoDB connection

### Issue: Mission Not Created
**Fix:**
1. Check browser console for errors
2. Verify `/api/career/mission` returns 200
3. Check MongoDB collections: `career_missions`, `career_agent_logs`

---

## Keyboard Shortcuts

Currently, the MIC button requires click activation. Future enhancements:

- `Cmd/Ctrl + Shift + C` - Activate Career Agent
- `Cmd/Ctrl + Shift + L` - Toggle log panel

---

## Integration Points

### Desktop Component
```typescript
// desktop.tsx
import { CareerAgentButton } from "./CareerAgentButton"

<CareerAgentButton
  openApplication={openApplication}
  openWindows={openWindows}
  setOpenWindows={setOpenWindows}
  userContext={userContext}
  userId={userId}
/>
```

### Voice Hook
```typescript
// useVoiceAutomation from useDekstopAgent
const { lastTranscript } = useVoiceAutomation({...})

// Career button processes career-related transcripts
if (careerKeywords.test(lastTranscript)) {
  processCareerVoiceCommand(lastTranscript)
}
```

### MongoDB Collections
```
career_missions      - Mission documents
career_tasks         - Preparation tasks
career_plans         - Daily schedules
career_agent_logs    - Activity logs
```

---

## Next Features

### Coming Soon
- [ ] Keyboard shortcuts
- [ ] Mission history view
- [ ] Export logs to PDF
- [ ] Share preparation timeline
- [ ] Interview countdown timer
- [ ] Mock interview scheduling
- [ ] GitHub project analysis integration

---

## Success Metrics

**When everything works, you should see:**

✅ MIC button turns green when clicking
✅ Voice transcript appears in log panel
✅ Mission created with ID
✅ Real-time status updates (ANALYZING → PLANNING → EXECUTING)
✅ Progress bar updates
✅ Detailed action logs
✅ MongoDB shows new documents
✅ Calendar events created
✅ Telegram notifications sent

---

## Developer Notes

### Architecture
```
Voice → useVoiceAutomation hook → processCareerVoiceCommand →
POST /api/career/mission → MongoDB → CareerAgent orchestration →
Monitor polls every 2s → UI updates → User sees real-time logs
```

### Key Files
- `components/Dekstop/CareerAgentButton.tsx` - UI component
- `app/api/career/mission/route.ts` - Mission CRUD
- `app/api/career/logs/route.ts` - Activity logs
- `lib/career/CareerAgent.ts` - Orchestration logic
- `modules/career/career.repository.ts` - MongoDB access

---

**🎯 The Career Agent MIC Button is your voice-activated career preparation assistant!**

**Test it now:** Click the green button and say "I have an interview at Google in 5 days for Senior React Developer"

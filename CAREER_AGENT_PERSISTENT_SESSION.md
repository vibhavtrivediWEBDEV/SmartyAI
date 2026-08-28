# Career Agent - Persistent Conversation State

## Overview

The Career Agent now uses a **persistent conversation state machine** that survives between voice turns, page refreshes, and different input sources (MIC, Telegram, Terminal, GUI).

## Architecture

```
Voice / Telegram / Terminal / GUI
        ↓
/api/career/ai (task: conversation)
        ↓
CareerSessionManager (State Machine)
        ↓
CareerSessionRepository (MongoDB)
        ↓
CareerMission (Created after confirmation)
```

## Key Principles

### 1. ONE ACTIVE SESSION PER USER

- User can only have ONE active career session at a time
- If user says "I have an interview at Google", system creates or resumes session
- Next message "React Developer" updates the SAME session
- Session persists until mission is created or cancelled

### 2. EXPLICIT STATE MACHINE

States are managed by the server, NOT by the AI:

```
COLLECTING_COMPANY
        ↓
COLLECTING_ROLE
        ↓
COLLECTING_INTERVIEW_DATE
        ↓
OPTIONAL_JOB_DESCRIPTION (optional)
        ↓
CONFIRMING
        ↓
CREATE_MISSION
        ↓
RUNNING
```

### 3. SERVER-SIDE VALIDATION

Before creating a mission, the server MUST verify:
- ✅ company exists
- ✅ role exists
- ✅ interviewDate exists
- ✅ userId exists

If ANY field is missing, system continues asking for it.

### 4. STRUCTURED AI RESPONSE

AI returns structured JSON, NOT natural language that needs parsing:

```json
{
  "message": "What role are you interviewing for?",
  "extracted": {
    "company": "Google"
  },
  "nextField": "role",
  "shouldCreateMission": false,
  "state": "COLLECTING_ROLE"
}
```

## Database Schema

### career_sessions Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  
  status: "collecting" | "confirming" | "created" | "running" | "completed" | "cancelled",
  state: "COLLECTING_COMPANY" | "COLLECTING_ROLE" | "COLLECTING_INTERVIEW_DATE" | ...,
  
  draft: {
    company?: string,
    role?: string,
    interviewDate?: Date,
    jobDescription?: string,
    resumeId?: string
  },
  
  missingFields: ["company", "role", "interviewDate"],
  currentQuestion: "What role are you interviewing for?",
  
  conversation: [
    { role: "user", content: "I have an interview at Google", timestamp: Date },
    { role: "assistant", content: "What role are you interviewing for?", timestamp: Date },
    ...
  ],
  
  missionId?: ObjectId, // Set after creation
  
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### POST /api/career/ai

**Request:**
```json
{
  "task": "conversation",
  "data": {
    "userInput": "I have an interview at Google"
  }
}
```

**Response:**
```json
{
  "response": "What role are you interviewing for?",
  "nextState": {
    "stage": "collecting_role",
    "missionData": {
      "company": "Google"
    },
    "awaitingInput": "role"
  },
  "shouldCreateMission": false,
  "sessionId": "67890abc..."
}
```

### GET /api/career/mission

Returns all missions for the authenticated user.

**Response:**
```json
{
  "missions": [
    {
      "id": "123...",
      "company": "Google",
      "role": "React Developer",
      "interviewDate": "2026-09-01T00:00:00.000Z",
      "status": "CREATED",
      "progress": 0
    }
  ]
}
```

## Conversation Flow Example

### Turn 1: User starts conversation

**User:** "I have an interview at Google"

**System:**
- Creates new CareerSession
- Extracts: company = "Google"
- State: COLLECTING_ROLE
- Missing: ["role", "interviewDate"]
- Response: "What role are you interviewing for?"

### Turn 2: User provides role

**User:** "React Developer"

**System:**
- Loads existing session
- Extracts: role = "React Developer"
- State: COLLECTING_INTERVIEW_DATE
- Missing: ["interviewDate"]
- Response: "When is your interview?"

### Turn 3: User provides date

**User:** "In 5 days"

**System:**
- Loads existing session
- Extracts: interviewDate = <calculated date>
- State: CONFIRMING
- Missing: []
- Response: "Perfect! Let me confirm:\n\nCompany: Google\nRole: React Developer\nInterview: [date]\n\nShould I create your career mission now?"

### Turn 4: User confirms

**User:** "Yes"

**System:**
- Validates all required fields
- Creates CareerMission in MongoDB
- Updates session: status = "created", missionId = <id>
- Response: "Excellent! Your career preparation mission has been created."

## Testing

Run the end-to-end test:

```bash
./test-career-agent-e2e.sh
```

This will:
1. Start a conversation
2. Provide role
3. Provide interview date
4. Confirm creation
5. Verify mission exists in MongoDB

## Implementation Files

- `modules/career/careerSession.types.ts` - Type definitions
- `modules/career/careerSession.repository.ts` - MongoDB operations
- `lib/career/CareerSessionManager.ts` - State machine logic
- `app/api/career/ai/route.ts` - API endpoint
- `test-career-agent-e2e.sh` - Test script

## Critical Rules

1. **NEVER** create another parallel career system
2. **NEVER** duplicate intent resolver
3. **NEVER** duplicate microphone flow
4. **NEVER** create fake successful API responses
5. **ALWAYS** persist session state in MongoDB
6. **ALWAYS** validate required fields before mission creation
7. **ALWAYS** use structured AI responses
8. **ALWAYS** use existing applications (Resume, ATS, Interview, Teacher, etc.)

## Integration Points

The Career Agent orchestrates existing capabilities:

- **Resume** → Existing resume functionality
- **ATS** → Existing ATS functionality
- **Interview** → Existing interview/call manager
- **Teacher** → Existing teacher/call manager
- **Calendar** → Existing calendar automation
- **YouTube** → Existing YouTube integration
- **Notes** → Existing notes app
- **VS Code** → Existing VS Code/workspace
- **Mail** → Existing mail automation
- **Telegram** → Existing Telegram integration

Career Agent should produce actions/tasks that use these capabilities, not implement them itself.

## Success Metrics

✅ User can say "I have an interview at Google"
✅ System remembers conversation across turns
✅ User can provide role, date through multiple messages
✅ System asks for confirmation
✅ User confirms with "Yes"
✅ Real CareerMission document created in MongoDB
✅ Mission has valid ID and correct data
✅ Session shows status = "created"

## Failure Scenarios (DO NOT REPORT SUCCESS)

❌ GET /api/career/mission returns 200 (only means endpoint exists)
❌ Desktop compiled without errors
❌ WebSocket connected
❌ /api/career/ai returns 200
❌ "I have an interview at Google" → System responds

**ONLY report success when ALL of the above ✅ conditions are met.**

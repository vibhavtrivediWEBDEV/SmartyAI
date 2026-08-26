# Career Agent Architecture - SmartyAI

## Overview

The Career Agent is a long-running orchestration agent that sits above SmartyAI's existing apps and agents. It coordinates various systems to help developers prepare for jobs, interviews, applications, and career goals.

## Core Principle

**The Career Agent is an ORCHESTRATOR, not another UI app.**

It uses existing SmartyAI capabilities:
- `resolveUserIntent()` + `executeIntent()` - Intent resolution
- `cursorAutomation` - UI automation
- Teacher Agent - Structured learning
- Interview Agent - Mock interviews
- Calendar - Scheduling
- Notes - Documentation
- YouTube - Learning resources
- Mail - Email management
- Telegram - Notifications
- VS Code - Coding workspace

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INPUT                               │
│  (Terminal / Telegram / Voice / UI)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Common Command Engine                       │
│              (lib/commonCommandEngine.tsx)                  │
│  - Detects career-related commands                          │
│  - Routes to Career Agent                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     CAREER AGENT                             │
│                  (lib/career/CareerAgent.ts)                │
│  - Creates Career Mission                                    │
│  - Analyzes Job Description                                  │
│  - Coordinates preparation                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               CAPABILITY MANAGER                             │
│              (lib/capabilityManager.ts)                     │
│  - Checks permissions                                        │
│  - Queues permission requests                               │
│  - Respects user privacy                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    ADAPTERS                                  │
│  (lib/career/adapters/*)                                    │
│  - calendarAdapter → Calendar Service                       │
│  - notesAdapter → Notes System                               │
│  - interviewAdapter → Interview Agent                       │
│  - teacherAdapter → Teacher Agent                            │
│  - vscodeAdapter → Workspace/System                         │
│  - telegramAdapter → Telegram Bot                            │
│  - youtubeAdapter → YouTube API                              │
│  - atsAdapter → ATS Analysis                                │
│  - mailAdapter → Mail Service                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               EXISTING SERVICES                              │
│  (modules/*)                                                 │
│  - Calendar Repository & Service                            │
│  - Interview Repository & Agent                              │
│  - Profile Repository                                        │
│  - Workspace System                                          │
│  - Teacher System                                            │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Creates Career Mission

```
User: "I have an interview with ABC Corp in 4 days for a React Developer role."
  ↓
Common Command Engine detects "interview" keyword
  ↓
Routes to Career Agent
  ↓
Career Agent creates CareerMission in MongoDB
  ↓
Career Agent starts mission orchestration
```

### 2. Mission Execution

```
Career Agent
  ↓ (Analyzes JD)
Extracts JobProfile (skills, technologies, responsibilities)
  ↓ (Analyzes Resume)
Finds SkillGaps (strong, needs_improvement, missing)
  ↓ (Creates Plan)
Generates PreparationPlan with daily tasks
  ↓ (Coordinates Services)
  ├─→ Calendar: Creates preparation schedule
  ├─→ Notes: Creates interview notes
  ├─→ YouTube: Finds learning resources
  ├─→ Teacher: Plans teaching sessions
  ├─→ Interview: Generates practice questions
  ├─→ VS Code: Creates coding tasks
  └─→ Telegram: Sends notifications
```

### 3. Permission Flow

```
Career Agent needs Calendar access
  ↓
Calls calendarAdapter.createCalendarEvent()
  ↓
Adapter checks CapabilityManager
  ↓
If missing permission:
  ↓
  ├─→ Permission queued
  ├─→ User prompted for approval
  ├─→ Agent WAITS (doesn't fail)
  ├─→ User approves
  └─→ Agent RESUMES
```

## Core Components

### 1. Career Agent (`lib/career/CareerAgent.ts`)

Main orchestration class:
- `startMission()` - Begin career preparation
- `analyzeJobDescription()` - Extract job requirements
- `analyzeSkillGaps()` - Compare resume vs JD
- `createPreparationPlan()` - Generate daily tasks
- `executeInitialSetup()` - Coordinate services

### 2. Career Orchestrator (`lib/career/CareerOrchestrator.ts`)

State management:
- `resumeUnfinishedMissions()` - Recover after restart
- `executeDailyTasks()` - Run scheduled tasks
- `updateMissionProgress()` - Track completion

### 3. Career Scheduler (`lib/career/CareerScheduler.ts`)

Background jobs:
- Runs hourly checks
- Sends Telegram notifications
- Updates progress
- Marks completed missions

### 4. Adapters (`lib/career/adapters/*`)

Thin wrappers around existing services:

#### calendarAdapter
- Uses: `modules/calendar/calendar.repository.ts`
- Checks: `calendar.write` permission
- Creates: Preparation schedule

#### notesAdapter
- Uses: Notes system via `resolveUserIntent()`
- Checks: `filesystem.write` permission
- Creates: Interview notes

#### interviewAdapter
- Uses: `modules/interviews/interview.repository.ts`
- Generates: Technical + behavioral questions

#### teacherAdapter
- Uses: Teacher Agent (`components/TeacherAgent.tsx`)
- Creates: Teaching schedule

#### vscodeAdapter
- Uses: Workspace system
- Checks: `filesystem.write` permission
- Creates: Coding practice tasks

#### telegramAdapter
- Uses: Telegram integration
- Sends: Progress notifications
- Format: Daily updates, reminders, summaries

#### youtubeAdapter
- Placeholder for future YouTube integration
- Would search videos, create playlists

#### atsAdapter
- Uses: `lib/ats/*` system
- Analyzes: Resume vs Job Description
- Identifies: Skill gaps

#### mailAdapter
- Uses: Mail system
- Checks: `mail.read`, `mail.compose` permissions
- Prepares: Interview confirmation emails

## MongoDB Collections

### career_missions
```typescript
{
  id: ObjectId
  userId: ObjectId
  
  company: string
  role: string
  jobDescription?: string
  jobProfile?: JobProfile
  
  interviewDate?: Date
  applicationDeadline?: Date
  
  resumeVersion?: string
  skillGaps?: SkillGap[]
  
  preparationPlan?: PreparationPlan
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: CareerMissionStatus
  progress: number (0-100)
  
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}
```

### career_tasks
```typescript
{
  id: ObjectId
  missionId: ObjectId
  
  type: TaskType
  title: string
  description?: string
  
  scheduledDate: Date
  duration?: number
  
  status: TaskStatus
  retryCount: number
  maxRetries: number
  
  result?: any
  error?: string
  
  startedAt?: Date
  completedAt?: Date
  failedAt?: Date
}
```

### career_agent_logs
```typescript
{
  id: ObjectId
  missionId: ObjectId
  userId: ObjectId
  
  timestamp: Date
  action: string
  details?: string
  
  status: 'started' | 'in_progress' | 'completed' | 'failed'
  metadata?: object
}
```

## API Endpoints

### POST /api/career/mission
Create new career mission

**Request:**
```json
{
  "company": "ABC Corp",
  "role": "React Developer",
  "jobDescription": "...",
  "interviewDate": "2026-08-30",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "mission": { ... },
  "message": "Career mission created. Agent starting..."
}
```

### GET /api/career/mission
Get all missions for user

**Response:**
```json
{
  "missions": [...]
}
```

### PATCH /api/career/mission
Update mission

**Request:**
```json
{
  "missionId": "...",
  "updates": {
    "status": "WAITING_FOR_USER"
  }
}
```

### POST /api/career/ai
AI processing endpoints

**Tasks:**
- `extract_job_profile` - Parse JD into structured data
- `generate_preparation_plan` - Create daily schedule
- `generate_questions` - Create interview questions

## Command Integration

The Career Agent is integrated into the unified command system:

### Terminal Commands
```bash
# Create mission
"I have an interview at ABC Corp in 4 days for React Developer"

# Check status
"career status"

# View tasks
"career tasks"

# Control agent
"career pause"
"career resume"
```

### Natural Language
The system detects career-related queries automatically:
- Keywords: interview, career, job application, preparation
- Routes through Common Command Engine
- Executes via Career Agent

## State Machine

Career Mission states:
```
CREATED
   ↓
ANALYZING
   ↓
PLANNING
   ↓
WAITING_FOR_PERMISSION  ←──┐
   ↓                       │
READY                      │
   ↓                       │
EXECUTING         ─────────┘
   ↓
WAITING_FOR_USER
   ↓
RESUMING
   ↓
COMPLETED
```

Task states:
```
pending
   ↓
running
   ↓ (waiting_permission)
waiting_permission
   ↓ (waiting_user)
waiting_user
   ↓ (resumed)
completed / failed / cancelled
```

## Error Handling

### Service Failures
If one service fails, Career Agent continues:
```
Calendar ✅
Notes ✅
YouTube ⚠️ retrying
Interview ✅
```

### Application Restart
```
Server restarts
   ↓
Career Orchestrator loads unfinished missions
   ↓
Resumes tasks with status: WAITING_FOR_PERMISSION, RUNNING
   ↓
Continues from last checkpoint
```

### Permission Handling
```
Permission missing
   ↓
Task status → waiting_permission
   ↓
Mission status → WAITING_FOR_PERMISSION
   ↓
Permission queued in Capability Manager
   ↓
User approves
   ↓
Task status → running
Mission status → EXECUTING
```

## User Experience

### Creating a Mission
1. User says: "I have an interview at Google in 5 days for Senior React Developer"
2. Career Agent:
   - Creates mission
   - Analyzes job (if JD provided)
   - Generates preparation plan
   - Creates calendar events
   - Creates interview notes
   - Sets up coding practice
   - Sends Telegram welcome message

### Daily Updates
Career Agent sends:
```
🚀 Career Update

Your Google interview is in 3 days.

Today's Plan:
✓ React performance optimization
✓ System design review
✓ 2 coding questions
✓ 30 min mock interview

Progress: 45% complete
```

### Progress Tracking
- Real-time status updates
- Task completion percentage
- Weak areas highlighted
- Upcoming events listed
- Activity log visible

## Integration Points

### Existing Systems Used
- ✅ `resolveUserIntent()` - Intent resolution
- ✅ `executeIntent()` - Sequence execution
- ✅ `capabilityManager` - Permission checks
- ✅ Calendar Repository - Events
- ✅ Interview Repository - Questions
- ✅ Profile Repository - User data
- ✅ Teacher Agent - Learning sessions
- ✅ Terminal/Telegram - Notifications
- ⏳ YouTube Integration - To be added
- ⏳ Notes API - To be enhanced

### New Components Created
- `lib/career/CareerAgent.ts` - Orchestrator
- `lib/career/CareerOrchestrator.ts` - State manager
- `lib/career/CareerScheduler.ts` - Background jobs
- `lib/career/adapters/*` - Service wrappers
- `modules/career/career.repository.ts` - Data access
- `modules/career/career.types.ts` - TypeScript types
- `app/api/career/*` - API routes

## Testing

### Manual Testing
```bash
# Start server
npm run dev

# In Terminal UI:
"I have an interview at Meta in 3 days"

# Check status:
"career status"

# View logs:
Check MongoDB career_agent_logs collection
```

### API Testing
```bash
# Create mission
curl -X POST http://localhost:3001/api/career/mission \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "role": "Software Engineer",
    "interviewDate": "2026-08-30"
  }'

# Get missions
curl http://localhost:3001/api/career/mission
```

## Future Enhancements

### Phase 6: Advanced Features
- YouTube playlist creation (when integration added)
- Resume improvement suggestions
- Mock interview scheduling
- GitHub project analysis
- LinkedIn integration

### Phase 7: AI Improvements
- Better JD parsing
- Skill gap analysis with code analysis
- Personalized learning paths
- Interview question ranking

### Phase 8: Autonomous Career Loop
- Automatic job matching
- Proactive skill development
- Network building suggestions
- Career path recommendations

## Key Rules

1. **Never bypass Capability Manager** - All permissions must flow through it
2. **Never duplicate execution** - Use existing services via adapters
3. **Never lose state** - Persist everything before external calls
4. **Never block on permissions** - Use WAITING_FOR_PERMISSION state
5. **Never fail entire mission** - Continue if one service fails
6. **Always use user-specific data** - Never mix users
7. **Always provide visibility** - User should see what agent is doing
8. **Always recover gracefully** - Resume unfinished work on restart

## Success Metrics

✅ User creates mission with natural language
✅ Career Agent analyzes and creates plan
✅ Calendar events automatically created
✅ Notes generated for interview prep
✅ Telegram notifications sent
✅ Progress tracking visible
✅ Permission flow respects Capability Manager
✅ Mission persists across restarts
✅ User can pause/resume/cancel
✅ Daily updates provided

---

**Career Agent: Orchestrating your career preparation, one task at a time.**

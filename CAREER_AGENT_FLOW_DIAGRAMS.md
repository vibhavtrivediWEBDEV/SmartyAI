# Career Agent MIC Button - Complete Flow Diagram

## User Interaction Flow

```mermaid
graph TD
    A[User Opens SmartyAI Desktop] --> B[Career Agent Button Visible]
    B --> C{User Action}
    
    C -->|Click MIC| D[Activate Voice Mode]
    C -->|Click Log Toggle| E[Open Log Panel]
    
    D --> F[Speak Command]
    F --> G{Command Type?}
    
    G -->|Create Mission| H[Process: I have an interview at X in Y days]
    G -->|Check Status| I[Fetch: GET /api/career/mission]
    G -->|Pause/Resume| J[Update: PATCH /api/career/mission]
    
    E --> K[Quick Actions Available]
    K --> L[📊 Check Status]
    K --> M[➕ Create Test Mission]
    
    H --> N[Extract Details]
    N --> O[POST /api/career/mission]
    I --> O
    J --> O
    M --> O
    
    O --> P[MongoDB: career_missions]
    P --> Q[Career Agent Starts]
    
    Q --> R[Monitor Progress]
    R --> S[Poll Every 2 Seconds]
    S --> T[GET /api/career/mission?missionId=...]
    T --> U[Update UI]
    U --> V[Log Panel Shows Real-Time Updates]
```

## System Architecture

```mermaid
graph LR
    subgraph "Frontend"
        A[CareerAgentButton.tsx]
        B[useVoiceAutomation Hook]
        C[Log Panel UI]
    end
    
    subgraph "API Layer"
        D[/api/career/mission]
        E[/api/career/logs]
        F[/api/career/ai]
    end
    
    subgraph "Orchestration Layer"
        G[CareerAgent]
        H[CareerOrchestrator]
        I[CareerScheduler]
    end
    
    subgraph "Adapters"
        J[Calendar]
        K[Notes]
        L[Teacher]
        M[Telegram]
        N[VS Code]
        O[YouTube]
        P[ATS]
        Q[Mail]
    end
    
    subgraph "Data Layer"
        R[(MongoDB)]
        S[career_missions]
        T[career_tasks]
        U[career_agent_logs]
        V[career_plans]
    end
    
    A --> B
    B --> D
    D --> G
    G --> H
    H --> J & K & L & M & N & O & P & Q
    J & K & L & M & N & O & P & Q --> R
    R --> S & T & U & V
    E --> U
    C --> A
```

## Real-Time Update Flow

```mermaid
sequenceDiagram
    participant User
    participant MIC Button
    participant API
    participant MongoDB
    participant CareerAgent
    participant Services
    
    User->>MIC Button: Click & Speak
    MIC Button->>MIC Button: Extract Details
    MIC Button->>API: POST /api/career/mission
    API->>MongoDB: Create Document
    MongoDB-->>API: Mission ID
    API-->>MIC Button: Mission Created
    MIC Button->>MIC Button: Add Log
    MIC Button->>CareerAgent: Start Orchestration
    
    loop Every 2 Seconds
        MIC Button->>API: GET /api/career/mission?missionId=X
        API->>MongoDB: Fetch Status
        MongoDB-->>API: Mission Status
        API-->>MIC Button: Status Update
        MIC Button->>MIC Button: Update UI + Log
    end
    
    CareerAgent->>Services: Coordinate (Calendar, Notes, etc.)
    Services->>MongoDB: Log Actions
    MongoDB-->>MIC Button: Via Logs API
    MIC Button->>User: Show All Steps
```

## MongoDB Collections Flow

```mermaid
graph TB
    A[Mission Created] --> B[career_missions]
    
    B --> C{Career Agent Processing}
    
    C --> D[Job Analysis]
    D --> E[career_agent_logs: Analyzing JD]
    
    C --> F[Plan Creation]
    F --> G[career_plans: Daily Schedule]
    G --> H[career_tasks: Individual Tasks]
    
    C --> I[Service Coordination]
    I --> J[Calendar Adapter]
    I --> K[Notes Adapter]
    I --> L[Teacher Adapter]
    I --> M[Telegram Adapter]
    
    J --> N[career_agent_logs: Calendar events created]
    K --> O[career_agent_logs: Notes generated]
    L --> P[career_agent_logs: Teaching sessions scheduled]
    M --> Q[career_agent_logs: Notifications sent]
    
    N & O & P & Q --> R[UI Fetches: GET /api/career/logs]
    R --> S[Log Panel Shows All Actions]
```

## Voice Command Processing

```mermaid
graph TD
    A[Voice Input] --> B[useVoiceAutomation Hook]
    B --> C[lastTranscript Detected]
    
    C --> D{Contains Career Keywords?}
    D -->|Yes| E[processCareerVoiceCommand]
    D -->|No| F[Ignore]
    
    E --> G{Intent Detection}
    
    G -->|interview + have/schedule| H[Create Mission Flow]
    G -->|status/progress| I[Check Status Flow]
    G -->|pause/stop| J[Pause Mission Flow]
    G -->|resume/continue| K[Resume Mission Flow]
    
    H --> L[NLP Extract: Company, Role, Days]
    L --> M[POST /api/career/mission]
    
    I --> N[GET /api/career/mission?userId=...]
    
    J --> O[PATCH /api/career/mission: status=WAITING_FOR_USER]
    
    K --> P[PATCH /api/career/mission: status=RESUMING]
    
    M & N & O & P --> Q[Update UI]
    Q --> R[Log Panel Shows Action]
```

## Log Panel States

```mermaid
stateDiagram-v2
    [*] --> Inactive
    Inactive --> Active: Click MIC
    Active --> Listening: Voice Mode On
    Listening --> Processing: Transcript Received
    Processing --> CreatingMission: Intent: Create
    Processing --> CheckingStatus: Intent: Status
    Processing --> ControllingMission: Intent: Pause/Resume
    
    CreatingMission --> MissionCreated: API Success
    MissionCreated --> Monitoring: Start Poll
    
    CheckingStatus --> StatusFetched: API Success
    StatusFetched --> DisplayingStatus: Show Details
    
    ControllingMission --> MissionUpdated: API Success
    MissionUpdated --> Monitoring: Continue Poll
    
    Monitoring --> Logging: Every 2s Update
    Logging --> Monitoring: Continue
    
    Monitoring --> Completed: Status=COMPLETED
    Completed --> [*]: Mission Finished
```

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ USER INTERACTION                                             │
│                                                               │
│  1. Click MIC Button (turns red + pulsing)                  │
│  2. Speak: "I have an interview at Google in 5 days"       │
│  3. Transcript appears in voice status                       │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ VOICE PROCESSING                                             │
│                                                               │
│  • careerKeywords.test(transcript) → Match: "interview"     │
│  • processCareerVoiceCommand(transcript)                     │
│  • NLP Extract:                                              │
│    - Company: Google                                         │
│    - Role: Developer (fallback)                              │
│    - Days: 5                                                 │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ API CALL                                                      │
│                                                               │
│  POST /api/career/mission                                    │
│  Body: {                                                     │
│    company: "Google",                                        │
│    role: "Developer",                                        │
│    interviewDate: "2026-08-31T...",                          │
│    priority: "high"                                          │
│  }                                                            │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ MONGODB                                                       │
│                                                               │
│  career_missions.insertOne({                                 │
│    userId: ObjectId("..."),                                  │
│    company: "Google",                                        │
│    role: "Developer",                                        │
│    interviewDate: ISODate("2026-08-31"),                     │
│    status: "CREATED",                                        │
│    progress: 0                                               │
│  })                                                           │
│                                                               │
│  Returns: { insertedId: ObjectId("...") }                    │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ CAREER AGENT ORCHESTRATION                                    │
│                                                               │
│  • CareerAgent.startMission() [async]                        │
│  • Phase 1: Analyze JD → jobProfile extracted                │
│  • Phase 2: Analyze Resume → skillGaps identified            │
│  • Phase 3: Create Plan → dailySchedule created              │
│  • Phase 4: Execute Services                                 │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ SERVICE COORDINATION                                          │
│                                                               │
│  → Calendar Adapter:                                          │
│     • Check calendar.write permission                         │
│     • Create preparation events                               │
│     • Log: "Calendar events created"                         │
│                                                               │
│  → Notes Adapter:                                             │
│     • Generate interview notes                                │
│     • Log: "Interview notes generated"                       │
│                                                               │
│  → Teacher Adapter:                                           │
│     • Schedule teaching sessions                              │
│     • Log: "Teaching sessions scheduled"                     │
│                                                               │
│  → Telegram Adapter:                                          │
│     • Send notification                                       │
│     • Log: "Telegram notification sent"                     │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ MONITORING (Every 2 Seconds)                                  │
│                                                               │
│  setInterval(() => {                                         │
│    GET /api/career/mission?missionId=X                       │
│    Parse: status, progress, skillGaps                        │
│    Update: activeMission state                               │
│    Update: currentStep text                                  │
│    Add: Logs to careerLogs array                             │
│    Render: UI updates                                        │
│  }, 2000)                                                     │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ UI LOG PANEL                                                  │
│                                                               │
│  [🎯 Career Agent - Live Orchestration]                      │
│                                                               │
│  ✅ Mission Created: ID: 68e3f2a1b1234...                    │
│  ℹ️ Company: Google                                          │
│  ℹ️ Role: Developer                                          │
│  ℹ️ Interview Date: 8/31/2026                                │
│                                                               │
│  🎯 Orchestrator: Starting mission orchestration...          │
│  ℹ️ Phase 1: Analyzing job description                       │
│  ℹ️ Phase 2: Creating preparation plan                       │
│  ⚠️ Permission: Awaiting user approval                       │
│  ℹ️ Progress: 25% complete                                   │
│  ℹ️ Calendar events created                                  │
│  ℹ️ Interview notes generated                                │
│  ℹ️ Teaching sessions scheduled                              │
│  ✅ Telegram notification sent                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Timeline Example

**User:** "I have an interview at Google in 5 days for Senior React Developer"

| Time | Event | Log Entry | MongoDB |
|------|-------|-----------|---------|
| 0:00 | MIC button clicked | 🟢 Voice Active | - |
| 0:02 | Transcript received | "I have an interview at Google..." | - |
| 0:03 | Processing detected | 🎯 Processing voice | - |
| 0:04 | Details extracted | Company: Google, Role: React Developer, Days: 5 | - |
| 0:05 | API call starts | POST /api/career/mission | - |
| 0:06 | MongoDB insert | ✅ Mission Created: ID: 68e3... | career_missions: 1 doc |
| 0:07 | Orchestration starts | 🎯 Starting orchestration | - |
| 0:09 | Phase 1 begins | ℹ️ Analyzing JD | career_agent_logs: 1 entry |
| 0:12 | Phase 2 begins | ℹ️ Creating plan | career_agent_logs: 2 entries |
| 0:15 | Permission check | ⚠️ Awaiting permission | career_agent_logs: 3 entries |
| 0:17 | User approves | ✅ Permission granted | career_missions.status: EXECUTING |
| 0:20 | Calendar events | ℹ️ Calendar created | career_agent_logs: 4 entries |
| 0:23 | Notes generated | ℹ️ Notes created | career_agent_logs: 5 entries |
| 0:26 | Teacher scheduled | ℹ️ Sessions scheduled | career_agent_logs: 6 entries |
| 0:29 | Telegram sent | ✅ Notification sent | career_agent_logs: 7 entries |
| 0:32 - 5:00 | Monitoring continues | Progress: 25% → 50% → 75% | career_agent_logs: updates |
| 5:00 | Complete | ✅ Mission completed | career_missions.status: COMPLETED |

---

**This is how every step of Career Agent orchestration is visible in real-time!**

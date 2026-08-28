# Career Agent - Step-by-Step Execution Implementation

## Overview

This implementation enables the Career Agent to execute a real, production-ready workflow with database-backed step-by-step progress tracking. When a user creates a career mission through voice or manual input, the system automatically:

1. **Creates a mission** in MongoDB
2. **Executes a 5-step career plan** with real operations
3. **Tracks progress** in real-time with visual feedback
4. **Creates personalized content** (notes, calendar events, learning resources)

---

## Architecture

### 1. Database Schema

#### `career_missions` Collection
```typescript
{
  _id: ObjectId,
  userId: string,
  company: string,
  role: string,
  jobDescription?: string,
  interviewDate: Date,
  status: 'CREATED' | 'EXECUTING' | 'ACTIVE' | 'COMPLETED',
  progress: 0-100,
  hasPlan: boolean,
  planId?: ObjectId,
  createdAt: Date
}
```

#### `career_plans` Collection
```typescript
{
  _id: ObjectId,
  missionId: ObjectId,
  userId: string,
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled',
  overallProgress: 0-100,
  steps: PlanStep[],
  generatedNotes?: {...},
  calendarEvents?: {...},
  learningResources?: {...},
  createdAt: Date,
  updatedAt: Date
}
```

#### PlanStep
```typescript
{
  id: string,
  order: number,
  stepType: 'analyze_profile' | 'generate_notes' | 'schedule_sessions' | 'setup_learning' | 'mock_interview',
  name: string,
  description: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  progress: 0-100,
  output?: any,
  error?: string,
  startedAt?: Date,
  completedAt?: Date
}
```

### 2. API Endpoints

#### `/api/career/mission` (Existing)
- `POST`: Create new career mission
- `GET`: Fetch active missions
- `PATCH`: Update mission (e.g., interview date)

#### `/api/career/plan` (NEW)
- `GET`: Fetch plan by missionId
- `POST`: Create new plan with initial steps
- `PATCH`: Update step progress

#### `/api/career/execute` (NEW)
- `POST`: Execute career plan steps sequentially
- `GET`: Get execution progress

### 3. Core Components

#### `CareerPlanExecutor` (`/lib/career/executor.ts`)
Main execution engine that runs each step:

1. **analyze_profile**: Fetch user resume, skills, experience
   - Output: User profile analysis

2. **generate_notes**: AI-generated interview notes based on job description
   - Creates note in MongoDB
   - Output: Comprehensive interview preparation notes

3. **schedule_sessions**: Create calendar events for prep sessions
   - Creates events in `calendar_events` collection
   - Output: Prep session dates

4. **setup_learning**: Setup personalized learning resources
   - Creates learning session in MongoDB
   - Output: Topics, courses, practice problems

5. **mock_interview**: Configure mock interview parameters
   - Creates interview session in MongoDB
   - Output: Interview session ID

#### `CareerProgressCard` (`/components/Desktop/CareerProgressCard.tsx`)
Real-time progress visualization:
- Shows all 5 steps with status
- Auto-refreshes every 5 seconds
- Displays generated content previews
- Shows overall progress percentage

---

## Implementation Flow

### Voice Agent Flow (`CareerAgentSimple.tsx`)

```typescript
// 1. User speaks → AI extracts mission data
// 2. Mission created via API
await createCareerMissionWithData(data);

// 3. Automatically trigger execution
await executeCareerPlan(missionId);

// 4. Progress card shows real-time updates
```

### Manual Flow (`CareerApp.tsx`)

```typescript
// 1. User fills form
// 2. Submit creates mission
const result = await fetch('/api/career/mission', { method: 'POST', ... });

// 3. Execute career plan
const executionResult = await fetch('/api/career/execute', {
  method: 'POST',
  body: JSON.stringify({ missionId: result.mission.id })
});

// 4. Show progress card with real status
<CareerProgressCard missionId={missionId} />
```

---

## Data Flow

```
User Input (Voice/Form)
    ↓
Career Mission Created
    ↓
Career Plan Created (5 steps)
    ↓
Step 1: Analyze Profile
    ├─ Fetch user data from DB
    ├─ Save to plan.userProfile
    └─ Mark step as completed
    ↓
Step 2: Generate Notes
    ├─ AI generates interview notes
    ├─ Save to plan.generatedNotes
    ├─ Create note in notes collection
    └─ Mark step as completed
    ↓
Step 3: Schedule Sessions
    ├─ Calculate prep session dates
    ├─ Save to plan.calendarEvents
    ├─ Create events in calendar_events collection
    └─ Mark step as completed
    ↓
Step 4: Setup Learning
    ├─ Create learning resources
    ├─ Save to plan.learningResources
    ├─ Create session in learning_sessions collection
    └─ Mark step as completed
    ↓
Step 5: Mock Interview
    ├─ Configure interview session
    ├─ Create session in interview_sessions collection
    └─ Mark step as completed
    ↓
Mission Progress: 100%
Overall Status: Completed
```

---

## Real-time Progress Tracking

### Client-Side (CareerProgressCard)
```typescript
useEffect(() => {
  const loadPlan = async () => {
    const data = await fetch(`/api/career/execute/progress?missionId=${missionId}`);
    setPlan(data.plan);
  };
  
  loadPlan();
  const interval = setInterval(loadPlan, 5000); // Refresh every 5 seconds
  return () => clearInterval(interval);
}, [missionId]);
```

### Server-Side Updates
```typescript
// Each step updates plan in DB
await db.collection('career_plans').updateOne(
  { _id: planId },
  {
    $set: {
      steps: updatedSteps,
      overallProgress,
      status: 'in_progress',
      updatedAt: new Date()
    }
  }
);

// Also updates mission progress
await db.collection('career_missions').updateOne(
  { _id: missionId },
  { $set: { progress: overallProgress } }
);
```

---

## Preventing Duplicates

### Backend
```typescript
// Mission API checks for overlapping missions
const existingMission = await db.collection('career_missions').findOne({
  userId,
  status: { $in: ['CREATED', 'EXECUTING', 'ACTIVE'] },
  interviewDate: {
    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
});

if (existingMission) {
  return NextResponse.json({
    error: 'Please complete your current career mission first',
    activeMission: existingMission
  });
}
```

### Frontend
```typescript
const [missionCreated, setMissionCreated] = useState(false);

// Set flag BEFORE API call to prevent race condition
if (result.shouldCreateMission && !missionCreated) {
  setMissionCreated(true);
  await createCareerMissionWithData(result.nextState.missionData);
}
```

---

## Generated Content Examples

### Interview Notes
```markdown
# Interview Prep: Google - Senior Software Engineer

## Company: Google
## Role: Senior Software Engineer
## Interview: January 20, 2025

### Company Research
- Founded: [AI research]
- Products: [AI analysis]
- Culture: [AI determination]

### Technical Preparation
- React & Next.js (Focus Area)
- System Design (Weakness)
- Algorithms & Data Structures

### Practice Schedule
- Day 1: Technical deep dive
- Day 2: System design practice
- Day 3: Mock interview
- Day 4: Final review

---
Generated by Career Agent AI on January 15, 2025
```

### Calendar Events
- **Prep Session 1**: Technical Review (Tomorrow, 2 hours)
- **Prep Session 2**: System Design (Day after, 2 hours)
- **Mock Interview**: Practice interview (2 days before interview)
- **Interview Day**: Final review (2 hours before interview)

### Learning Resources
- **Topics**: React Hooks, System Design, Algorithms, Behavioral
- **Courses**: React Advanced Patterns, System Design Masterclass
- **Practice Problems**: Two Sum, Design URL Shortener, Build Chat System

---

## MongoDB Collections Created

By end of execution:
1. ✅ `career_missions` - 1 document (mission)
2. ✅ `career_plans` - 1 document (plan with 5 steps)
3. ✅ `notes` - 1 document (interview notes)
4. ✅ `calendar_events` - 3 documents (prep sessions)
5. ✅ `learning_sessions` - 1 document (learning setup)
6. ✅ `interview_sessions` - 1 document (mock interview)

---

## Testing

### Automated Test
```bash
chmod +x test-career-plan-execution.sh
./test-career-plan-execution.sh
```

This will:
1. Create a test mission
2. Execute the career plan
3. Fetch and display progress
4. Show generated content

### Manual Test
1. Open Career Agent app
2. Create mission via voice or form
3. Watch progress card update in real-time
4. Check MongoDB for generated data

---

## Success Metrics

✅ **Mission Creation**: Single mission created, no duplicates  
✅ **Plan Execution**: 5 steps executed sequentially  
✅ **Progress Tracking**: Real-time updates shown in UI  
✅ **Notes Generated**: Comprehensive interview preparation notes created  
✅ **Calendar Scheduled**: Prep sessions scheduled before interview  
✅ **Learning Setup**: Personalized resources based on weaknesses  
✅ **Mock Interview**: Session configured and ready  

---

## Future Enhancements

1. **AI-Powered Analysis**: Use GenAI to analyze user's GitHub repos and projects
2. **Calendar Integration**: Actually open Calendar app with events
3. **Notes Integration**: Automatically open Notes app with generated content
4. **Teacher Integration**: Launch Teacher app with personalized curriculum
5. **Interview Practice**: Real-time mock interview with voice AI
6. **Progress Notifications**: Push notifications when steps complete
7. **Retry Failed Steps**: Ability to re-run failed steps

---

## Monitoring & Debugging

### Check Mission Status
```bash
mongosh
use smarty-ai
db.career_missions.find().pretty()
db.career_plans.find().pretty()
```

### Check Generated Content
```bash
db.notes.find({ category: 'career' }).pretty()
db.calendar_events.find({ userId: '...' }).pretty()
db.learning_sessions.find().pretty()
db.interview_sessions.find().pretty()
```

### Monitor Execution
- Open Browser DevTools → Network tab
- Watch API calls to `/api/career/execute`
- Check server logs for step execution messages
- Verify progress updates in real-time

---

## Conclusion

This implementation provides a complete, production-ready career preparation workflow with:

- ✅ Real database operations (not just UI state)
- ✅ Step-by-step execution with progress tracking
- ✅ Automatic content generation (notes, calendar, learning)
- ✅ Real-time progress visualization
- ✅ Duplicate prevention mechanisms
- ✅ Comprehensive error handling

The Career Agent now creates actual value for users by automatically setting up their entire interview preparation workflow, not just collecting information.

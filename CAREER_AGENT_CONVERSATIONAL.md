# Career Agent - Conversational AI System

## 🎯 Overview

The Career Agent is now a **conversational AI assistant** that interacts with users through voice to gather all necessary information before creating a career mission. It doesn't just pattern match - it **understands, asks questions, and guides users through the entire process**.

---

## 🔄 How It Works

### 1. Voice Activation
- User clicks the **CAREER MIC button** (100×100px, green, bottom-right)
- Button turns red and shows "LISTENING" when active
- User speaks naturally about career goals

### 2. Conversational Flow

```
User: "I have an interview"
Agent: "Hi! What company are you interviewing with?"
User: "Google"
Agent: "Great! What role is this for?"
User: "Senior Software Engineer"
Agent: "Excellent! Do you have the job description? You can paste it or just tell me about it."
User: "It's for a full-stack role focusing on React and Node.js"
Agent: "Perfect! When is your interview scheduled?"
User: "Next Friday"
Agent: "Got it! So that's Google, Senior Software Engineer, full-stack role with React and Node.js, interview on [date]. Should I create your career mission now?"
User: "Yes"
Agent: "🎉 Creating your mission..."
```

### 3. Information Gathered

The agent **dynamically asks for**:
- ✅ **Company name** (required)
- ✅ **Role/Job Title** (required)
- ✅ **Job Description** (optional, but recommended)
- ✅ **Interview Date** (required)
- ✅ **Priority Level** (defaults to medium)

### 4. AI-Powered Understanding

- Uses `/api/career/ai` with task `conversation`
- Processes user input with existing AI service
- Extracts information from natural speech
- Maintains conversation state
- Knows when all required data is collected

---

## 🧠 Architecture

### Frontend: `CareerAgentSimple.tsx`

```typescript
// Conversation State
interface ConversationState {
  stage: 'idle' | 'gathering' | 'confirming' | 'creating' | 'complete';
  missionData: CareerMissionData;
  currentQuestion?: string;
  awaitingInput: string | null;
}

// Key Features:
- processWithAI() - Sends user input to AI endpoint
- initiateCareerConversation() - Starts dialogue
- handleConversationInput() - Processes responses
- createCareerMissionWithData() - Creates mission when ready
```

### Backend: `/api/career/ai/route.ts`

```typescript
// handleConversation function:
- Receives user input and current state
- Uses AI to extract information
- Generates conversational response
- Updates mission data
- Returns next question or confirmation
- Signals when mission should be created
```

### Data Flow

```
Voice Input → useVoiceAutomation
    ↓
CareerAgentSimple (conversation state)
    ↓
POST /api/career/ai {task: 'conversation'}
    ↓
AI Service processes input
    ↓
Returns: {response, nextState, shouldCreateMission}
    ↓
If shouldCreateMission = true
    ↓
POST /api/career/mission
    ↓
MongoDB: career_missions collection
    ↓
Career Agent orchestration starts
    ↓
Calendar, Notes, Interview prep, etc.
```

---

## ✨ Key Improvements

### ❌ Before:
- Pattern matched keywords
- Assumed "Unknown Company"
- Didn't ask questions
- Created incomplete missions

### ✅ After:
- **Conversational AI** that understands natural speech
- **Asks clarifying questions** one at a time
- **Extracts information** from what user says
- **Confirms details** before creating mission
- **Uses existing user context** (skills, experience)
- **Guides user** through entire process

---

## 🎨 Visual Features

1. **MIC Button** (100×100px)
   - Green when idle
   - Red when listening
   - Pulsing animation when active
   - Shows "LISTENING" badge
   - Shows conversation stage indicator

2. **AI Response Bubble**
   - Blue gradient background
   - Shows agent's current response
   - Positioned above MIC button
   - Updates in real-time

3. **Log Panel**
   - Toggle with 📋 button
   - Shows all conversation steps
   - Color-coded success/error
   - Scrolls automatically

---

## 🔧 Technical Details

### Authentication
- Uses `getSessionUserId()` from `/lib/auth/session`
- MongoDB session-based auth (NOT Clerk)
- Works with existing login system

### MongoDB Collections
- `career_missions` - Stores mission data
- `career_tasks` - Preparation tasks
- `career_plans` - Daily schedules
- `career_agent_logs` - Orchestration logs

### AI Integration
- Uses existing AI service (`getAIService()`)
- Prompt engineering for conversation
- JSON response parsing with fallbacks
- Context-aware responses

---

## 🧪 Testing

1. **Login to the app** (to get session cookie)
2. **Navigate to desktop** at http://localhost:3001/desktop
3. **Click CAREER MIC button** (bottom-right, green)
4. **Say**: "I have an interview"
5. **Follow the conversation** - agent will ask questions
6. **Provide details**: company, role, date, etc.
7. **Confirm** when asked
8. **Watch logs** show mission creation and orchestration

---

## 📊 Example Conversation States

### State: 'gathering'
Agent is actively collecting information:
- Asks for company
- Asks for role
- Asks for job description
- Asks for interview date

### State: 'confirming'
Agent summarizes collected data:
- Shows all details
- Asks for confirmation
- User can say "yes" or correct details

### State: 'creating'
Mission is being created:
- Saves to MongoDB
- Starts AI orchestration
- Schedules tasks

### State: 'complete'
Mission created successfully:
- Shows success message
- Advises user to check calendar/notes
- Ready for new conversation

---

## 🚀 Future Enhancements

1. **Edit existing missions** via voice
2. **Check status** of current preparations
3. **Cancel or reschedule** interviews
4. **Get recommendations** for study materials
5. **Practice mock interviews** with AI
6. **Track progress** and completion rates

---

## 🎯 Goal Alignment

✅ **Ask for company** - Done
✅ **Ask for role** - Done
✅ **Ask for job description** - Done
✅ **Ask for interview date** - Done
✅ **Maintain in MongoDB** - Done
✅ **Conversational AI** - Done
✅ **Voice-activated** - Done
✅ **Interactive dialogue** - Done

---

## 📝 Summary

The Career Agent is now a **true AI assistant** that:
1. ✅ Understands natural speech
2. ✅ Asks intelligent questions
3. ✅ Extracts information dynamically
4. ✅ Confirms before action
5. ✅ Creates complete missions in MongoDB
6. ✅ Orchestrates career preparation
7. ✅ Works with existing authentication and services

**It doesn't just execute commands - it thinks, asks, and guides users through the entire process.** 🎯

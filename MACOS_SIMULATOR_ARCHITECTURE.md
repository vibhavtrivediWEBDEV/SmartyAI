# SmartyAI + MacOS-Web-Simulator Architecture

## System Overview

```mermaid
graph TB
    subgraph "User Interface Layer"
        LS[Lock Screen<br/>Apple Animation]
        DT[Desktop Environment]
        TB[Top Bar<br/>+ Add Widget]
        DK[Dock]
        APPS[Apps:<br/>Phone, Contacts, FaceTime,<br/>Calendar, Music, etc.]
        WIDGETS[Widgets:<br/>Calendar, Weather, Clock,<br/>GitHub, AI, etc.]
    end

    subgraph "AI Processing Layer"
        AI[AI Services<br/>Resume Extraction]
        CONTACT_AI[Contact Extraction]
        SMART_AI[Smart Features]
    end

    subgraph "Data Persistence Layer"
        MONGO[(MongoDB)]
        API[Next.js API Routes]
    end

    subgraph "External Integrations"
        GITHUB[GitHub API]
        LINKEDIN[LinkedIn API]
        SPOTIFY[Spotify API]
        WEBRTC[WebRTC]
    end

    subgraph "User Onboarding Flow"
        UPLOAD[Resume Upload]
        EXTRACT[AI Extraction]
        PROFILE[Profile Creation]
        SETUP[App Setup]
    end

    %% Flows
    UPLOAD --> EXTRACT
    EXTRACT --> PROFILE
    PROFILE --> SETUP
    SETUP --> LS
    
    LS --> DT
    DT --> TB
    DT --> DK
    DT --> APPS
    DT --> WIDGETS
    
    TB -->|Add Widget| WIDGETS
    
    APPS --> API
    WIDGETS --> API
    
    API --> MONGO
    
    AI --> CONTACT_AI
    CONTACT_AI --> MONGO
    
    CONTACT_AI -.->|Import| GITHUB
    CONTACT_AI -.->|Import| LINKEDIN
    
    APPS -.->|Music| SPOTIFY
    APPS -.->|Calls| WEBRTC
    
    SMART_AI -->|Context| APPS
```

## Component Architecture

### 1. Lock Screen Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LS as Lock Screen
    participant AI as AI Service
    participant DB as MongoDB
    participant DT as Desktop

    Note over U,DT: First Time User
    U->>LS: Upload Resume
    LS->>AI: Extract Profile
    AI->>DB: Save User Data
    AI-->>LS: Profile Photo, Name
    LS->>U: Show Profile, Request Password
    U->>LS: Set Password
    LS->>DB: Save Password (Hashed)
    LS->>U: Show Lock Screen
    U->>LS: Enter Password
    LS->>LS: Verify Password
    LS->>LS: Play Apple Animation
    LS->>DT: Unlock Desktop

    Note over U,DT: Returning User
    U->>LS: Arrive at Site
    LS->>DB: Fetch User Profile
    DB-->>LS: Profile Photo, Name
    LS->>U: Show Lock Screen
    U->>LS: Enter Password
    LS->>LS: Verify & Animate
    LS->>DT: Unlock
```

### 2. Contacts App Flow

```mermaid
graph LR
    subgraph "Data Sources"
        RESUME[Resume PDF]
        GITHUB[GitHub Profile]
        LINKEDIN[LinkedIn Profile]
        MANUAL[User Input]
    end

    subgraph "AI Processing"
        EXTRACT[Ai Extraction]
        DEDUP[Deduplication]
        ENRICH[Data Enrichment]
    end

    subgraph "Storage"
        MONGO[(MongoDB<br/>User Contacts)]
    end

    subgraph "Display"
        APP[Contacts App]
        PHONE[Phone App]
        FACETIME[FaceTime App]
    end

    RESUME --> EXTRACT
    GITHUB --> EXTRACT
    LINKEDIN --> EXTRACT
    MANUAL --> MONGO

    EXTRACT --> DEDUP
    DEDUP --> ENRICH
    ENRICH --> MONGO

    MONGO --> APP
    MONGO --> PHONE
    MONGO --> FACETIME
```

### 3. Widget System Architecture

```mermaid
graph TB
    subgraph "Widget Gallery"
        WG[Widget Gallery UI]
        ADD[Add Widget Button]
        CUSTOMIZE[Customize Widget]
    end

    subgraph "Available Widgets"
        WC[Calendar Widget]
        WW[Weather Widget]
        WCL[Clock Widget]
        WR[Reminders Widget]
        WGIT[GitHub Widget]
        WAI[AI Chat Widget]
        WPHOTO[Photo Widget]
    end

    subgraph "Widget Engine"
        ENGINE[Widget Engine]
        LAYOUT[Layout Manager]
        STORE[Widget Store]
        RENDER[Widget Renderer]
    end

    subgraph "Data Sources"
        CALENDAR[(User Calendar)]
        WEATHER[(Weather API)]
        TASKS[(User Tasks)]
        GITHUB_API[(GitHub API)]
        AI_API[(AI Service)]
    end

    ADD --> WG
    WG --> ENGINE
    CUSTOMIZE --> ENGINE

    ENGINE --> WC
    ENGINE --> WW
    ENGINE --> WCL
    ENGINE --> WR
    ENGINE --> WGIT
    ENGINE --> WAI
    ENGINE --> WPHOTO

    WC --> CALENDAR
    WW --> WEATHER
    WR --> TASKS
    WGIT --> GITHUB_API
    WAI --> AI_API

    ENGINE --> LAYOUT
    LAYOUT --> STORE
    STORE --> RENDER
    RENDER -->|Drag & Drop| DT[Desktop]
```

### 4. Music App Integration

```mermaid
sequenceDiagram
    participant U as User
    participant MA as Music App
    participant API as Next.js API
    participant DB as MongoDB
    participant SP as Spotify API

    U->>MA: Open Music App
    MA->>API: Get User Playlists
    API->>DB: Query User Music Data
    DB-->>API: User Playlists
    API-->>MA: Display Playlists

    Note over U,SP: Spotify Connected
    U->>MA: Click Connect Spotify
    MA->>SP: OAuth Redirect
    SP->>MA: Access Token
    MA->>API: Save Spotify Token
    API->>DB: Store Token

    SPA->>API: Fetch User Library
    API->>SP: Get Playlists
    SP-->>API: Playlist Data
    API->>DB: Cache Playlists
    API-->>MA: User's Spotify Playlists

    U->>MA: Play Track
    MA->>SP: Play via Spotify SDK
    SP-->>MA: Audio Stream
    MA->>API: Track Play Event
    API->>DB: Update Recently Played
```

### 5. Phone & FaceTime Architecture

```mermaid
graph TB
    subgraph "Phone App"
        DIALPAD[Dialer Pad]
        RECENT[Recent Calls]
        FAVS[Favorites]
        CONTACTS[Contact List]
    end

    subgraph "FaceTime App"
        VIDEO[Video Call UI]
        AUDIO[Audio Call UI]
        HISTORY[Call History]
        FAV_FACETIME[Favorites]
    end

    subgraph "WebRTC Layer"
        PEER[Peer Connection]
        STREAM[Media Stream]
        SIGNAL[Signaling Server]
        STUN[STUN/TURN Servers]
    end

    subgraph "Call Data"
        MONGO_CALLS[(MongoDB<br/>Call History)]
        MONGO_CONTACTS[(MongoDB<br/>Contacts)]
    end

    DIALPAD --> PEER
    VIDEO --> PEER
    AUDIO --> PEER

    PEER --> STREAM
    PEER --> SIGNAL
    SIGNAL --> STUN

    RECENT --> MONGO_CALLS
    HISTORY --> MONGO_CALLS
    CONTACTS --> MONGO_CONTACTS
    FAVS --> MONGO_CONTACTS
    FAV_FACETIME --> MONGO_CONTACTS

    MONGO_CONTACTS --> CONTACTS
    MONGO_CONTACTS --> DIALPAD
```

## Data Flow Architecture

### User-Specific Data Isolation

```mermaid
graph TB
    subgraph "Authentication"
        AUTH[NextAuth.js]
        SESSION[User Session]
    end

    subgraph "API Layer - User Context"
        MIDDLEWARE[Middleware<br/>User ID Injection]
        API_ROUTES[API Routes]
    end

    subgraph "Database Queries"
        USER_FILTER[User ID Filter]
        MONGO_OPS[MongoDB Operations]
    end

    subgraph "MongoDB Collections"
        USER_LOCK[UserLockScreen]
        USER_CONTACTS[UserContacts]
        USER_CALENDAR[UserCalendar]
        USER_MUSIC[UserMusic]
        USER_PHONE[UserPhone]
        USER_FACETIME[UserFaceTime]
        USER_WIDGETS[UserWidgets]
    end

    AUTH --> SESSION
    SESSION --> MIDDLEWARE
    MIDDLEWARE --> API_ROUTES
    
    API_ROUTES --> USER_FILTER
    USER_FILTER --> MONGO_OPS
    
    MONGO_OPS --> USER_LOCK
    MONGO_OPS --> USER_CONTACTS
    MONGO_OPS --> USER_CALENDAR
    MONGO_OPS --> USER_MUSIC
    MONGO_OPS --> USER_PHONE
    MONGO_OPS --> USER_FACETIME
    MONGO_OPS --> USER_WIDGETS

    style USER_FILTER fill:#f9f,stroke:#333,stroke-width:4px
    style MONGO_OPS fill:#bbf,stroke:#333,stroke-width:2px
```

## Tech Stack Comparison

| Feature | MacOS-Web-Simulator | SmartyAI |
|---------|-------------------|----------|
| **Framework** | React + Vite | Next.js + React |
| **State** | Zustand (localStorage) | React Query + MongoDB |
| **Auth** | None (demo) | NextAuth.js |
| **Database** | localStorage | MongoDB |
| **AI** | None | OpenAI/Anthropic/GLM |
| **Integrations** | Spotify only | GitHub, LinkedIn, Spotify, etc. |
| **User Context** | Single user | Multi-user (SaaS) |
| **Deployment** | Static | Vercel + MongoDB Atlas |

## Component Reuse Strategy

### Step-by-Step Process

1. **Analyze Source Component**
   ```bash
   # Read component from MacOS-Web-Simulator
   cat /tmp/macos-simulator/src/app/Phone.jsx
   ```

2. **Extract UI Structure**
   - Keep JSX structure
   - Keep Tailwind classes
   - Keep styling logic
   - Keep component hierarchy

3. **Remove Static Data**
   ```tsx
   // BAD (from MacOS-Web-Simulator)
   const defaultContacts = [
     { id: "antonio", firstName: "Antonio", ... }
   ];

   // GOOD (SmartyAI)
   const { user } = useUser();
   const [contacts, setContacts] = useState([]);

   useEffect(() => {
     fetch(`/api/contacts/get?userId=${user.id}`)
       .then(res => res.json())
       .then(setContacts);
   }, [user]);
   ```

4. **Add User Context**
   ```tsx
   // Wrap component with user authentication
   import { useUser } from '@/lib/hooks/useUser';

   export default function PhoneApp({ windowId }) {
     const { user } = useUser();

     if (!user) {
       return <LoginPrompt />;
     }

     // Component logic
   }
   ```

5. **Implement API Endpoints**
   ```typescript
   // pages/api/phone/[action].ts
   export default async function handler(req, res) {
     const session = await getServerSession(req, res, authOptions);
     const userId = session.user.id;

     // All data operations scoped to userId
   }
   ```

6. **Connect to MongoDB**
   ```typescript
   // lib/db/models/user-phone.ts
   const UserPhoneSchema = new Schema({
     userId: { type: String, required: true, unique: true },
     // ... fields
   });
   ```

## Implementation Priority

### Critical Path (Must Have)
1. 🔒 **Lock Screen** - Onboarding entry point
2. 👥 **Contacts App** - Core user data from resume
3. 🗓️ **Calendar Enhancement** - Already exists, add MongoDB
4. ⬆️ **Widget System** - Desktop enhancement

### High Priority (Should Have)
5. 📞 **Phone App** - UI component, call history
6. 📹 **FaceTime App** - UI component, call history
7. 🎵 **Music App** - Spotify integration

### Nice to Have
8. 📸 **Photo Widget** - User photos
9. 🌤️ **Weather Widget** - Location-based
10. 📝 **Reminders App** - Task management

## File Structure

```
SmartyAI/
├── src/
│   ├── app/
│   │   ├── desktop/
│   │   │   ├── apps/
│   │   │   │   ├── PhoneApp.tsx         [NEW]
│   │   │   │   ├── ContactsApp.tsx      [NEW]
│   │   │   │   ├── FaceTimeApp.tsx      [NEW]
│   │   │   │   ├── CalendarApp.tsx      [ENHANCE]
│   │   │   │   ├── MusicApp.tsx         [NEW]
│   │   │   │   └── ...
│   │   │   ├── components/
│   │   │   │   ├── LockScreen.tsx       [NEW]
│   │   │   │   ├── TopBar.tsx           [UPDATE - Add Widget Button]
│   │   │   │   ├── WidgetGallery.tsx    [NEW]
│   │   │   │   └── ...
│   │   │   └── widgets/
│   │   │       ├── CalendarWidget.tsx   [NEW]
│   │   │       ├── WeatherWidget.tsx    [NEW]
│   │   │       ├── ClockWidget.tsx      [NEW]
│   │   │       ├── RemindersWidget.tsx  [NEW]
│   │   │       ├── GitHubWidget.tsx     [NEW]
│   │   │       ├── AIWidget.tsx         [NEW]
│   │   │       └── PhotoWidget.tsx      [NEW]
│   │   └── ...
│   └── lib/
│       ├── db/
│       │   └── models/
│       │       ├── user-lockscreen.ts   [NEW]
│       │       ├── user-contacts.ts     [NEW]
│       │       ├── user-phone.ts        [NEW]
│       │       ├── user-facetime.ts     [NEW]
│       │       ├── user-music.ts        [NEW]
│       │       ├── user-widgets.ts      [NEW]
│       │       └── user-calendar.ts     [UPDATE]
│       ├── ai/
│       │   ├── contact-extractor.ts     [NEW]
│       │   └── resume-extractor.ts      [UPDATE]
│       └── integrations/
│           ├── spotify.ts               [NEW]
│           └── webrtc/
│               ├── calling.ts           [NEW]
│               └── signaling.ts         [NEW]
├── pages/
│   └── api/
│       ├── auth/
│       │   └── unlock.ts               [NEW]
│       ├── contacts/
│       │   └── [action].ts             [NEW]
│       ├── phone/
│       │   └── [action].ts             [NEW]
│       ├── facetime/
│       │   └── [action].ts             [NEW]
│       ├── music/
│       │   └── [action].ts             [NEW]
│       ├── widgets/
│       │   └── [action].ts             [NEW]
│       └── calendar/
│           └── [action].ts             [UPDATE]
└── MACOS_SIMULATOR_INTEGRATION_PLAN.md [THIS FILE]
```

---

## Conclusion

This architecture ensures:
- ✅ User-specific data isolation
- ✅ Scalable MongoDB storage
- ✅ AI-powered features
- ✅ Reusable UI components from MacOS-Web-Simulator
- ✅ Modern authentication with NextAuth.js
- ✅ Real-time features with WebRTC
- ✅ Multi-platform integrations

**Next Step:** Start implementation with Lock Screen Component (critical for onboarding flow).

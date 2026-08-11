# MacOS-Web-Simulator Integration Plan for SmartyAI

## Executive Summary

We're integrating UI components and features from the [MacOS-Web-Simulator](https://github.com/LikhithSP/MacOS-Web-Simulator) repository into SmartyAI's desktop environment. The integration focuses on user-specific features, MongoDB-backed data storage, and maintaining SmartyAI's unique AI-powered portfolio experience.

---

## Key Features to Integrate

### 1. 🎵 Music App (Spotify Integration)
**Source File:** `/tmp/macos-simulator/src/app/Spotify.jsx`

**SmartyAI Implementation:**
- **User-Specific Data:** Playlists stored in MongoDB per user
- **Features:**
  - Spotify web player integration
  - User playlists from MongoDB
  - Album art display
  - Play/pause/skip controls
  - Volume control
  - Shuffle/repeat modes

**MongoDB Schema:**
```typescript
interface UserMusic {
  userId: string;
  spotifyConnected: boolean;
  playlists: {
    id: string;
    name: string;
    trackCount: number;
    coverImage: string;
    spotifyUrl: string;
  }[];
  recentlyPlayed: {
    trackId: string;
    trackName: string;
    artist: string;
    albumArt: string;
    playedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Files to Create:**
- `src/app/desktop/apps/MusicApp.tsx` - Main music app component
- `lib/db/models/user-music.ts` - MongoDB model
- `lib/integrations/spotify.ts` - Spotify API integration
- `pages/api/music/playlist.ts` - API endpoints

---

### 2. 📞 Phone App
**Source File:** `/tmp/macos-simulator/src/app/Phone.jsx`

**SmartyAI Implementation:**
- **User-Specific Data:** Contacts fetched from user's resume/GitHub/LinkedIn
- **Features:**
  - Dialer pad
  - Recent calls (stored in MongoDB)
  - Favorites
  - Voicemail display
  - Contact search
  - Call history

**MongoDB Schema:**
```typescript
interface UserPhone {
  userId: string;
  contacts: {
    id: string;
    name: string;
    phone?: string;
    email: string;
    avatar?: string;
    company?: string;
    role?: string;
    source: 'resume' | 'linkedin' | 'manual';
  }[];
  recentCalls: {
    contactId: string;
    type: 'incoming' | 'outgoing' | 'missed';
    duration: number;
    timestamp: Date;
  }[];
  voicemails: {
    id: string;
    contactId: string;
    duration: number;
    transcript: string;
    audioUrl?: string;
    timestamp: Date;
  }[];
}
```

**Files to Create:**
- `src/app/desktop/apps/PhoneApp.tsx` - Main phone app
- `lib/db/models/user-phone.ts` - MongoDB model
- `pages/api/phone/[action].ts` - API endpoints

---

### 3. 👥 Contacts App
**Source File:** `/tmp/macos-simulator/src/app/Contacts.jsx`

**SmartyAI Implementation:**
- **User-Specific Data:** Auto-populated from resume extraction AI
- **Features:**
  - Contact list with search
  - Contact details (phone, email, social links)
  - Avatar generation
  - Import from LinkedIn/GitHub
  - Manual add/edit/delete
  - Export contacts

**MongoDB Schema:**
```typescript
interface UserContacts {
  userId: string;
  contacts: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    role?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
    notes?: string;
    avatar?: string;
    source: 'resume' | 'linkedin' | 'github' | 'manual';
    tags: string[];
    isFavorite: boolean;
    lastContacted?: Date;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
```

**Files to Create:**
- `src/app/desktop/apps/ContactsApp.tsx` - Contacts UI
- `lib/db/models/user-contacts.ts` - MongoDB model
- `lib/ai/contact-extractor.ts` - AI contact extraction from resume
- `pages/api/contacts/[action].ts` - API endpoints

---

### 4. 📹 FaceTime App
**Source File:** `/tmp/macos-simulator/src/app/FaceTime.jsx`

**SmartyAI Implementation:**
- **User-Specific Data:** Recent calls stored in MongoDB
- **Features:**
  - Video call interface (WebRTC)
  - Audio call interface
  - Recent calls
  - Favorites (frequent contacts)
  - Call history
  - Screen sharing (premium feature)

**MongoDB Schema:**
```typescript
interface UserFaceTime {
  userId: string;
  recentCalls: {
    callId: string;
    contactId: string;
    type: 'video' | 'audio';
    duration: number;
    timestamp: Date;
    quality: 'hd' | 'sd';
  }[];
  favorites: string[]; // Contact IDs
}
```

**Files to Create:**
- `src/app/desktop/apps/FaceTimeApp.tsx` - FaceTime UI
- `lib/db/models/user-facetime.ts` - MongoDB model
- `lib/webrtc/calling.ts` - WebRTC integration
- `pages/api/facetime/[action].ts` - API endpoints

---

### 5. 🔒 Lock Screen with Apple Animation
**Source File:** `/tmp/macos-simulator/src/layouts/LockScreen.jsx`

**SmartyAI Implementation:**
- **User-Specific Data:** Profile photo and name from resume extraction
- **Features:**
  - Apple-style lock animation
  - User profile photo (from resume)
  - Password/PIN unlock
  - Blur effect unlock transition
  - Desktop wallpaper background
  - Clock display
  - "Click to unlock" animation
  - Optional: Fingerprint/FaceID simulation (WebAuthn)

**Onboarding Flow:**
```
1. User signs up → sees lock screen
2. Default profile photo from first letter of name (like iOS)
3. User clicks avatar → Upload photo or use AI-generated
4. AI extracts profile from resume → auto-fills name
5. User sets password/PIN
6. Lock screen appears on every visit
7. Unlock animation plays → Desktop appears
```

**MongoDB Schema:**
```typescript
interface UserLockScreen {
  userId: string;
  profilePhoto: string;
  displayName: string;
  password?: string; // Hashed
  pin?: string; // Hashed
  wallpaper: string;
  blurIntensity: number;
  showClock: boolean;
  clockFormat: '12h' | '24h';
  webauthnEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Files to Create:**
- `src/app/desktop/components/LockScreen.tsx` - Lock screen UI
- `lib/db/models/user-lockscreen.ts` - MongoDB model
- `lib/auth/webauthn.ts` - WebAuthn integration
- `pages/api/auth/unlock.ts` - Unlock API

---

### 6. 🗓️ Calendar App (Enhanced)
**Source File:** `/tmp/macos-simulator/src/app/Calendar.jsx`

**SmartyAI Implementation:**
- **User-Specific Data:** Events stored in MongoDB
- **Features:**
  - Month/Week/Day views
  - Add/Edit/Delete events
  - Color-coded calendars (Personal, Work, Family)
  - Event reminders
  - All-day events
  - Event search
  - Mini calendar sidebar
  - Recurring events
  - Calendar sharing

**MongoDB Schema:**
```typescript
interface UserCalendar {
  userId: string;
  events: {
    id: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    isAllDay: boolean;
    calendar: 'personal' | 'work' | 'family' | 'school' | 'reminders' | 'birthdays';
    color: string;
    location?: string;
    url?: string;
    reminders: {
      type: 'email' | 'notification';
      minutes: number;
    }[];
    isRecurring: boolean;
    recurrence?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval: number;
      endDate?: Date;
      count?: number;
    };
    attendees?: string[];
    createdAt: Date;
    updatedAt: Date;
  }[];
  calendars: {
    id: string;
    name: string;
    color: string;
    isDefault: boolean;
    isVisible: boolean;
  }[];
}
```

**Files to Create/Update:**
- `src/app/desktop/apps/CalendarApp.tsx` - Enhanced calendar UI
- `lib/db/models/user-calendar.ts` - MongoDB model (already exists, needs update)
- `pages/api/calendar/[action].ts` - API endpoints

---

### 7. 🎛️ Widget System
**Source Files:** `/tmp/macos-simulator/src/components/widgets/`

**SmartyAI Implementation:**
- **User-Specific Data:** Widget preferences stored in MongoDB
- **Features:**
  - Widget gallery
  - Drag-and-drop widgets
  - Widget resizing
  - Widget customization
  - Glass morphism widgets (Weather, Calendar, Clock, Reminders)
  - Widget data sources (user's data)

**Available Widgets:**
1. **Calendar Widget** - Show today's events
2. **Weather Widget** - User's location weather
3. **Clock Widget** - Multiple time zones
4. **Reminders Widget** - Today's tasks
5. **Photo Widget** - User's photos
6. **GitHub Activity Widget** - Recent commits/activity
7. **AI Chat Widget** - Quick AI assistant

**MongoDB Schema:**
```typescript
interface UserWidgets {
  userId: string;
  widgets: {
    id: string;
    type: 'calendar' | 'weather' | 'clock' | 'reminders' | 'photo' | 'github' | 'ai';
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: Record<string, any>;
    isVisible: boolean;
    order: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Files to Create:**
- `src/app/desktop/components/WidgetGallery.tsx` - Widget picker
- `src/app/desktop/widgets/CalendarWidget.tsx` - Calendar widget
- `src/app/desktop/widgets/WeatherWidget.tsx` - Weather widget
- `src/app/desktop/widgets/ClockWidget.tsx` - Clock widget
- `src/app/desktop/widgets/RemindersWidget.tsx` - Reminders widget
- `src/app/desktop/widgets/GitHubWidget.tsx` - GitHub activity
- `src/app/desktop/widgets/AIWidget.tsx` - Quick AI chat
- `lib/db/models/user-widgets.ts` - MongoDB model
- `pages/api/widgets/[action].ts` - API endpoints

---

### 8. ⬆️ Top Bar Widget Option
**Source File:** `/tmp/macos-simulator/src/components/TopBar.jsx`

**SmartyAI Implementation:**
- **Features:**
  - "Add Widget" button in top bar (next to Control Center)
  - Widget gallery dropdown
  - Quick widget add
  - Widget management

**Implementation:**
```tsx
// In TopBar.tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <FiPlusSquare /> Add Widget
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <WidgetGallery onSelect={addWidget} />
  </DropdownMenuContent>
</DropdownMenu>
```

**Files to Update:**
- `src/app/desktop/components/TopBar.tsx` - Add widget button

---

## Onboarding Process Integration

### Step 1: Resume Upload
```
User arrives → Upload Resume Screen
AI extracts: 
- Name, Email, Phone
- Work Experience
- Education
- Skills
- Projects
- GitHub/LinkedIn URLs
```

### Step 2: Profile Creation
```
AI creates user profile:
- Profile photo (first letter initially)
- Display name
- Contact info
- Auto-populated contacts from resume
- Auto-populated calendar (work anniversaries, etc.)
```

### Step 3: Lock Screen Setup
```
User sees lock screen:
- AI-generated profile photo (optional)
- Name auto-filled
- Set password/PIN
- Choose wallpaper
- Setup complete!
```

### Step 4: Desktop Experience
```
Desktop appears with:
- User's folders (Projects, About, Resume, GitHub, etc.)
- AI assistant ready
- Widgets suggested (Calendar, GitHub activity)
- Apps in dock (Calendar, Mail, Contacts, Music, Phone, FaceTime, etc.)
```

---

## Technical Implementation Details

### 1. Component Reuse Strategy

**Approach:** Analyze source components, extract UI patterns, adapt to SmartyAI architecture

**Steps:**
1. Copy component structure from MacOS-Web-Simulator
2. Replace static data with MongoDB operations
3. Add user context (userId) to all components
4. Implement API endpoints for data operations
5. Add AI integration where applicable

**Example - Phone App:**
```tsx
// Original (MacOS-Web-Simulator)
const defaultContacts = [
  { id: "antonio", firstName: "Antonio", ... }
];

// SmartyAI Version
import { useUser } from '@/lib/hooks/useUser';
import { getUserContacts } from '@/lib/db/models/user-contacts';

export default function PhoneApp({ windowId }) {
  const { user } = useUser();
  const [contacts, setContacts] = useState([]);
  
  useEffect(() => {
    if (user) {
      getUserContacts(user.id).then(setContacts);
    }
  }, [user]);
  
  // Rest of component
}
```

### 2. MongoDB Integration

**All user-specific data stored in MongoDB:**
```typescript
// lib/db/client.ts (already exists)
import mongoose from 'mongoose';

// lib/db/models/user-*.ts (create new models)
export const createUserMusicModel = () => {
  const schema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    spotifyConnected: { type: Boolean, default: false },
    playlists: [{
      id: String,
      name: String,
      trackCount: Number,
      coverImage: String,
      spotifyUrl: String
    }],
    recentlyPlayed: [{
      trackId: String,
      trackName: String,
      artist: String,
      albumArt: String,
      playedAt: Date
    }]
  });
  
  return mongoose.models.UserMusic || mongoose.model('UserMusic', schema);
};
```

### 3. API Endpoints

**Pattern for all apps:**
```typescript
// pages/api/[app]/[action].ts
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db/client';
import { User[App]Model } from '@/lib/db/models/user-[app]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { action } = req.query;
  const userId = session.user.id;
  
  switch (action) {
    case 'get':
      const data = await User[App]Model.findOne({ userId });
      return res.json(data);
    
    case 'update':
      const updated = await User[App]Model.findOneAndUpdate(
        { userId },
        req.body,
        { new: true, upsert: true }
      );
      return res.json(updated);
    
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}
```

### 4. UI Component Adaptation

**Glass Morphism Widgets (from MacOS-Web-Simulator):**
```tsx
// src/app/desktop/widgets/GlassCalendarWidget.tsx
import React from 'react';
import { format } from 'date-fns';
import { useUser } from '@/lib/hooks/useUser';
import { getUserEvents } from '@/lib/db/models/user-calendar';

export default function GlassCalendarWidget() {
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    if (user) {
      getUserEvents(user.id, new Date()).then(setEvents);
    }
  }, [user]);
  
  return (
    <div className="w-40 h-40 p-4 flex flex-col justify-between text-white select-none shrink-0 pointer-events-auto relative overflow-hidden transition-all duration-300 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20">
      {/* Widget content from MacOS-Web-Simulator, adapted with user data */}
    </div>
  );
}
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)
1. ✅ Create MongoDB models for all apps
2. ✅ Setup widget system architecture
3. ✅ Implement lock screen flow
4. ✅ Create onboarding resume upload

### Phase 2: Essential Apps (Week 2)
1. ✅ Phone App (with user contacts)
2. ✅ Contacts App (with AI extraction)
3. ✅ Calendar App (enhanced, user-specific)
4. ✅ FaceTime App (UI + call history)

### Phase 3: Media Apps (Week 3)
1. ✅ Music App (Spotify integration)
2. ✅ Photo Gallery (with user photos)
3. ✅ Reminders App (user-specific)

### Phase 4: Widget System (Week 4)
1. ✅ Widget gallery
2. ✅ Glass calendar widget
3. ✅ Weather widget
4. ✅ GitHub activity widget
5. ✅ AI quick chat widget

### Phase 5: Polish & Testing (Week 5)
1. ✅ Performance optimization
2. ✅ Mobile responsiveness
3. ✅ User testing
4. ✅ Bug fixes
5. ✅ Documentation

---

## Component Mapping

### From MacOS-Web-Simulator → SmartyAI

| Source Component | SmartyAI Component | Changes Needed |
|------------------|-------------------|----------------|
| `Phone.jsx` | `PhoneApp.tsx` | Add MongoDB, user context |
| `Contacts.jsx` | `ContactsApp.tsx` | Add AI extraction, MongoDB |
| `FaceTime.jsx` | `FaceTimeApp.tsx` | Add call history to MongoDB |
| `Calendar.jsx` | `CalendarApp.tsx` | Already exists, enhance with MongoDB events |
| `Spotify.jsx` | `MusicApp.tsx` | Add user playlists, MongoDB |
| `LockScreen.jsx` | `LockScreen.tsx` | Add user profile from resume |
| `GlassCalendarWidget.jsx` | `CalendarWidget.tsx` | Add user events |
| `WeatherWidget.jsx` | `WeatherWidget.tsx` | Add user location |
| `TopBar.jsx` | `TopBar.tsx` | Add "Add Widget" button |

---

## Key Differences from MacOS-Web-Simulator

### 1. **Data Persistence**
- **MacOS-Web-Simulator:** Uses localStorage
- **SmartyAI:** Uses MongoDB with user authentication

### 2. **User Context**
- **MacOS-Web-Simulator:** Single user demo
- **SmartyAI:** Multi-user platform with user-specific data

### 3. **AI Integration**
- **MacOS-Web-Simulator:** No AI
- **SmartyAI:** AI-powered features:
  - Resume extraction
  - Contact extraction
  - Smart reminders
  - AI assistant

### 4. **Portfolio Focus**
- **MacOS-Web-Simulator:** General macOS simulation
- **SmartyAI:** Portfolio/resume-focused desktop for job seekers

### 5. **External Integrations**
- **MacOS-Web-Simulator:** Limited (Spotify)
- **SmartyAI:** Multiple integrations:
  - GitHub
  - LinkedIn
  - Spotify
  - Google Calendar
  - AI providers

---

## Recommended Implementation Order

1. **Lock Screen** (Critical for onboarding)
   - Resume upload flow
   - AI profile extraction
   - Password/PIN setup
   - Apple unlock animation

2. **Contacts App** (Core for user data)
   - AI extraction from resume
   - LinkedIn/GitHub import
   - MongoDB storage
   - UI from MacOS-Web-Simulator

3. **Calendar App Enhancement** (Already exists)
   - Add MongoDB events storage
   - User-specific calendars
   - Event management API

4. **Phone & FaceTime Apps** (UI components)
   - Pull UI from MacOS-Web-Simulator
   - Add call history to MongoDB
   - User contacts integration

5. **Music App** (Premium feature)
   - Spotify integration
   - User playlists in MongoDB
   - UI from MacOS-Web-Simulator

6. **Widget System** (Enhancement)
   - Gallery UI
   - User preferences in MongoDB
   - Glass widgets adapted with user data

---

## Technical Considerations

### 1. **Authentication & Authorization**
- NextAuth.js for session management
- MongoDB for user data
- API routes protected with session checks

### 2. **Real-time Updates**
- WebSocket for call notifications
- Push notifications for reminders
- Real-time calendar updates

### 3. **Performance**
- Lazy load apps
- Optimize MongoDB queries
- Cache user data in React Query

### 4. **Privacy & Security**
- encrypt passwords/PINs
- Secure WebAuthn credentials
- Private/Public data separation

---

## Next Steps

1. **Start with Lock Screen** - Critical for user onboarding
2. **Create MongoDB models** - Infrastructure first
3. **Adapt Contacts App** - Core user data
4. **Enhance Calendar** - Already exists, add MongoDB
5. **Add Widget System** - Desktop enhancement

This plan ensures a systematic integration of MacOS-Web-Simulator features while maintaining SmartyAI's unique value proposition as an AI-powered portfolio desktop.

# Enhanced macOS Apps with MongoDB Integration

## Overview

This document describes the enhanced macOS apps that have been integrated with MongoDB for persistent, user-specific data storage. These apps follow a consistent architecture pattern:

**Service Layer → API Routes → UI Component → Integration**

All data is:
- User-specific (isolated by `userId`)
- Stored in MongoDB using the native driver
- Accessed through authenticated API routes
- Displayed in React components with real-time updates

---

## 📅 Enhanced Calendar App

### Location
- **Component**: `/components/Desktop/EnhancedCalendar.tsx`
- **Service**: `/modules/calendar/calendar.service.ts`
- **API Routes**: `/app/api/calendar/**`

### Features

✅ **User-specific calendars**
- Personal, Work, Holidays calendars
- Custom color coding
- Default calendars created automatically

✅ **Event Management**
- Create, edit, delete events
- All-day vs timed events
- Location and reminders
- Recurring events support

✅ **Holiday Integration**
- Public holidays for India (IN) and United States (US)
- Country flag badges (🇮🇳 🇺🇸)
- One-click holiday seeding

✅ **Search & Filtering**
- Search by title/description
- Filter by calendar
- Upcoming events view

### Database Schema

```typescript
interface CalendarDocument {
  _id: ObjectId;
  userId: string;
  name: string;
  type: "personal" | "work" | "holidays" | "custom";
  color: string;
  visible: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarEventDocument {
  _id: ObjectId;
  userId: string;
  calendarId: ObjectId;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  allDay: boolean;
  location?: string;
  recurring?: "daily" | "weekly" | "monthly" | "yearly";
  reminder?: number; // minutes before
  color?: string;
  source?: "user" | "holiday";
  holidayCountry?: "IN" | "US";
  holidayData?: {
    name: string;
    type: "public" | "optional" | "observance";
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints

- `GET /api/calendar/calendars` - Get user calendars
- `POST /api/calendar/calendars` - Create calendar
- `GET /api/calendar/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get events
- `POST /api/calendar/events` - Create event
- `PUT /api/calendar/events/[id]` - Update event
- `DELETE /api/calendar/events/[id]` - Delete event
- `POST /api/calendar/seed-holidays` - Seed holidays for country

### Testing

```bash
# Test calendar system
node test-calendar-system.js

# Seed holidays
curl -X POST http://localhost:3000/api/calendar/seed-holidays \
  -H "Content-Type: application/json" \
  -d '{"country": "IN"}'
```

---

## 👥 Enhanced Contacts App

### Location
- **Component**: `/components/Desktop/EnhancedContacts.tsx`
- **Service**: `/modules/contacts/contacts.service.ts`
- **API Routes**: `/app/api/contacts/**`

### Features

✅ **Contact Management**
- Create, edit, delete contacts
- First name, last name, nickname
- Phone, email, company
- Address, birthday, notes
- Custom tags and categories

✅ **Favorites System**
- Mark contacts as favorites
- Quick filter for favorites
- Favorite toggle in UI

✅ **Search & Filter**
- Search by name, email, phone, company
- Alphabetical grouping
- Tag-based filtering

✅ **Birthday Reminders**
- Upcoming birthdays view
- Birthday field in contact details

### Database Schema

```typescript
interface ContactDocument {
  _id: ObjectId;
  userId: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  avatar?: string; // URL
  avatarBg?: string; // CSS color
  gradient?: string; // CSS gradient
  phone?: string;
  email?: string;
  workEmail?: string;
  workPhone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  birthday?: string; // MM-DD
  website?: string;
  linkedin?: string;
  twitter?: string;
  notes?: string;
  tags?: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints

- `GET /api/contacts` - Get all user contacts
- `GET /api/contacts?search=query` - Search contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts/[id]` - Get single contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Testing

```bash
# Test contacts system
node test-contacts-system.js
```

---

## 📹 Enhanced FaceTime App

### Location
- **Component**: `/components/Desktop/EnhancedFaceTime.tsx`
- **Service**: `/modules/facetime/facetime.service.ts`
- **API Routes**: `/app/api/facetime/**`

### Features

✅ **Call History**
- Outgoing, incoming, missed calls
- Call duration tracking
- Contact information
- Call quality (HD/SD/Low)

✅ **Video Calling**
- Webcam integration
- Camera/microphone controls
- Device selection
- Self-view in Picture-in-Picture

✅ **Audio Calling**
- Voice-only calls
- Microphone control

✅ **Call Statistics**
- Total calls
- Video vs audio calls
- Missed calls count
- Total duration

✅ **Settings Management**
- Enable/disable camera
- Enable/disable microphone
- Preferred camera selection
- Preferred microphone selection
- Ringtone toggle
- Call waiting
- Caller ID settings
- Block unknown callers
- Blocked contacts list

### Database Schema

```typescript
interface CallHistoryDocument {
  _id: ObjectId;
  userId: string;
  contactId?: ObjectId;
  contactName: string;
  contactAvatar?: string;
  callType: "video" | "audio";
  direction: "outgoing" | "incoming" | "missed";
  status: "completed" | "missed" | "rejected" | "failed";
  startTime: Date;
  endTime?: Date;
  duration?: number; // seconds
  quality?: "hd" | "sd" | "low";
  notes?: string;
  createdAt: Date;
}

interface FaceTimeSettingsDocument {
  _id: ObjectId;
  userId: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  preferredCamera?: string;
  preferredMicrophone?: string;
  ringtone: boolean;
  callWaiting: boolean;
  callForwarding?: string;
  showCallerId: boolean;
  blockUnknownCallers: boolean;
  blockedContacts: ObjectId[];
  allowRecording: boolean;
  recordingPath?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints

- `GET /api/facetime/history` - Get call history
- `POST /api/facetime/history` - Log new call
- `DELETE /api/facetime/history` - Clear all history
- `DELETE /api/facetime/history/[id]` - Delete single call
- `GET /api/facetime/settings` - Get user settings
- `PUT /api/facetime/settings` - Update settings
- `POST /api/facetime/block/[contactId]` - Block contact
- `DELETE /api/facetime/block/[contactId]` - Unblock contact

---

## Architecture Pattern

All three apps follow the same consistent architecture:

### 1. Service Layer

**Purpose**: Business logic and database operations

**Pattern**:
```typescript
// modules/[app]/[app].service.ts

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function getUserItems(userId: string) {
  const db = await getDatabase();
  const items = await db
    .collection("items")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  
  return items;
}

export async function createItem(userId: string, params: CreateItemParams) {
  const db = await getDatabase();
  const result = await db.collection("items").insertOne({
    userId,
    ...params,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return result.insertedId.toString();
}
```

### 2. API Routes

**Purpose**: HTTP endpoints with authentication

**Pattern**:
```typescript
// app/api/[app]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserItems, createItem } from "@/modules/[app]/[app].service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const items = await getUserItems(user.id);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await request.json();
  const itemId = await createItem(user.id, body);
  
  return NextResponse.json({ itemId }, { status: 201 });
}
```

### 3. UI Component

**Purpose**: React component with state management

**Pattern**:
```typescript
// components/Desktop/Enhanced[App].tsx

import { useState, useEffect } from "react";

export default function EnhancedApp() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  async function fetchItems() {
    try {
      const res = await fetch("/api/[app]");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div>
      {/* UI implementation */}
    </div>
  );
}
```

### 4. Integration

**Purpose**: Register in app system

**Steps**:
1. Import in `/lib/appRegistry.tsx`
2. Add to apps array with configuration
3. Handle in `/components/Dekstop/deskstop.tsx`

---

## User Isolation

All database queries include `userId` filtering:

```typescript
// ✅ CORRECT - Always filter by userId
db.collection("items").find({ userId })

// ❌ WRONG - Never trust client-provided userId
db.collection("items").find({ userId: body.userId })

// ✅ CORRECT - Get userId from authenticated session
const user = await getCurrentUser();
db.collection("items").find({ userId: user.id })
```

---

## Testing

Each app has a corresponding test script:

- Calendar: `test-calendar-system.js`
- Contacts: `test-contacts-system.js`
- FaceTime: `test-facetime-system.js` (create if needed)

Run tests:
```bash
node test-calendar-system.js
node test-contacts-system.js
```

---

## Future Enhancements

### Calendar
- [ ] Google Calendar sync
- [ ] iCal import/export
- [ ] Event invitations
- [ ] Multiple attendees
- [ ] Time zone support
- [ ] More holiday sources

### Contacts
- [ ] Contact import (CSV, vCard)
- [ ] Contact export
- [ ] Social media integration
- [ ] Contact merging
- [ ] Duplicate detection
- [ ] Contact groups

### FaceTime
- [ ] Real WebRTC integration
- [ ] Screen sharing
- [ ] Group calls
- [ ] Call recording
- [ ] Virtual backgrounds
- [ ] Noise cancellation

---

## Status Summary

| App | Service | API Routes | Component | Integration | Tests |
|-----|---------|------------|-----------|-------------|-------|
| Calendar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contacts | ✅ | ✅ | ✅ | 🔄 | ✅ |
| FaceTime | ✅ | ✅ | ✅ | 🔄 | 🔄 |

**Legend**:
- ✅ Complete
- 🔄 Partial/In Progress
- ❌ Not Started

---

## Next Steps

1. Integrate EnhancedContacts into deskstop.tsx
2. Integrate EnhancedFaceTime into deskstop.tsx
3. Create FaceTime test script
4. Add seed data for FaceTime
5. Implement remaining enhancements

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Author**: GitHub Copilot

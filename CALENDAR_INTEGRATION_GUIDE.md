# Quick Reference: Connecting Calendar UI to Backend

## Step 1: Update Calendar Component State

Replace the hardcoded seed data in `Calender.tsx`:

```typescript
// ❌ REMOVE THIS:
import { todayISO, pad, isoOf, WEEKDAYS, MONTHS } from './helpers';
const SEED_EVENTS: CalendarEvent[] = [
  { id: "e1", title: "Design review", date: todayISO(), time: "10:00 AM", calendarId: "work" },
  { id: "e2", title: "Gym", date: todayISO(), time: "6:30 PM", calendarId: "personal" },
];

// ✅ REPLACE WITH:
const [calendars, setCalendars] = useState<CalendarList[]>([]);
const [events, setEvents] = useState<CalendarEvent[]>([]);
const [loading, setLoading] = useState(true);
const [hydrated, setHydrated] = useState(false);
```

## Step 2: Load Calendars on Mount

```typescript
useEffect(() => {
  async function initCalendars() {
    try {
      const res = await fetch('/api/calendar/calendars');
      if (!res.ok) throw new Error('Failed to fetch calendars');
      const data = await res.json();
      setCalendars(data.calendars);
    } catch (error) {
      console.error('Failed to load calendars:', error);
      // Keep hardcoded defaults as fallback
      setCalendars(DEFAULT_CALENDARS);
    }
    setHydrated(true);
  }
  initCalendars();
}, []);
```

## Step 3: Load Events by Date Range

```typescript
useEffect(() => {
  if (!hydrated || calendars.length === 0) return;

  async function loadEvents() {
    setLoading(true);
    try {
      // Calculate month start/end
      const firstDay = new Date(cursor.year, cursor.month, 1);
      const lastDay = new Date(cursor.year, cursor.month + 1, 0);
      
      const start = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`;
      const end = `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`;

      const res = await fetch(`/api/calendar/events?start=${start}&end=${end}`);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }

  loadEvents();
}, [cursor, hydrated, calendars]);
```

## Step 4: Save Event to Backend

```typescript
function saveEvent(ev: CalendarEvent) {
  const isExisting = events.some(e => e.id === ev.id);
  const url = isExisting 
    ? `/api/calendar/events/${ev.id}` 
    : '/api/calendar/events';
  const method = isExisting ? 'PATCH' : 'POST';

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calendarId: ev.calendarId,
      title: ev.title,
      date: ev.date,
      startTime: ev.time,
      allDay: false,
      notes: ev.notes,
    }),
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    })
    .then(data => {
      // Update local state
      if (isExisting) {
        setEvents(prev => prev.map(e => (e.id === ev.id ? data.event : e)));
      } else {
        setEvents(prev => [...prev, data.event]);
      }
      setFormOpen(false);
      setEditingEvent(null);
    })
    .catch(error => {
      console.error('Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    });
}
```

## Step 5: Delete Event from Backend

```typescript
function deleteEvent(id: string) {
  fetch(`/api/calendar/events/${id}`, {
    method: 'DELETE',
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to delete');
      setEvents(prev => prev.filter(e => e.id !== id));
      setFormOpen(false);
      setEditingEvent(null);
    })
    .catch(error => {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    });
}
```

## Step 6: Search Events

```typescript
function handleSearch(query: string) {
  if (!query.trim()) {
    // Reload full month events
    loadEvents();
    return;
  }

  fetch(`/api/calendar/events?query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => setEvents(data.events))
    .catch(error => console.error('Search failed:', error));
}
```

## Step 7: Update Calendar Visibility

```typescript
function toggleCalendarVisible(id: string) {
  const cal = calendars.find(c => c.id === id);
  if (!cal) return;

  fetch('/api/calendar/calendars', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      visible: !cal.visible,
    }),
  })
    .then(() => {
      setCalendars(prev =>
        prev.map(c => (c.id === id ? { ...c, visible: !c.visible } : c))
      );
    })
    .catch(error => console.error('Failed to update calendar:', error));
}
```

## Step 8: Map Backend Events to UI Format

The backend returns events in this format:

```typescript
interface CalendarEvent {
  id: string;
  userId: string;
  calendarId: string;
  title: string;
  date: string;        // "2026-08-15"
  startTime?: string;  // "10:00 AM"
  endTime?: string;
  allDay: boolean;
  notes?: string;
  // ... other fields
}
```

The UI expects:

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  date: string;        // Same format
  time?: string;       // Map from startTime
  calendarId: string;
  notes?: string;
}
```

So the mapping is straightforward:

```typescript
const mappedEvents = events.map(e => ({
  id: e.id,
  title: e.title,
  date: e.date,
  time: e.startTime,
  calendarId: e.calendarId,
  notes: e.notes,
}));
```

## Step 9: Add Loading State

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}
```

## Step 10: Handle Errors

```typescript
const [error, setError] = useState<string | null>(null);

// In fetch catch blocks:
setError('Failed to load events. Please refresh the page.');

// In UI:
{error && (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 m-4">
    <p className="text-red-400">{error}</p>
    <button onClick={() => window.location.reload()} className="text-red-300 underline mt-2">
      Refresh Page
    </button>
  </div>
)}
```

---

## Complete Integration Example

```typescript
"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { CalendarEvent, CalendarList } from "./calendar.types";

// Helper functions
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function AppleCalendar() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [calendars, setCalendars] = useState<CalendarList[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load calendars
  useEffect(() => {
    async function initCalendars() {
      try {
        const res = await fetch('/api/calendar/calendars');
        const data = await res.json();
        setCalendars(data.calendars);
      } catch (err) {
        console.error('Failed to load calendars:', err);
        setError('Failed to load calendars');
      }
      setHydrated(true);
    }
    initCalendars();
  }, []);

  // Load events
  useEffect(() => {
    if (!hydrated) return;

    async function loadEvents() {
      setLoading(true);
      try {
        const firstDay = new Date(cursor.year, cursor.month, 1);
        const lastDay = new Date(cursor.year, cursor.month + 1, 0);
        const start = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`;
        const end = `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`;

        const res = await fetch(`/api/calendar/events?start=${start}&end=${end}`);
        const data = await res.json();
        
        // Map backend format to UI format
        const mapped = data.events.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          time: e.startTime,
          calendarId: e.calendarId,
          notes: e.notes,
        }));
        
        setEvents(mapped);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [cursor, hydrated]);

  // Save event
  async function saveEvent(ev: CalendarEvent) {
    try {
      const isExisting = events.some(e => e.id === ev.id);
      const url = isExisting ? `/api/calendar/events/${ev.id}` : '/api/calendar/events';
      const method = isExisting ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: ev.calendarId,
          title: ev.title,
          date: ev.date,
          startTime: ev.time,
          allDay: false,
          notes: ev.notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();

      if (isExisting) {
        setEvents(prev => prev.map(e => (e.id === ev.id ? data.event : e)));
      } else {
        setEvents(prev => [...prev, data.event]);
      }

      setFormOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Failed to save event:', err);
      alert('Failed to save event. Please try again.');
    }
  }

  // Delete event
  async function deleteEvent(id: string) {
    try {
      await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== id));
      setFormOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete event. Please try again.');
    }
  }

  // ... rest of your component
}
```

---

## Testing Checklist

After integration, test:

1. ✅ Navigate to different months → events should update
2. ✅ Create event → should appear immediately
3. ✅ Reload page → event should persist
4. ✅ Edit event → changes should save
5. ✅ Delete event → should disappear
6. ✅ Toggle calendar visibility → events should filter
7. ✅ Search events → should show results
8. ✅ Week view → should show correct week
9. ✅ Day view → should show events for that day
10. ✅ Dark/Light mode → should work in both

---

## Deployment Checklist

Before deploying:

1. ✅ Firebase credentials are set in `.env`
2. ✅ Firestore rules allow user-specific access only
3. ✅ API routes have authentication checks
4. ✅ All inputs have stable automation IDs
5. ✅ No hardcoded test data remains
6. ✅ Loading states work correctly
7. ✅ Error handling shows user-friendly messages
8. ✅ Mobile responsive

That's it! Your Calendar is now fully connected to a production-ready backend.

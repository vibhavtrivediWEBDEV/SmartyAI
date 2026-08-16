"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Edit3, Calendar, Clock, MapPin, Bell, Repeat, Search } from "lucide-react";

/* -------------------------------------------------------------------------
 * Enhanced Calendar App with MongoDB + Holiday Support
 * Features:
 * - User-specific events stored in MongoDB
 * - Holiday badges with country flags
 * - Color-coded events by calendar
 * - Event reminders and recurring events
 * - Search and filter functionality
 * ---------------------------------------------------------------------- */

type CalendarEvent = {
  _id: string;
  userId: string;
  calendarId: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  location?: string;
  recurring?: string;
  reminder?: number;
  color?: string;
  source: "user" | "holiday" | "ai" | "automation";
  holidayCountry?: string;
  holidayData?: {
    date: string;
    name: string;
    country: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
};

type CalendarType = {
  _id: string;
  userId: string;
  name: string;
  type: string;
  color: string;
  visible: boolean;
  isDefault: boolean;
};

interface CalendarAppProps {
  userId?: string;
}

export default function EnhancedCalendarApp({ userId }: CalendarAppProps) {
  // State
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => todayISO());
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventAllDay, setEventAllDay] = useState(true);
  const [eventCalendarId, setEventCalendarId] = useState("");
  const [eventReminder, setEventReminder] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Utility functions
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }

  function isoOf(y: number, m: number, d: number) {
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  }

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Fetch data from MongoDB
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch calendars
        const calendarsRes = await fetch("/api/calendar/calendars");
        if (calendarsRes.ok) {
          const data = await calendarsRes.json();
          setCalendars(data.calendars || []);
          
          // Set default calendar
          if (data.calendars?.length > 0 && !eventCalendarId) {
            setEventCalendarId(data.calendars[0]._id);
          }
        }

        // Fetch events for current month
        const startDate = isoOf(cursor.year, cursor.month, 1);
        const endDate = isoOf(cursor.year, cursor.month + 1, 0);
        
        const eventsRes = await fetch(`/api/calendar/events?start=${startDate}&end=${endDate}`);
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error("Failed to fetch calendar data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [cursor]);

  // Month grid builder
  const grid = useMemo(() => {
    const cells: Array<{
      day: number;
      iso: string;
      inMonth: boolean;
      isToday: boolean;
    }> = [];

    const firstDayOfMonth = new Date(cursor.year, cursor.month, 1);
    const lastDayOfMonth = new Date(cursor.year, cursor.month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    // Previous month fill
    const prevMonth = cursor.month === 0 ? 11 : cursor.month - 1;
    const prevYear = cursor.month === 0 ? cursor.year - 1 : cursor.year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      cells.push({
        day,
        iso: isoOf(prevYear, prevMonth, day),
        inMonth: false,
        isToday: false,
      });
    }

    // Current month
    const today = todayISO();
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({
        day: i,
        iso: isoOf(cursor.year, cursor.month, i),
        inMonth: true,
        isToday: isoOf(cursor.year, cursor.month, i) === today,
      });
    }

    // Next month fill
    const remaining = 42 - cells.length; // 6 rows × 7 days
    const nextMonth = cursor.month === 11 ? 0 : cursor.month + 1;
    const nextYear = cursor.month === 11 ? cursor.year + 1 : cursor.year;

    for (let i = 1; i <= remaining; i++) {
      cells.push({
        day: i,
        iso: isoOf(nextYear, nextMonth, i),
        inMonth: false,
        isToday: false,
      });
    }

    return cells;
  }, [cursor]);

  // Events grouped by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    const visibleCalendarIds = new Set(
      calendars.filter(c => c.visible).map(c => c._id)
    );

    let filteredEvents = events.filter(e => visibleCalendarIds.has(e.calendarId));

    // Apply search filter
    if (searchQuery) {
      filteredEvents = filteredEvents.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.location?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    for (const ev of filteredEvents) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }

    return map;
  }, [events, calendars, searchQuery]);

  // Navigation
  function goToday() {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(todayISO());
  }

  function goPrev() {
    setCursor(c => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });
  }

  function goNext() {
    setCursor(c => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });
  }

  // Event handlers
  function openNewEvent(date: string) {
    setEditingEvent(null);
    setEventTitle("");
    setEventDate(date);
    setEventStartTime("");
    setEventEndTime("");
    setEventDescription("");
    setEventLocation("");
    setEventAllDay(true);
    setEventReminder(0);
    setShowEventForm(true);
  }

  function openEditEvent(ev: CalendarEvent) {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventDate(ev.date);
    setEventStartTime(ev.startTime || "");
    setEventEndTime(ev.endTime || "");
    setEventDescription(ev.description || "");
    setEventLocation(ev.location || "");
    setEventAllDay(ev.allDay);
    setEventCalendarId(ev.calendarId);
    setEventReminder(ev.reminder || 0);
    setShowEventForm(true);
  }

  async function handleSaveEvent() {
    if (!eventTitle.trim() || !eventDate) return;

    setSaving(true);
    try {
      const eventData = {
        title: eventTitle,
        date: eventDate,
        startTime: eventAllDay ? undefined : eventStartTime,
        endTime: eventAllDay ? undefined : eventEndTime,
        description: eventDescription,
        location: eventLocation,
        allDay: eventAllDay,
        calendarId: eventCalendarId,
        reminder: eventReminder,
        source: "user",
      };

      if (editingEvent?._id) {
        // Update event
        const res = await fetch(`/api/calendar/events/${editingEvent._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });

        if (res.ok) {
          setEvents(prev => prev.map(e => 
            e._id === editingEvent._id 
              ? { ...e, ...eventData }
              : e
          ));
          setShowEventForm(false);
        }
      } else {
        // Create event
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });

        if (res.ok) {
          const data = await res.json();
          setEvents(prev => [...prev, {
            _id: data.eventId,
            ...eventData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: "",
          }]);
          setShowEventForm(false);
        }
      }
    } catch (error) {
      console.error("Failed to save event:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent() {
    if (!editingEvent?._id) return;

    try {
      const res = await fetch(`/api/calendar/events/${editingEvent._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEvents(prev => prev.filter(e => e._id !== editingEvent._id));
        setShowEventForm(false);
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  }

  async function toggleCalendarVisible(id: string) {
    const calendar = calendars.find(c => c._id === id);
    if (!calendar) return;

    const newVisible = !calendar.visible;

    // Optimistic update
    setCalendars(prev => prev.map(c =>
      c._id === id ? { ...c, visible: newVisible } : c
    ));

    // Update on server
    try {
      await fetch(`/api/calendar/calendars/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: newVisible }),
      });
    } catch (error) {
      console.error("Failed to toggle calendar:", error);
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#1c1c1e]">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-500 animate-pulse" />
          <p className="text-[#f2f2f7]">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#F2F2F7] dark:bg-[#1c1c1e] text-[#1c1c1e] dark:text-[#f2f2f7] overflow-hidden font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text',Segoe_UI,Roboto,sans-serif]">
      
      {/* Header Toolbar */}
      <header className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#242426]/80 backdrop-blur-xl">
        <button
          id="calendar_today_button"
          onClick={goToday}
          className="text-[13px] font-medium px-3 h-7 rounded-lg border border-black/10 dark:border-white/15 bg-white/60 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 active:scale-[0.97] transition-all"
        >
          Today
        </button>

        <div className="flex items-center gap-1">
          <button
            id="calendar_previous_button"
            onClick={goPrev}
            aria-label="Previous month"
            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.92] transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            id="calendar_next_button"
            onClick={goNext}
            aria-label="Next month"
            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.92] transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-[17px] font-semibold tracking-tight">
          {MONTHS[cursor.month]} {cursor.year}
        </h1>

        <div className="flex-1" />

        {/* Search */}
        <div className="flex items-center gap-2">
          <button
            id="calendar_search"
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Search events"
            className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.92] transition-all"
          >
            <Search className="w-5 h-5" />
          </button>
          
          {showSearch && (
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 px-3 h-8 rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-sm placeholder:text-black/40 dark:placeholder:text-white/40"
              autoFocus
            />
          )}
        </div>

        {/* Add Event Button */}
        <button
          id="calendar_add_event_button"
          onClick={() => openNewEvent(selectedDate)}
          className="w-8 h-8 grid place-items-center rounded-full text-white shadow-sm active:scale-[0.92] transition-all bg-[#0A84FF] hover:bg-[#0A84FF]/90"
          aria-label="Add event"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-[220px] shrink-0 hidden md:flex flex-col gap-5 px-3 py-4 border-r border-black/5 dark:border-white/10 bg-[#F7F7F9]/80 dark:bg-[#1f1f21]/80 backdrop-blur-xl overflow-y-auto">
          
          {/* Mini Calendar */}
          <MiniMonthNav
            year={cursor.year}
            month={cursor.month}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          {/* Calendars List */}
          <div>
            <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40 mb-2">
              My Calendars
            </div>
            <ul className="flex flex-col gap-1">
              {calendars.map(c => (
                <li key={c._id}>
                  <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[13px] transition-colors">
                    <input
                      type="checkbox"
                      checked={c.visible}
                      onChange={() => toggleCalendarVisible(c._id)}
                      className="sr-only peer"
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 transition-colors"
                      style={{
                        backgroundColor: c.visible ? c.color : "transparent",
                        border: `1.5px solid ${c.color}`,
                      }}
                    />
                    <span className={c.visible ? "" : "opacity-40 line-through"}>
                      {c.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/10">
            <div className="text-[11px] text-black/40 dark:text-white/40 uppercase tracking-wide mb-2 px-2">
              Statistics
            </div>
            <div className="space-y-1.5 text-[12px] px-2">
              <div className="flex justify-between">
                <span>Total Events</span>
                <span className="font-medium">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span>This Month</span>
                <span className="font-medium">
                  {events.filter(e => {
                    const [y, m] = e.date.split("-").map(Number);
                    return y === cursor.year && m === cursor.month + 1;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Holidays</span>
                <span className="font-medium text-red-500">
                  {events.filter(e => e.source === "holiday").length}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-[#2c2c2e]/40 shrink-0">
            {WEEKDAYS.map(w => (
              <div
                key={w}
                className="py-2 text-center text-[12px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
            {grid.map(cell => {
              const dayEvents = eventsByDate.get(cell.iso) ?? [];
              const isSelected = cell.iso === selectedDate;
              const visibleEvents = dayEvents.slice(0, 3);
              const overflow = dayEvents.length - visibleEvents.length;

              return (
                <div
                  key={cell.iso}
                  id={`calendar_day_${cell.iso.replace(/-/g, "_")}`}
                  onClick={() => setSelectedDate(cell.iso)}
                  onDoubleClick={() => openNewEvent(cell.iso)}
                  className={`relative border-b border-r border-black/5 dark:border-white/[0.06] p-2 flex flex-col cursor-pointer transition-colors ${
                    cell.inMonth ? "" : "opacity-40"
                  } ${isSelected ? "bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"}`}
                >
                  {/* Day Number */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={`w-7 h-7 grid place-items-center text-[14px] rounded-full transition-colors ${
                        cell.isToday
                          ? "text-white font-semibold bg-[#0A84FF]"
                          : "font-normal"
                      }`}
                    >
                      {cell.day}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="flex flex-col gap-[2px] overflow-hidden flex-1">
                    {visibleEvents.map(ev => {
                      const cal = calendars.find(c => c._id === ev.calendarId);
                      const isHoliday = ev.source === "holiday";
                      
                      return (
                        <button
                          key={ev._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditEvent(ev);
                          }}
                          className={`text-left px-1.5 py-0.5 text-[11px] rounded-md truncate transition-colors ${
                            isHoliday 
                              ? "bg-gradient-to-r from-red-500/20 to-red-500/10 border-l-2 border-red-500 font-medium"
                              : ""
                          }`}
                          style={{
                            backgroundColor: isHoliday ? undefined : `${cal?.color || "#8E8E93"}20`,
                            borderLeft: isHoliday ? undefined : `2px solid ${cal?.color || "#8E8E93"}`,
                          }}
                        >
                          {isHoliday && (
                            <span className="mr-1" role="img" aria-label={ev.holidayCountry}>
                              {ev.holidayCountry === "IN" ? "🇮🇳" : ev.holidayCountry === "US" ? "🇺🇸" : "🎉"}
                            </span>
                          )}
                          {ev.title}
                        </button>
                      );
                    })}
                    
                    {overflow > 0 && (
                      <div className="text-[10px] text-black/40 dark:text-white/40 text-center mt-auto">
                        +{overflow} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Selected Day Events Panel */}
        <aside className="w-[280px] shrink-0 hidden lg:flex flex-col border-l border-black/5 dark:border-white/10 bg-white/50 dark:bg-[#2c2c2e]/50">
          <div className="p-4 border-b border-black/5 dark:border-white/10">
            <div className="text-[13px] font-semibold">
              {new Date(selectedDate + "T00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(eventsByDate.get(selectedDate) ?? []).map(ev => (
              <button
                key={ev._id}
                onClick={() => openEditEvent(ev)}
                className="w-full text-left p-3 rounded-lg bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-1 h-full min-h-[40px] rounded-full"
                    style={{
                      backgroundColor: calendars.find(c => c._id === ev.calendarId)?.color || "#8E8E93",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[14px] truncate">
                      {ev.source === "holiday" && (
                        <span className="mr-1">
                          {ev.holidayCountry === "IN" ? "🇮🇳" : ev.holidayCountry === "US" ? "🇺🇸" : "🎉"}
                        </span>
                      )}
                      {ev.title}
                    </div>
                    
                    {ev.startTime && (
                      <div className="text-[12px] text-black/50 dark:text-white/50 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {ev.startTime}
                        {ev.endTime && ` - ${ev.endTime}`}
                      </div>
                    )}
                    
                    {ev.location && (
                      <div className="text-[12px] text-black/50 dark:text-white/50 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {ev.location}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}

            {eventsByDate.has(selectedDate) === false && (
              <div className="text-center text-black/40 dark:text-white/40 text-[13px] py-8">
                No events
                <button
                  onClick={() => openNewEvent(selectedDate)}
                  className="block mx-auto mt-2 text-[#0A84FF] hover:underline"
                >
                  Add event
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            id="calendar_event_form"
            className="w-full max-w-md bg-white dark:bg-[#2c2c2e] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
              <h3 className="text-[15px] font-semibold">
                {editingEvent ? "Edit Event" : "New Event"}
              </h3>
              <button
                onClick={() => setShowEventForm(false)}
                className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="text-[12px] font-medium text-black/60 dark:text-white/60 mb-1.5 block">
                  Title *
                </label>
                <input
                  id="calendar_event_title_input"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Event title"
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-[14px] placeholder:text-black/40 dark:placeholder:text-white/40"
                  autoFocus
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-[12px] font-medium text-black/60 dark:text-white/60 mb-1.5 block">
                  Date
                </label>
                <input
                  id="calendar_event_date_input"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-[14px]"
                />
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium">All-day</label>
                <button
                  onClick={() => setEventAllDay(!eventAllDay)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    eventAllDay ? "bg-[#34C759]" : "bg-black/10 dark:bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      eventAllDay ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Time */}
              {!eventAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-black/60 dark:text-white/60 mb-1.5 block">
                      Start
                    </label>
                    <input
                      id="calendar_event_time_input"
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-black/60 dark:text-white/60 mb-1.5 block">
                      End
                    </label>
                    <input
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-[14px]"
                    />
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="text-[12px] font-medium text-black/60 dark:text-white/60 mb-1.5 block">
                  Location
                </label>
                <input
                  id="calendar_event_location_input"
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Add location"
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-[14px] placeholder:text-black/40 dark:placeholder:text-white/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[12px] font-medium text-black/60 dark:text-white/60 mb-1.5 block">
                  Notes
                </label>
                <textarea
                  id="calendar_event_notes_input"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Add notes..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-[14px] placeholder:text-black/40 dark:placeholder:text-white/40 resize-none"
                />
              </div>

              {/* Calendar Selector */}
              <div>
                <label className="text-[12px] font-medium text-black/60 dark:text-white/60 mb-1.5 block">
                  Calendar
                </label>
                <select
                  id="calendar_event_calendar_select"
                  value={eventCalendarId}
                  onChange={(e) => setEventCalendarId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-[14px]"
                >
                  {calendars.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reminder */}
              <div>
                <label className="text-[12px] font-medium text-black/60 dark:text-white/60 mb-1.5 block flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  Reminder
                </label>
                <select
                  value={eventReminder}
                  onChange={(e) => setEventReminder(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border-none outline-none text-[14px]"
                >
                  <option value={0}>None</option>
                  <option value={5}>5 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-4 border-t border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01]">
              {editingEvent && (
                <button
                  onClick={handleDeleteEvent}
                  className="flex items-center gap-2 px-4 h-9 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors text-[14px]"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
              
              <div className="flex-1" />
              
              <button
                id="calendar_event_cancel_button"
                onClick={() => setShowEventForm(false)}
                className="px-4 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[14px] transition-colors"
              >
                Cancel
              </button>
              
              <button
                id="calendar_event_save_button"
                onClick={handleSaveEvent}
                disabled={!eventTitle.trim() || saving}
                className="px-6 h-9 rounded-lg bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 disabled:opacity-50 text-[14px] font-medium transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini Month Navigation Component
function MiniMonthNav({
  year,
  month,
  selectedDate,
  onDateSelect,
}: {
  year: number;
  month: number;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  
  const days: JSX.Element[] = [];
  
  // Blank cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`blank-${i}`} className="w-5 h-5" />);
  }
  
  // Day cells
  for (let i = 1; i <= daysInMonth; i++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const isSelected = iso === selectedDate;
    const isToday = iso === new Date().toISOString().split("T")[0];
    
    days.push(
      <button
        key={i}
        onClick={() => onDateSelect(iso)}
        className={`w-5 h-5 text-[10px] rounded-full transition-colors ${
          isSelected
            ? "bg-[#0A84FF] text-white"
            : isToday
              ? "font-semibold text-[#0A84FF]"
              : "hover:bg-black/5 dark:hover:bg-white/10"
        }`}
      >
        {i}
      </button>
    );
  }
  
  return (
    <div>
      <div className="text-[13px] font-semibold mb-2 px-1">
        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month]}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="w-5 h-5 text-[9px] text-black/40 dark:text-white/40 text-center font-medium">
            {d}
          </div>
        ))}
        {days}
      </div>
    </div>
  );
}

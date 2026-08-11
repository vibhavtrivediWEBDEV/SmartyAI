// 'use client'

// import { useState } from 'react';

// export default function Calender() {
//     const [isLoading, setIsLoading] = useState(true);

//     return (
//         <div className="w-full h-screen bg-white relative">
//             {isLoading && (
//                 <div className="absolute inset-0 flex items-center justify-center bg-black">
//                     <p className="text-white">Loading Calendar...</p>
//                 </div>
//             )}
//             <iframe
//                 src="https://chaseottofy.github.io/google-calendar-clone-vanilla/"
//                 className="w-full h-full border-0"
//                 title="YouTube"
//                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                 allowFullScreen
//                 onLoad={() => setIsLoading(false)}
//             />
//         </div>
//     );
// }


"use client";

import React, { useEffect, useMemo, useState } from "react";

/* -------------------------------------------------------------------------
 * AppleCalendar.tsx
 * A self-contained, Apple Calendar–inspired month view calendar.
 * Pure React + Tailwind (no external deps). Drop into any Next.js project.
 * Connected to MongoDB backend for persistence.
 * ---------------------------------------------------------------------- */

type CalendarEvent = {
  _id: string;
  userId: string;
  calendarId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // "10:00 AM"
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type CalendarList = {
  _id: string;
  userId: string;
  name: string;
  color: string; // tailwind-safe hex
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_CALENDARS: Omit<CalendarList, "_id" | "userId" | "createdAt" | "updatedAt">[] = [
  { id: "personal", name: "Personal", color: "#0A84FF", visible: true },
  { id: "work", name: "Work", color: "#FF9F0A", visible: true },
  { id: "holidays", name: "Holidays", color: "#FF453A", visible: true },
];

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

export default function AppleCalendar() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [calendars, setCalendars] = useState<CalendarList[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<"day" | "week" | "month" | "year" | "list">("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch calendars and events from MongoDB
  useEffect(() => {
    async function fetchData() {
      try {
        const [calendarsRes, eventsRes] = await Promise.all([
          fetch("/api/calendar/calendars"),
          fetch("/api/calendar/events"),
        ]);

        if (calendarsRes.ok) {
          const data = await calendarsRes.json();
          setCalendars(data.calendars.length > 0 ? data.calendars : DEFAULT_CALENDARS.map(c => ({
            ...c,
            _id: c.id,
            userId: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })));
        }

        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error("Failed to fetch calendar data:", error);
        // Fallback to default calendars
        setCalendars(DEFAULT_CALENDARS.map(c => ({
          ...c,
          _id: c.id,
          userId: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const visibleCalendarIds = useMemo(
    () => new Set(calendars.filter((c) => c.visible).map((c) => c._id)),
    [calendars]
  );

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    let filteredEvents = events;
    
    // Apply search filter
    if (searchQuery) {
      filteredEvents = events.filter(ev => 
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.notes && ev.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    for (const ev of filteredEvents) {
      if (!visibleCalendarIds.has(ev.calendarId)) continue;
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [events, visibleCalendarIds, searchQuery]);

  function goToday() {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(todayISO());
  }
  function goPrev() {
    setCursor((c) => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });
  }
  function goNext() {
    setCursor((c) => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });
  }
  function openNewEvent(dateISO: string) {
    setEditingEvent({
      _id: "",
      userId: "",
      calendarId: calendars[0]?._id ?? "personal",
      title: "",
      date: dateISO,
      time: "9:00 AM",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setFormOpen(true);
  }
  function openEditEvent(ev: CalendarEvent) {
    setEditingEvent(ev);
    setFormOpen(true);
  }
  async function saveEvent(ev: CalendarEvent) {
    try {
      const isEditing = events.some((e) => e._id === ev._id && ev._id);
      
      if (isEditing) {
        // Update existing event
        const res = await fetch(`/api/calendar/events/${ev._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calendarId: ev.calendarId,
            title: ev.title,
            date: ev.date,
            time: ev.time,
            notes: ev.notes,
          }),
        });
        
        if (res.ok) {
          setEvents((prev) => prev.map((e) => (e._id === ev._id ? ev : e)));
        }
      } else {
        // Create new event
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calendarId: ev.calendarId,
            title: ev.title,
            date: ev.date,
            time: ev.time,
            notes: ev.notes,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setEvents((prev) => [...prev, { ...ev, _id: data.eventId }]);
        }
      }
      
      setFormOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  }
  async function deleteEvent(id: string) {
    try {
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e._id !== id));
        setFormOpen(false);
        setEditingEvent(null);
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  }
  async function toggleCalendarVisible(id: string) {
    try {
      const calendar = calendars.find(c => c._id === id);
      if (!calendar) return;
      
      const newVisible = !calendar.visible;
      
      // Update locally
      setCalendars((prev) =>
        prev.map((c) => (c._id === id ? { ...c, visible: newVisible } : c))
      );
      
      // Update on server if it has a real _id
      if (calendar._id && calendar.userId) {
        await fetch(`/api/calendar/calendars/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visible: newVisible }),
        });
      }
    } catch (error) {
      console.error("Failed to toggle calendar visibility:", error);
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F2F2F7] dark:bg-[#1c1c1e]">
        <div className="text-[#1c1c1e] dark:text-[#f2f2f7]">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div
      className={theme === "dark" ? "dark" : ""}
      id="calendar_root"
      style={{ ["--accent" as any]: "#0A84FF" }}
    >
      <div className="h-screen w-full flex flex-col bg-[#F2F2F7] dark:bg-[#1c1c1e] text-[#1c1c1e] dark:text-[#f2f2f7] overflow-hidden font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text',Segoe_UI,Roboto,sans-serif] select-none">
        {/* ---------------- Toolbar ---------------- */}
        <header
          id="calendar_toolbar"
          className="flex items-center gap-3 px-4 h-14 shrink-0 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#242426]/70 backdrop-blur-xl"
        >
          <button
            id="calendar_today_button"
            onClick={goToday}
            className="text-[13px] font-medium px-3 h-7 rounded-md border border-black/10 dark:border-white/15 bg-white/60 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 active:scale-[0.97] transition-all"
          >
            Today
          </button>

          <div className="flex items-center gap-0.5">
            <button
              id="calendar_previous_button"
              onClick={goPrev}
              aria-label="Previous month"
              className="w-7 h-7 grid place-items-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.92] transition-all"
            >
              <ChevronLeft />
            </button>
            <button
              id="calendar_next_button"
              onClick={goNext}
              aria-label="Next month"
              className="w-7 h-7 grid place-items-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.92] transition-all"
            >
              <ChevronRight />
            </button>
          </div>

          <h1 className="text-[17px] font-semibold tracking-tight">
            {MONTHS[cursor.month]} {cursor.year}
          </h1>

          <div className="flex-1" />

          {/* segmented view switch */}
          <div className="hidden sm:flex items-center rounded-lg bg-black/5 dark:bg-white/10 p-0.5 text-[12px] font-medium">
            {(["day", "week", "month", "year", "list"] as const).map((v) => (
              <button
                key={v}
                id={`calendar_${v}_view`}
                onClick={() => setView(v)}
                className={`px-2.5 h-6 rounded-md capitalize transition-colors ${
                  view === v
                    ? "bg-white dark:bg-[#3a3a3c] shadow-sm"
                    : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="calendar_search"
              aria-label="Search"
              onClick={() => {
                const search = prompt("Search events...");
                if (search !== null) setSearchQuery(search);
              }}
              className="w-7 h-7 grid place-items-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.92] transition-all"
            >
              <SearchIcon />
            </button>
            {searchQuery && (
              <span className="text-[11px] text-black/40 dark:text-white/40 px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded">
                Filter: {searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 text-red-500 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label="Toggle theme"
            className="w-7 h-7 grid place-items-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.92] transition-all"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            id="calendar_add_event_button"
            onClick={() => openNewEvent(selectedDate)}
            className="w-7 h-7 grid place-items-center rounded-full text-white shadow-sm active:scale-[0.92] transition-all"
            style={{ backgroundColor: "var(--accent)" }}
            aria-label="Add event"
          >
            <PlusIcon />
          </button>
        </header>

        {/* ---------------- Body ---------------- */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside
            id="calendar_sidebar"
            className="w-[240px] shrink-0 hidden md:flex flex-col gap-5 px-3 py-4 border-r border-black/5 dark:border-white/10 bg-[#F7F7F9]/80 dark:bg-[#1f1f21]/80 backdrop-blur-xl overflow-y-auto"
          >
            <MiniMonth
              year={cursor.year}
              month={cursor.month}
              selectedDate={selectedDate}
              onSelectDate={(iso) => setSelectedDate(iso)}
              onChangeMonth={(y, m) => setCursor({ year: y, month: m })}
            />

            <div>
              <div className="px-1.5 text-[11px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40 mb-1.5">
                My Calendars
              </div>
              <ul className="flex flex-col gap-0.5">
                {calendars.map((c) => (
                  <li key={c._id}>
                    <label className="flex items-center gap-2.5 px-1.5 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-[13px]">
                      <input
                        type="checkbox"
                        checked={c.visible}
                        onChange={() => toggleCalendarVisible(c._id)}
                        className="sr-only peer"
                      />
                      <span
                        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10 peer-[]:opacity-100"
                        style={{
                          backgroundColor: c.visible ? c.color : "transparent",
                          borderColor: c.color,
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
          </aside>

          {/* Main grid */}
          <main id="calendar_grid" className="flex-1 min-w-0 flex flex-col">
            {/* weekday header */}
            <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-[#242426]/40 shrink-0">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* month grid */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
              {grid.map((cell) => {
                const dayEvents = eventsByDate.get(cell.iso) ?? [];
                const isSelected = cell.iso === selectedDate;
                const visible = dayEvents.slice(0, 3);
                const overflow = dayEvents.length - visible.length;

                return (
                  <div
                    key={cell.iso}
                    id={`calendar_day_${cell.iso.replace(/-/g, "_")}`}
                    onClick={() => setSelectedDate(cell.iso)}
                    onDoubleClick={() => openNewEvent(cell.iso)}
                    className={`relative border-b border-r border-black/5 dark:border-white/[0.06] p-1.5 flex flex-col gap-1 cursor-pointer transition-colors ${
                      cell.inMonth ? "" : "opacity-40"
                    } ${isSelected ? "bg-[color:var(--accent)]/[0.07]" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"}`}
                  >
                    <div className="flex justify-end">
                      <span
                        className={`w-6 h-6 grid place-items-center text-[13px] rounded-full ${
                          cell.isToday
                            ? "text-white font-semibold"
                            : "font-normal text-black/80 dark:text-white/80"
                        }`}
                        style={cell.isToday ? { backgroundColor: "var(--accent)" } : undefined}
                      >
                        {cell.day}
                      </span>
                    </div>

                    <div className="flex flex-col gap-[3px] overflow-hidden">
                      {visible.map((ev) => {
                        const cal = calendars.find((c) => c._id === ev.calendarId);
                        return (
                          <button
                            key={ev._id}
                            id={`calendar_event_${ev._id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditEvent(ev);
                            }}
                            className="text-left text-[11px] leading-[15px] px-1.5 py-[1px] rounded truncate text-white font-medium hover:brightness-110 transition-[filter]"
                            style={{ backgroundColor: cal?.color ?? "#0A84FF" }}
                            title={ev.title}
                          >
                            {ev.title}
                          </button>
                        );
                      })}
                      {overflow > 0 && (
                        <span className="text-[10.5px] text-black/40 dark:text-white/40 px-1.5">
                          +{overflow} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>

      {formOpen && editingEvent && (
        <EventPopover
          event={editingEvent}
          calendars={calendars}
          onCancel={() => {
            setFormOpen(false);
            setEditingEvent(null);
          }}
          onSave={saveEvent}
          onDelete={events.some((e) => e._id === editingEvent._id && editingEvent._id) ? deleteEvent : undefined}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Mini month datepicker (sidebar)
 * ---------------------------------------------------------------------- */
function MiniMonth({
  year,
  month,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: {
  year: number;
  month: number;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onChangeMonth: (y: number, m: number) => void;
}) {
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function prev() {
    const m = month - 1;
    if (m < 0) {
      onChangeMonth(year - 1, 11);
    } else {
      onChangeMonth(year, m);
    }
  }
  function next() {
    const m = month + 1;
    if (m > 11) {
      onChangeMonth(year + 1, 0);
    } else {
      onChangeMonth(year, m);
    }
  }

  return (
    <div className="px-1.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold">
          {MONTHS[month]} {year}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prev}
            className="w-5 h-5 grid place-items-center rounded hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Previous"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={next}
            className="w-5 h-5 grid place-items-center rounded hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Next"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-[9.5px] font-medium text-black/35 dark:text-white/35">
            {d}
          </span>
        ))}
        {grid.map((cell) => (
          <button
            key={cell.iso}
            onClick={() => onSelectDate(cell.iso)}
            className={`w-6 h-6 mx-auto grid place-items-center text-[11px] rounded-full transition-colors ${
              !cell.inMonth ? "text-black/25 dark:text-white/25" : "text-black/80 dark:text-white/80"
            } ${cell.iso === selectedDate ? "ring-1 ring-[color:var(--accent)]" : ""}`}
            style={
              cell.isToday
                ? { backgroundColor: "var(--accent)", color: "white" }
                : undefined
            }
          >
            {cell.day}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Event create/edit popover (Apple-style translucent modal)
 * ---------------------------------------------------------------------- */
function EventPopover({
  event,
  calendars,
  onCancel,
  onSave,
  onDelete,
}: {
  event: CalendarEvent;
  calendars: CalendarList[];
  onCancel: () => void;
  onSave: (ev: CalendarEvent) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState<CalendarEvent>(event);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 backdrop-blur-[2px]" onClick={onCancel}>
      <div
        id="calendar_event_form"
        onClick={(e) => e.stopPropagation()}
        className="w-[380px] rounded-2xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#2c2c2e]/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 flex flex-col gap-3">
          <input
            id="calendar_event_title_input"
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Add title"
            className="text-[16px] font-semibold bg-transparent outline-none placeholder:text-black/30 dark:placeholder:text-white/30"
          />

          <div className="flex items-center gap-2 text-[13px]">
            <CalendarIcon />
            <input
              id="calendar_event_date_input"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="bg-transparent outline-none flex-1"
            />
            <input
              id="calendar_event_time_input"
              type="text"
              value={draft.time ?? ""}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              placeholder="9:00 AM"
              className="bg-transparent outline-none w-20 text-right"
            />
          </div>

          <div className="flex items-center gap-2 text-[13px]">
            <DotIcon color={calendars.find((c) => c._id === draft.calendarId)?.color} />
            <select
              id="calendar_event_calendar_select"
              value={draft.calendarId}
              onChange={(e) => setDraft({ ...draft, calendarId: e.target.value })}
              className="bg-transparent outline-none flex-1"
            >
              {calendars.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            id="calendar_event_notes_input"
            value={draft.notes ?? ""}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Notes"
            rows={3}
            className="text-[13px] bg-black/[0.03] dark:bg-white/[0.05] rounded-lg p-2 outline-none resize-none placeholder:text-black/30 dark:placeholder:text-white/30"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
          {onDelete ? (
            <button
              id="calendar_event_delete_button"
              onClick={() => onDelete(draft._id)}
              className="text-[13px] text-[#FF453A] font-medium hover:opacity-70"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              id="calendar_event_cancel_button"
              onClick={onCancel}
              className="text-[13px] font-medium px-3 h-7 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              id="calendar_event_save_button"
              disabled={!draft.title.trim() || !draft.calendarId}
              onClick={() => onSave(draft)}
              className="text-[13px] font-medium px-3 h-7 rounded-md text-white disabled:opacity-40"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Calendar math helpers
 * ---------------------------------------------------------------------- */
type DayCell = { iso: string; day: number; inMonth: boolean; isToday: boolean };

function buildMonthGrid(year: number, month: number): DayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = todayISO();

  const cells: DayCell[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = month - 1 < 0 ? 11 : month - 1;
    const y = month - 1 < 0 ? year - 1 : year;
    const iso = isoOf(y, m, day);
    cells.push({ iso, day, inMonth: false, isToday: iso === today });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = isoOf(year, month, day);
    cells.push({ iso, day, inMonth: true, isToday: iso === today });
  }
  const remainder = 42 - cells.length;
  for (let day = 1; day <= remainder; day++) {
    const m = month + 1 > 11 ? 0 : month + 1;
    const y = month + 1 > 11 ? year + 1 : year;
    const iso = isoOf(y, m, day);
    cells.push({ iso, day, inMonth: false, isToday: iso === today });
  }
  return cells;
}

/* -------------------------------------------------------------------------
 * Minimal inline icon set (no external icon lib dependency)
 * ---------------------------------------------------------------------- */
function ChevronLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-black/40 dark:text-white/40">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function DotIcon({ color = "#0A84FF" }: { color?: string }) {
  return <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />;
}
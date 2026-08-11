export interface Calendar {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  type: "personal" | "work" | "holidays" | "custom";
  color: string; // Hex color like "#0A84FF"
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string; // Firestore document ID
  userId: string;
  calendarId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // "10:00 AM" or "14:30"
  endTime?: string; // "11:00 AM" or "15:30"
  allDay: boolean;
  notes?: string;
  location?: string;
  color?: string; // Override calendar color if provided
  timezone?: string;
  source?: "user" | "holiday" | "ai" | "automation";
  holiday?: boolean;
  holidayCountry?: string; // "IN", "US", "UK", etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCalendarParams {
  name: string;
  type: "personal" | "work" | "holidays" | "custom";
  color?: string;
  visible?: boolean;
}

export interface CreateEventParams {
  calendarId: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  notes?: string;
  location?: string;
  color?: string;
  timezone?: string;
  holiday?: boolean;
  holidayCountry?: string;
  source?: "user" | "holiday" | "ai" | "automation";
}

export interface UpdateEventParams extends Partial<CreateEventParams> {
  id: string;
}

export interface SearchEventsParams {
  query: string;
  startDate?: string;
  endDate?: string;
  calendarIds?: string[];
}

export interface GetEventsParams {
  startDate: string;
  endDate: string;
  calendarIds?: string[];
}

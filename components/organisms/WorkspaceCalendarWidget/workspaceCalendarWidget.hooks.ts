"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getRecentCalendarEventsAction,
  generateCalendarEventAction,
} from "@/lib/domain/actions/google_workspace_auth.actions";
import type { CalendarEventSummary } from "@/lib/entities/google_workspace_auth.type";

export interface CalendarDayCell {
  date: Date;
  dateStr: string; // YYYY-MM-DD in local timezone
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
}

// Helper: format Date object as YYYY-MM-DD inside the browser's local timezone
export const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Helper: parse API start string (whether ISO with UTC/offset or YYYY-MM-DD all-day) to local YYYY-MM-DD
export const getEventLocalDateStr = (startStr: string): string => {
  if (!startStr) return "";
  if (startStr.length === 10 && !startStr.includes("T")) {
    return startStr; // All-day event string e.g. YYYY-MM-DD
  }
  try {
    const d = new Date(startStr);
    if (isNaN(d.getTime())) return startStr.split("T")[0];
    return formatLocalDate(d);
  } catch {
    return startStr.split("T")[0];
  }
};

// Helper: format selectedDate string nicely without time shifting
export const formatSelectedDateHeader = (dateStr: string | null): string => {
  if (!dateStr) return "Upcoming Agenda";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return `Events for ${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } catch {
    return `Events for ${dateStr}`;
  }
};

export function useWorkspaceCalendarWidget(enabled: boolean, isConnected: boolean) {
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calendar Grid Navigation State
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    return formatLocalDate(new Date());
  });
  const [viewMode, setViewMode] = useState<"grid" | "agenda">("grid");

  // Form State
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState(() => formatLocalDate(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [addGoogleMeet, setAddGoogleMeet] = useState(true);

  const loadEvents = useCallback(async () => {
    if (!isConnected || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getRecentCalendarEventsAction();
      if (res.ok) {
        setEvents(res.data);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("Failed to fetch calendar events.");
    } finally {
      setLoading(false);
    }
  }, [isConnected, enabled]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Generate calendar days for currentMonth grid using accurate local timezone date strings
  const calendarDays = useMemo<CalendarDayCell[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const todayStr = formatLocalDate(new Date());
    const days: CalendarDayCell[] = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = formatLocalDate(d);
      days.push({
        date: d,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        hasEvents: events.some((e) => e.start && getEventLocalDateStr(e.start) === dateStr),
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateStr = formatLocalDate(d);
      days.push({
        date: d,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        hasEvents: events.some((e) => e.start && getEventLocalDateStr(e.start) === dateStr),
      });
    }

    // Next month filler days to complete 42 cells (6 rows of 7)
    const remainingSlots = 42 - days.length;
    for (let dayNum = 1; dayNum <= remainingSlots; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const dateStr = formatLocalDate(d);
      days.push({
        date: d,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        hasEvents: events.some((e) => e.start && getEventLocalDateStr(e.start) === dateStr),
      });
    }

    return days;
  }, [currentMonth, events]);

  const prevMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(formatLocalDate(now));
  }, []);

  const handleSelectDay = useCallback((dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
    setStartDate(dateStr);
  }, []);

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return events;
    return events.filter((e) => e.start && getEventLocalDateStr(e.start) === selectedDate);
  }, [events, selectedDate]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !startDate) return;

    setSubmitting(true);
    setError(null);
    try {
      const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endIso = new Date(`${startDate}T${endTime}:00`).toISOString();

      const res = await generateCalendarEventAction({
        summary: summary.trim(),
        start: startIso,
        end: endIso,
        addGoogleMeet,
      });

      if (res.ok) {
        setSummary("");
        setShowAddForm(false);
        await loadEvents();
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("Failed to create quick event.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatEventTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const monthYearLabel = useMemo(() => {
    return currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentMonth]);

  return {
    events,
    filteredEvents,
    calendarDays,
    currentMonth,
    monthYearLabel,
    selectedDate,
    viewMode,
    setViewMode,
    loading,
    error,
    showAddForm,
    setShowAddForm,
    submitting,
    summary,
    setSummary,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    addGoogleMeet,
    setAddGoogleMeet,
    loadEvents,
    prevMonth,
    nextMonth,
    goToToday,
    handleSelectDay,
    handleCreateEvent,
    formatEventTime,
  };
}

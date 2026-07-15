"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  getRecentCalendarEventsAction,
  generateCalendarEventAction,
} from "@/lib/domain/actions/google_workspace_auth.actions";
import type { CalendarEventSummary } from "@/lib/entities/google_workspace_auth.type";

export interface CalendarDayCell {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
}

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
    return new Date().toISOString().split("T")[0];
  });
  const [viewMode, setViewMode] = useState<"grid" | "agenda">("grid");

  // Form State
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
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

  // Generate calendar days for currentMonth grid
  const calendarDays = useMemo<CalendarDayCell[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().split("T")[0];
    const days: CalendarDayCell[] = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        hasEvents: events.some((e) => e.start && e.start.startsWith(dateStr)),
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        hasEvents: events.some((e) => e.start && e.start.startsWith(dateStr)),
      });
    }

    // Next month filler days to complete 42 cells (6 rows of 7)
    const remainingSlots = 42 - days.length;
    for (let dayNum = 1; dayNum <= remainingSlots; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        hasEvents: events.some((e) => e.start && e.start.startsWith(dateStr)),
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
    setSelectedDate(now.toISOString().split("T")[0]);
  }, []);

  const handleSelectDay = useCallback((dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
    setStartDate(dateStr);
  }, []);

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return events;
    return events.filter((e) => e.start && e.start.startsWith(selectedDate));
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

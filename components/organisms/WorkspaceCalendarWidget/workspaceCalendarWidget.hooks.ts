"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getRecentCalendarEventsAction,
  generateCalendarEventAction,
} from "@/lib/domain/actions/google_workspace_auth.actions";
import type { CalendarEventSummary } from "@/lib/entities/google_workspace_auth.type";

export function useWorkspaceCalendarWidget(enabled: boolean, isConnected: boolean) {
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState("");
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

  return {
    events,
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
    handleCreateEvent,
    formatEventTime,
  };
}

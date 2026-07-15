"use client";

import React, { useEffect, useState, useCallback } from "react";
import { HiOutlineCalendar, HiOutlineArrowPath, HiPlus, HiOutlineArrowTopRightOnSquare, HiXMark } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  getRecentCalendarEventsAction,
  generateCalendarEventAction,
} from "@/lib/domain/actions/google_workspace_auth.actions";
import type { CalendarEventSummary } from "@/lib/entities/google_workspace_auth.type";

interface Props {
  enabled: boolean;
  isConnected: boolean;
}

export function WorkspaceCalendarWidget({ enabled, isConnected }: Props) {
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
      setError("Failed to load upcoming events.");
    } finally {
      setLoading(false);
    }
  }, [isConnected, enabled]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (!isConnected || !enabled) {
    return null;
  }

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

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-surface-container-low/50 p-4 shadow-sm transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <HiOutlineCalendar className="size-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface">Upcoming Agenda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={loadEvents}
            disabled={loading}
            className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors disabled:opacity-50"
            title="Refresh events"
          >
            <HiOutlineArrowPath className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              setStartDate(today);
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium transition-colors"
          >
            <HiPlus className="size-3" />
            <span>Quick Add</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-error/10 p-2.5 text-[11px] text-error">
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleCreateEvent} className="mt-3 p-3 rounded-lg bg-surface-container/60 border border-border/60 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">New Calendar Event</span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <HiXMark className="size-4" />
            </button>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Event Title</label>
            <Input
              placeholder="e.g. AI Strategy Sync"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[11px] font-medium text-on-surface-variant mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 text-[11px] font-medium text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !summary.trim() || !startDate}
              className="text-xs px-3 py-1"
            >
              {submitting ? "Adding..." : "Save Event"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
        {loading && events.length === 0 ? (
          <div className="py-6 text-center text-xs text-on-surface-variant/70">
            Fetching upcoming events...
          </div>
        ) : events.length === 0 ? (
          <div className="py-6 text-center text-xs text-on-surface-variant/70">
            No upcoming agenda events found.
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="group flex items-center justify-between rounded-lg bg-surface-container/40 p-2.5 hover:bg-surface-container/80 transition-colors border border-transparent hover:border-border/60"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="truncate text-xs font-medium text-on-surface group-hover:text-primary transition-colors">
                  {evt.summary}
                </div>
                <div className="mt-0.5 text-[10px] text-on-surface-variant/80">
                  {formatEventTime(evt.start)} {evt.end ? `- ${formatEventTime(evt.end).split(",").pop()?.trim()}` : ""}
                </div>
              </div>
              {evt.htmlLink && (
                <a
                  href={evt.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-on-surface-variant opacity-60 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all shrink-0"
                  title="Open in Google Calendar"
                >
                  <HiOutlineArrowTopRightOnSquare className="size-3.5" />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

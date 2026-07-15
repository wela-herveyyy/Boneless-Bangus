"use client";

import React, { useState } from "react";
import { HiOutlineVideoCamera, HiPlus, HiOutlineClipboard, HiOutlineCheck, HiOutlineArrowTopRightOnSquare, HiXMark } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { generateMeetAction } from "@/lib/domain/actions/google_workspace_auth.actions";
import type { MeetSummary } from "@/lib/entities/google_workspace_auth.type";

interface Props {
  enabled: boolean;
  isConnected: boolean;
}

export function WorkspaceMeetWidget({ enabled, isConnected }: Props) {
  const [createdMeets, setCreatedMeets] = useState<MeetSummary[]>([]);
  const [loadingInstant, setLoadingInstant] = useState(false);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Schedule Form State
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("15:00");

  if (!isConnected || !enabled) {
    return null;
  }

  const handleInstantMeet = async () => {
    setLoadingInstant(true);
    setError(null);
    try {
      const res = await generateMeetAction({
        summary: `Instant AI Video Meet (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
      });

      if (res.ok) {
        setCreatedMeets((prev) => [res.data, ...prev]);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("Failed to generate instant meeting.");
    } finally {
      setLoadingInstant(false);
    }
  };

  const handleScheduleMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() || !startDate) return;

    setSubmittingSchedule(true);
    setError(null);
    try {
      const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      const endIso = new Date(`${startDate}T${endTime}:00`).toISOString();

      const res = await generateMeetAction({
        summary: summary.trim(),
        start: startIso,
        end: endIso,
      });

      if (res.ok) {
        setCreatedMeets((prev) => [res.data, ...prev]);
        setSummary("");
        setShowScheduleForm(false);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("Failed to schedule video meeting.");
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleCopyLink = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback if needed
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-surface-container-low/50 p-4 shadow-sm transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <HiOutlineVideoCamera className="size-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface">Video Conferences</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="px-2 py-1 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-[11px] font-medium transition-colors"
          >
            Schedule
          </button>
          <button
            type="button"
            onClick={handleInstantMeet}
            disabled={loadingInstant}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-on-primary hover:bg-primary/90 text-[11px] font-semibold transition-colors disabled:opacity-60 shadow-xs"
          >
            <HiPlus className="size-3" />
            <span>{loadingInstant ? "Creating..." : "Instant Meet"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-error/10 p-2.5 text-[11px] text-error">
          {error}
        </div>
      )}

      {showScheduleForm && (
        <form onSubmit={handleScheduleMeet} className="mt-3 p-3 rounded-lg bg-surface-container/60 border border-border/60 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">Schedule Google Meet</span>
            <button
              type="button"
              onClick={() => setShowScheduleForm(false)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <HiXMark className="size-4" />
            </button>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Meeting Title</label>
            <Input
              placeholder="e.g. Code Review & Architecture Sync"
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
              onClick={() => setShowScheduleForm(false)}
              className="px-2.5 py-1 text-[11px] font-medium text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={submittingSchedule || !summary.trim() || !startDate}
              className="text-xs px-3 py-1"
            >
              {submittingSchedule ? "Scheduling..." : "Create Meeting"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-3 space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {createdMeets.length === 0 ? (
          <div className="py-5 text-center text-xs text-on-surface-variant/70">
            Click <strong className="text-on-surface">Instant Meet</strong> or <strong className="text-on-surface">Schedule</strong> to generate a video conference link.
          </div>
        ) : (
          createdMeets.map((meet) => (
            <div
              key={meet.id}
              className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 transition-colors hover:border-primary/50 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-on-surface">
                  {meet.summary}
                </span>
                <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary">
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md bg-surface-container/80 px-2.5 py-1.5 border border-border/40">
                <span className="truncate font-mono text-[11px] text-primary">
                  {meet.hangoutLink.replace("https://", "")}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(meet.id, meet.hangoutLink)}
                    className="p-1 rounded text-on-surface-variant hover:bg-surface hover:text-primary transition-colors"
                    title="Copy Meet Link"
                  >
                    {copiedId === meet.id ? (
                      <HiOutlineCheck className="size-3.5 text-primary" />
                    ) : (
                      <HiOutlineClipboard className="size-3.5" />
                    )}
                  </button>
                  <a
                    href={meet.hangoutLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/25 transition-colors"
                  >
                    <span>Join</span>
                    <HiOutlineArrowTopRightOnSquare className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

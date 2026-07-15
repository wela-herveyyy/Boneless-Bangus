"use client";

import { useState } from "react";
import { generateMeetAction } from "@/lib/domain/actions/google_workspace_auth.actions";
import type { MeetSummary } from "@/lib/entities/google_workspace_auth.type";

export function useWorkspaceMeetWidget() {
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

  return {
    createdMeets,
    loadingInstant,
    submittingSchedule,
    error,
    showScheduleForm,
    setShowScheduleForm,
    copiedId,
    summary,
    setSummary,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    handleInstantMeet,
    handleScheduleMeet,
    handleCopyLink,
  };
}

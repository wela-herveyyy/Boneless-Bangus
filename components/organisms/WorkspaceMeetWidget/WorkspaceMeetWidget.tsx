"use client";

import React from "react";
import { HiOutlineVideoCamera, HiPlus, HiOutlineClipboard, HiOutlineCheck, HiOutlineArrowTopRightOnSquare, HiXMark } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { useWorkspaceMeetWidget } from "./workspaceMeetWidget.hooks";

interface Props {
  enabled: boolean;
  isConnected: boolean;
}

export function WorkspaceMeetWidget({ enabled, isConnected }: Props) {
  const {
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
  } = useWorkspaceMeetWidget();

  if (!isConnected || !enabled) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-primary/25 bg-surface-container-low/50 p-4 shadow-sm transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-primary/15">
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
        <form onSubmit={handleScheduleMeet} className="mt-3 p-3 rounded-lg bg-surface-container/60 border border-primary/25 space-y-3 animate-fade-in">
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
                className="w-full rounded-lg border border-primary/20 bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-lg border border-primary/20 bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[11px] font-medium text-on-surface-variant mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-lg border border-primary/20 bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
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
              <div className="flex items-center justify-between gap-2 rounded-md bg-surface-container/80 px-2.5 py-1.5 border border-primary/20">
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

"use client";

import React from "react";
import {
  HiOutlineCalendar,
  HiOutlineArrowPath,
  HiPlus,
  HiOutlineArrowTopRightOnSquare,
  HiXMark,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineSquares2X2,
  HiOutlineListBullet,
} from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { useWorkspaceCalendarWidget } from "./workspaceCalendarWidget.hooks";

interface Props {
  enabled: boolean;
  isConnected: boolean;
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function WorkspaceCalendarWidget({ enabled, isConnected }: Props) {
  const {
    events,
    filteredEvents,
    calendarDays,
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
  } = useWorkspaceCalendarWidget(enabled, isConnected);

  if (!isConnected || !enabled) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-surface-container-low/50 p-4 shadow-sm transition-all space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <HiOutlineCalendar className="size-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface">{monthYearLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Grid / Agenda Switcher */}
          <div className="flex items-center rounded-lg bg-surface-container/80 p-0.5 border border-border/40 mr-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={[
                "p-1 rounded-md text-xs transition-colors",
                viewMode === "grid" ? "bg-primary text-on-primary shadow-2xs" : "text-on-surface-variant hover:text-on-surface",
              ].join(" ")}
              title="Calendar Grid View"
            >
              <HiOutlineSquares2X2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={[
                "p-1 rounded-md text-xs transition-colors",
                viewMode === "agenda" ? "bg-primary text-on-primary shadow-2xs" : "text-on-surface-variant hover:text-on-surface",
              ].join(" ")}
              title="Agenda List View"
            >
              <HiOutlineListBullet className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={goToToday}
            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-surface-container hover:bg-surface border border-border/50 text-on-surface transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Previous month"
          >
            <HiChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Next month"
          >
            <HiChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={loadEvents}
            disabled={loading}
            className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors disabled:opacity-50 ml-0.5"
            title="Refresh events"
          >
            <HiOutlineArrowPath className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!showAddForm && selectedDate) {
                setStartDate(selectedDate);
              }
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium transition-colors ml-1"
          >
            <HiPlus className="size-3" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 p-2.5 text-[11px] text-error">
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleCreateEvent} className="p-3 rounded-lg bg-surface-container/60 border border-border/60 space-y-3 animate-fade-in">
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
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="addGoogleMeetCheck"
              checked={addGoogleMeet}
              onChange={(e) => setAddGoogleMeet(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary size-3.5"
            />
            <label htmlFor="addGoogleMeetCheck" className="text-[11px] text-on-surface-variant select-none cursor-pointer">
              Include Google Meet video link
            </label>
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

      {/* Actual Monthly Grid View */}
      {viewMode === "grid" && (
        <div className="space-y-2 pt-1 animate-fade-in">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="text-[10px] font-bold text-on-surface-variant/80 py-1 select-none">
                {day}
              </div>
            ))}
          </div>

          {/* 6x7 Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell) => {
              const isSelected = selectedDate === cell.dateStr;
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => handleSelectDay(cell.dateStr)}
                  className={[
                    "relative flex flex-col items-center justify-center h-8 rounded-lg text-xs font-medium transition-all select-none",
                    isSelected
                      ? "bg-primary text-on-primary font-bold shadow-xs scale-105 z-10"
                      : cell.isCurrentMonth
                      ? "bg-surface-container/40 text-on-surface hover:bg-surface-container hover:scale-[1.02]"
                      : "bg-surface-container/20 text-on-surface-variant/40 hover:bg-surface-container/40",
                    cell.isToday && !isSelected ? "ring-1 ring-primary/80 text-primary font-bold" : "",
                  ].join(" ")}
                >
                  <span>{cell.dayNumber}</span>
                  {/* Event Indicator Dot */}
                  {cell.hasEvents && (
                    <span
                      className={[
                        "absolute bottom-1 size-1.5 rounded-full",
                        isSelected ? "bg-white" : "bg-primary",
                      ].join(" ")}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-semibold text-on-surface-variant">
            {selectedDate
              ? `Events for ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "Upcoming Agenda"}
          </span>
          {selectedDate && (
            <button
              type="button"
              onClick={() => handleSelectDay(selectedDate)}
              className="text-[10px] text-primary hover:underline font-medium"
            >
              Show all ({events.length})
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {loading && events.length === 0 ? (
            <div className="py-5 text-center text-xs text-on-surface-variant/70">
              Checking calendar events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-5 text-center text-xs text-on-surface-variant/70">
              {selectedDate ? "No agenda events for this date." : "No upcoming agenda events found."}
            </div>
          ) : (
            filteredEvents.map((evt) => (
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
    </div>
  );
}

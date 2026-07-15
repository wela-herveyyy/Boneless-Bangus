"use client";

import React from "react";
import { HiOutlineCalendar, HiOutlineEnvelope } from "react-icons/hi2";
import type { WorkspaceCapability } from "@/lib/entities/google_workspace_auth.type";

interface WorkspaceCapabilityCardProps {
  capability: WorkspaceCapability;
  title: string;
  description: string;
  enabled: boolean;
  isConnected: boolean;
  isToggling: boolean;
  onToggle: (capability: WorkspaceCapability, enabled: boolean) => void;
}

export function WorkspaceCapabilityCard({
  capability,
  title,
  description,
  enabled,
  isConnected,
  isToggling,
  onToggle,
}: WorkspaceCapabilityCardProps) {
  const Icon = capability === "calendar" ? HiOutlineCalendar : HiOutlineEnvelope;

  return (
    <div
      className={[
        "flex flex-col gap-3 rounded-lg border p-4 transition-all",
        isConnected
          ? enabled
            ? "border-primary/40 bg-surface-container/60 shadow-sm"
            : "border-border/50 bg-surface-container-low/40 opacity-75"
          : "border-border/30 bg-surface-container-low/20 opacity-50",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={[
              "flex h-9 w-9 items-center justify-center rounded-md text-lg",
              isConnected && enabled ? "bg-primary/10 text-primary" : "bg-surface-variant/40 text-on-surface-variant",
            ].join(" ")}
          >
            <Icon />
          </div>
          <div>
            <h4 className="text-sm font-medium text-on-surface">{title}</h4>
            <span className="text-[11px] text-on-surface-variant/80">
              {isConnected ? (enabled ? "Active" : "Disabled") : "Not Connected"}
            </span>
          </div>
        </div>

        {isConnected && (
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={enabled}
              disabled={isToggling || !isConnected}
              onChange={(e) => onToggle(capability, e.target.checked)}
            />
            <div className="peer h-5 w-9 rounded-full bg-surface-variant after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
          </label>
        )}
      </div>

      <p className="text-xs leading-relaxed text-on-surface-variant">{description}</p>
    </div>
  );
}

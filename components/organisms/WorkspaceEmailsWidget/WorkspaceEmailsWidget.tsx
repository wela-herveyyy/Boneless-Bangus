"use client";

import React from "react";
import { HiOutlineEnvelope, HiOutlineArrowPath, HiPlus, HiXMark } from "react-icons/hi2";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { useWorkspaceEmailsWidget } from "./workspaceEmailsWidget.hooks";

interface Props {
  enabled: boolean;
  isConnected: boolean;
}

export function WorkspaceEmailsWidget({ enabled, isConnected }: Props) {
  const {
    emails,
    loading,
    error,
    showComposeForm,
    setShowComposeForm,
    submitting,
    successMsg,
    to,
    setTo,
    subject,
    setSubject,
    body,
    setBody,
    loadEmails,
    handleSendEmail,
    formatEmailDate,
    getSenderInitial,
    getSenderName,
  } = useWorkspaceEmailsWidget(enabled, isConnected);

  if (!isConnected || !enabled) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-primary/25 bg-surface-container-low/50 p-4 shadow-sm transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-primary/15">
        <div className="flex items-center gap-2">
          <HiOutlineEnvelope className="size-4 text-primary" />
          <span className="text-xs font-semibold text-on-surface">Recent Emails</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => loadEmails(true)}
            disabled={loading}
            className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors disabled:opacity-50"
            title="Refresh inbox"
          >
            <HiOutlineArrowPath className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowComposeForm(!showComposeForm)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium transition-colors"
          >
            <HiPlus className="size-3" />
            <span>Compose</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-error/10 border border-error/30 p-3 text-[11px] text-error space-y-2">
          <p className="font-medium leading-relaxed">{error}</p>
          {(error.includes("403") || error.includes("401") || error.includes("permission") || error.includes("Disconnect")) && (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/api/workspace/oauth/init";
              }}
              className="inline-flex items-center justify-center w-full gap-1.5 px-3 py-2 rounded-md bg-error text-on-error font-semibold hover:opacity-90 transition-opacity shadow-xs text-xs"
            >
              <span>Re-Connect Google to Grant Read Access →</span>
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="mt-3 rounded-lg bg-primary/10 p-2.5 text-[11px] text-primary">
          {successMsg}
        </div>
      )}

      {showComposeForm && (
        <form onSubmit={handleSendEmail} className="mt-3 p-3 rounded-lg bg-surface-container/60 border border-primary/25 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">Quick Compose</span>
            <button
              type="button"
              onClick={() => setShowComposeForm(false)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <HiXMark className="size-4" />
            </button>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-on-surface-variant mb-1">To (Email Address)</label>
            <Input
              placeholder="colleague@example.com"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Subject</label>
            <Input
              placeholder="Meeting follow-up"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-on-surface-variant mb-1">Message Body</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              placeholder="Hi there, checking in on..."
              className="w-full rounded-lg border border-primary/20 bg-surface-container-lowest p-2.5 text-xs text-on-surface focus:border-primary focus:outline-none custom-scrollbar"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowComposeForm(false)}
              className="px-2.5 py-1 text-[11px] font-medium text-on-surface-variant hover:text-on-surface"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !to.trim() || !subject.trim() || !body.trim()}
              className="text-xs px-3 py-1"
            >
              {submitting ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
        {loading && emails.length === 0 ? (
          <div className="py-6 text-center text-xs text-on-surface-variant/70">
            Checking recent emails...
          </div>
        ) : emails.length === 0 ? (
          <div className="py-6 text-center text-xs text-on-surface-variant/70">
            No recent email messages found.
          </div>
        ) : (
          emails.map((msg) => (
            <div
              key={msg.id}
              className="group flex flex-col rounded-lg bg-surface-container/40 p-2.5 hover:bg-surface-container/80 transition-colors border border-transparent hover:border-primary/25"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {getSenderInitial(msg.from)}
                  </div>
                  <span className="truncate text-xs font-semibold text-on-surface">
                    {getSenderName(msg.from)}
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant/70 shrink-0">
                  {formatEmailDate(msg.date)}
                </span>
              </div>
              <div className="mt-1 truncate text-[11px] font-medium text-on-surface/90">
                {msg.subject}
              </div>
              {msg.snippet && (
                <div className="mt-0.5 line-clamp-1 text-[10px] text-on-surface-variant/80">
                  {msg.snippet}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

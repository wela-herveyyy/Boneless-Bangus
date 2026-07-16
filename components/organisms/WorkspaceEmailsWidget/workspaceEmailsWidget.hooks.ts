"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getRecentEmailsAction,
  generateEmailAction,
} from "@/lib/domain/actions/google_workspace_auth.actions";
import type { EmailMessageSummary } from "@/lib/entities/google_workspace_auth.type";

export function useWorkspaceEmailsWidget(enabled: boolean, isConnected: boolean) {
  const [emails, setEmails] = useState<EmailMessageSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const loadEmails = useCallback(async () => {
    if (!isConnected || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getRecentEmailsAction();
      if (res.ok) {
        setEmails(res.data);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("Failed to load recent emails.");
    } finally {
      setLoading(false);
    }
  }, [isConnected, enabled]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await generateEmailAction({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
      });

      if (res.ok) {
        setSuccessMsg("Email sent successfully!");
        setTo("");
        setSubject("");
        setBody("");
        setShowComposeForm(false);
        await loadEmails();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError("Failed to send quick email.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatEmailDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split(" ")[0] || dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getSenderInitial = (from: string) => {
    if (!from) return "?";
    const clean = from.replace(/<.*>/, "").trim();
    return clean[0]?.toUpperCase() || "?";
  };

  const getSenderName = (from: string) => {
    if (!from) return "Unknown";
    const clean = from.replace(/<.*>/, "").replace(/["']/g, "").trim();
    return clean || from;
  };

  return {
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
  };
}

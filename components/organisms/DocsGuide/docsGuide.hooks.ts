"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { DocsDoc, DocsDocId, DocsSection } from "@/lib/entities/docs.type";

export type DocsSearchHit = DocsSection & {
  docId: DocsDocId;
  docTitle: string;
};

export function useDocsGuide(docs: DocsDoc[]) {
  const [activeDocId, setActiveDocId] = useState<DocsDocId>(docs[0]?.id ?? "features");
  const [query, setQuery] = useState("");
  const [navInView, setNavInView] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollBehavior = previous;
    };
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNavInView(entry.isIntersecting),
      { rootMargin: "-8px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (navInView) setNavOpen(false);
  }, [navInView]);

  const activeDoc = useMemo(
    () => docs.find((doc) => doc.id === activeDocId) ?? docs[0],
    [activeDocId, docs],
  );

  const globalHits = useMemo(() => {
    if (!hasQuery) return [] as DocsSearchHit[];
    const hits: DocsSearchHit[] = [];
    for (const doc of docs) {
      for (const section of doc.sections) {
        const haystack = `${section.title}\n${section.content}`.toLowerCase();
        if (haystack.includes(normalizedQuery)) {
          hits.push({
            ...section,
            id: `${doc.id}-${section.id}`,
            docId: doc.id,
            docTitle: doc.shortTitle,
          });
        }
      }
    }
    return hits;
  }, [docs, hasQuery, normalizedQuery]);

  const filteredSections = useMemo(() => {
    if (!activeDoc) return [] as DocsSection[];
    if (!hasQuery) return activeDoc.sections;
    return activeDoc.sections.filter((section) => {
      const haystack = `${section.title}\n${section.content}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeDoc, hasQuery, normalizedQuery]);

  const matchCount = hasQuery ? globalHits.length : (activeDoc?.sections.length ?? 0);
  const totalCount = useMemo(
    () => docs.reduce((sum, doc) => sum + doc.sections.length, 0),
    [docs],
  );

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setNavOpen(false);
  }

  return {
    activeDoc,
    activeDocId,
    setActiveDocId,
    query,
    setQuery,
    filteredSections,
    globalHits,
    matchCount,
    totalCount,
    hasQuery,
    scrollToSection,
    navRef,
    navInView,
    navOpen,
    setNavOpen,
  };
}

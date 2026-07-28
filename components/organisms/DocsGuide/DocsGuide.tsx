"use client";

import Link from "next/link";
import { LuBookOpen, LuFishSymbol, LuList, LuSearch, LuX } from "react-icons/lu";
import { ChatMarkdown } from "@/components/atoms/ChatMarkdown/ChatMarkdown";
import { StatusOrb } from "@/components/atoms/StatusOrb/StatusOrb";
import { FuturisticBackdrop } from "@/components/molecules/FuturisticBackdrop/FuturisticBackdrop";
import type { DocsDoc } from "@/lib/entities/docs.type";
import { useDocsGuide } from "./docsGuide.hooks";

type DocsGuideProps = {
  docs: DocsDoc[];
};

export function DocsGuide({ docs }: DocsGuideProps) {
  const {
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
  } = useDocsGuide(docs);

  if (!activeDoc) {
    return null;
  }

  const showGlobalResults = hasQuery;
  const empty = showGlobalResults ? globalHits.length === 0 : filteredSections.length === 0;
  const showFloatingNav = !navInView || navOpen;

  const tocLinks = showGlobalResults ? (
    globalHits.map((hit) => (
      <a
        key={hit.id}
        href={`#${hit.id}`}
        onClick={(event) => {
          event.preventDefault();
          scrollToSection(hit.id);
        }}
        className="block rounded-lg px-2.5 py-2.5 leading-snug transition-colors hover:bg-surface-container-lowest"
      >
        <span className="block text-[0.65rem] font-medium uppercase tracking-wider text-secondary">
          {hit.docTitle}
        </span>
        <span className="block text-sm leading-relaxed text-on-surface-muted hover:text-primary">
          {hit.title}
        </span>
      </a>
    ))
  ) : (
    filteredSections.map((section) => (
      <a
        key={section.id}
        href={`#${section.id}`}
        onClick={(event) => {
          event.preventDefault();
          scrollToSection(section.id);
        }}
        className="block rounded-lg px-2.5 py-2.5 text-sm leading-relaxed text-on-surface-muted transition-colors hover:bg-surface-container-lowest hover:text-primary"
      >
        {section.title}
      </a>
    ))
  );

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <FuturisticBackdrop />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-340 px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-2 lg:mb-8">
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-on-surface-muted transition-colors hover:text-primary"
            >
              ← Home
            </Link>
            <Link
              href="/landing"
              className="hidden text-sm text-on-surface-muted transition-colors hover:text-primary sm:inline"
            >
              Install app
            </Link>
            <Link
              href="/workspace"
              className="hidden text-sm text-on-surface-muted transition-colors hover:text-primary sm:inline"
            >
              Workspace
            </Link>
          </div>
          <StatusOrb label="Product docs" variant="neutral" />
        </header>

        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-container-low text-primary">
              <LuFishSymbol className="size-7" aria-hidden />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-primary">BBAI</p>
              <p className="text-sm text-on-surface-muted">Documentation</p>
            </div>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-on-surface sm:text-4xl">
            How BBAI works
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-on-surface-muted">
            Start with app features, then quick start and architecture. Search and section nav stay
            with you as you scroll.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            ref={navRef}
            id="docs-nav"
            className="sticky top-4 z-20 self-start lg:top-6"
          >
            <div className="flex max-h-[calc(100dvh-2rem)] flex-col rounded-2xl bg-surface-container-low/95 p-4 shadow-bloom backdrop-blur-md lg:max-h-[calc(100dvh-3rem)]">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <LuBookOpen className="size-4 shrink-0" aria-hidden />
                <p className="text-xs font-medium uppercase tracking-wider">
                  {showGlobalResults ? "Search results" : activeDoc.shortTitle}
                </p>
              </div>

              <label className="relative mb-3 block">
                <span className="sr-only">Search docs</span>
                <LuSearch
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-muted"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search docs…"
                  className="w-full rounded-xl bg-surface-container-lowest py-2.5 pl-9 pr-3 text-sm text-on-surface outline-none transition-shadow placeholder:text-on-surface-muted/70 focus:shadow-[0_0_0_2px_var(--color-primary)]"
                />
              </label>

              {!showGlobalResults ? (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {docs.map((doc) => {
                    const selected = doc.id === activeDocId;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setActiveDocId(doc.id)}
                        className={[
                          "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-high text-on-surface-muted hover:text-on-surface",
                        ].join(" ")}
                      >
                        {doc.shortTitle}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <p className="mb-2 text-xs leading-relaxed text-on-surface-muted">
                {showGlobalResults
                  ? `${matchCount} match${matchCount === 1 ? "" : "es"} of ${totalCount}`
                  : activeDoc.description}
              </p>

              <nav
                aria-label="On this page"
                className="bbai-scroll min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain py-1 pr-2"
              >
                {tocLinks}
                {empty ? (
                  <p className="px-2.5 py-2 text-sm text-on-surface-muted">No matching sections.</p>
                ) : null}
              </nav>
            </div>
          </aside>

          <main className="min-w-0 space-y-4">
            {!showGlobalResults ? (
              <div className="rounded-2xl bg-surface-container-low/70 px-5 py-4 backdrop-blur-sm sm:px-6">
                <h2 className="font-display text-xl font-semibold text-on-surface">{activeDoc.title}</h2>
                <p className="mt-1 text-sm text-on-surface-muted">{activeDoc.description}</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-container-low/70 px-5 py-4 backdrop-blur-sm sm:px-6">
                <h2 className="font-display text-xl font-semibold text-on-surface">Search results</h2>
                <p className="mt-1 text-sm text-on-surface-muted">
                  Showing sections that mention “{query.trim()}”.
                </p>
              </div>
            )}

            {empty ? (
              <div className="rounded-2xl bg-surface-container-lowest px-6 py-10 text-center">
                <p className="font-display text-lg font-semibold text-on-surface">No results</p>
                <p className="mt-2 text-sm text-on-surface-muted">
                  Try another keyword, or clear the search to browse by guide.
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-4 rounded-xl bg-surface-container-high px-4 py-2 text-sm font-medium text-primary transition-transform active:scale-[0.98]"
                >
                  Clear search
                </button>
              </div>
            ) : showGlobalResults ? (
              globalHits.map((hit) => (
                <section
                  key={hit.id}
                  id={hit.id}
                  className="scroll-mt-8 rounded-2xl bg-surface-container-lowest px-5 py-5 sm:px-6 sm:py-6"
                >
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-secondary">
                    {hit.docTitle}
                  </p>
                  <ChatMarkdown content={hit.content} />
                </section>
              ))
            ) : (
              filteredSections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-8 rounded-2xl bg-surface-container-lowest px-5 py-5 sm:px-6 sm:py-6"
                >
                  <ChatMarkdown content={section.content} />
                </section>
              ))
            )}
          </main>
        </div>

        <footer className="mt-10 pb-4 text-center text-xs text-on-surface-muted">
          Boneless Bangus AI · BBAI · Livro Systems Inc.
        </footer>
      </div>

      {showFloatingNav ? (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
          {navOpen ? (
            <div className="glass-panel flex max-h-[60dvh] w-[min(20rem,calc(100vw-2.5rem))] flex-col rounded-2xl p-3 shadow-bloom">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Contents</p>
                <button
                  type="button"
                  onClick={() => setNavOpen(false)}
                  className="rounded-lg bg-surface-container-lowest p-1.5 text-on-surface-muted transition-colors hover:text-on-surface"
                  aria-label="Close contents"
                >
                  <LuX className="size-4" />
                </button>
              </div>
              <nav
                aria-label="Floating contents"
                className="bbai-scroll min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain"
              >
                {tocLinks}
              </nav>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => (navOpen ? setNavOpen(false) : setNavOpen(true))}
            className="btn-primary-gradient flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-on-primary shadow-bloom transition-transform active:scale-[0.98]"
            aria-expanded={navOpen}
            aria-controls="docs-nav"
          >
            {navOpen ? <LuX className="size-4" /> : <LuList className="size-4" />}
            {navOpen ? "Close" : "Contents"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

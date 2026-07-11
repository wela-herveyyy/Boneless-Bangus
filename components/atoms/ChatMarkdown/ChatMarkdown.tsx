"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMarkdownProps = {
  content: string;
  className?: string;
};

/** Renders assistant Markdown with chat-friendly typography (GFM tables/lists). */
export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div className={["chat-md text-sm leading-relaxed text-on-surface", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
          h1: ({ children }) => (
            <h1 className="mb-2 mt-3 font-display text-lg font-semibold first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-3 font-display text-base font-semibold first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-2 text-sm font-semibold first:mt-0">{children}</h3>
          ),
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 rounded-r-lg bg-surface-container-low py-1 pl-3 pr-2 text-on-surface-muted last:mb-0">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children }) => {
            const isBlock = Boolean(codeClassName);
            if (isBlock) {
              return (
                <code className="block overflow-x-auto font-mono text-xs leading-relaxed text-on-surface">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-md bg-surface-container-low px-1.5 py-0.5 font-mono text-[0.8em]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto rounded-xl bg-surface-container-low p-3 last:mb-0">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto last:mb-0">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-container-low">{children}</thead>,
          th: ({ children }) => (
            <th className="px-2 py-1.5 font-semibold text-on-surface">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1.5 text-on-surface-muted">{children}</td>
          ),
          hr: () => <hr className="my-3 border-0 bg-surface-container-high h-px" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

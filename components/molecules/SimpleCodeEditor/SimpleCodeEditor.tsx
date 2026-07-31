"use client";

import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markdown";

export type SimpleCodeLanguage = "markup" | "css" | "javascript" | "markdown" | "plain";

/** Map Output Source field keys → Prism language. */
export function languageForSourceField(fieldKey: string): SimpleCodeLanguage {
  switch (fieldKey) {
    case "html":
    case "main_section_html":
      return "markup";
    case "css":
    case "custom_css":
      return "css";
    case "javascript":
    case "client_script":
      return "javascript";
    case "main_section_md":
      return "markdown";
    default:
      return "plain";
  }
}

function escapeHtml(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightCode(code: string, language: SimpleCodeLanguage): string {
  if (language === "plain" || !languages[language]) {
    return escapeHtml(code);
  }
  try {
    return highlight(code, languages[language], language);
  } catch {
    return escapeHtml(code);
  }
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  language?: SimpleCodeLanguage;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  disabled?: boolean;
};

export function SimpleCodeEditor({
  value,
  onChange,
  language = "plain",
  placeholder,
  "aria-label": ariaLabel,
  className,
  disabled,
}: Props) {
  return (
    <div
      className={[
        "bbai-simple-code-editor bbai-scroll min-h-0 flex-1 overflow-auto bg-surface",
        className ?? "",
      ].join(" ")}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code) => highlightCode(code, language)}
        padding={16}
        textareaId="bbai-output-source-editor"
        textareaClassName="bbai-simple-code-editor__textarea"
        preClassName="bbai-simple-code-editor__pre"
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        tabSize={2}
        insertSpaces
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: 12,
          lineHeight: "1.55",
          minHeight: "100%",
          outline: "none",
        }}
      />
    </div>
  );
}

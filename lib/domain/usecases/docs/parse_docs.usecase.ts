import type { DocsSection } from "@/lib/entities/docs.type";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Split markdown into searchable sections on `##` headings. */
export function parseMarkdownSections(markdown: string): DocsSection[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections: DocsSection[] = [];
  let title = "Overview";
  let buffer: string[] = [];
  const usedIds = new Set<string>();

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (!content) return;
    let id = slugify(title) || "section";
    let n = 2;
    while (usedIds.has(id)) {
      id = `${slugify(title)}-${n}`;
      n += 1;
    }
    usedIds.add(id);
    sections.push({ id, title, content });
  };

  for (const line of lines) {
    const match = /^##\s+(.+)$/.exec(line);
    if (match) {
      flush();
      title = match[1].replace(/[*_`]/g, "").trim();
      buffer = [line];
      continue;
    }
    buffer.push(line);
  }
  flush();

  return sections;
}

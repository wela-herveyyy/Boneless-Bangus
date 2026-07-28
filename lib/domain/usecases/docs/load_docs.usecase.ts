import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DocsDoc } from "@/lib/entities/docs.type";
import { parseMarkdownSections } from "./parse_docs.usecase";

const DOC_SOURCES = [
  {
    id: "features" as const,
    file: "FEATURES.md",
    title: "App features",
    shortTitle: "Features",
    description: "What you can do in Boneless Bangus AI — workspace, skills, tools, and admin.",
  },
  {
    id: "readme" as const,
    file: "README.md",
    title: "About & quick start",
    shortTitle: "About",
    description: "Product overview, local setup, and how code is organized in this template.",
  },
  {
    id: "architecture" as const,
    file: "ARCHITECTURE.md",
    title: "Architecture",
    shortTitle: "Architecture",
    description: "Stack, domain layers, auth, PWA, and workflows for extending the app.",
  },
] as const;

export async function loadDocs(): Promise<DocsDoc[]> {
  const root = process.cwd();

  return Promise.all(
    DOC_SOURCES.map(async (source) => {
      const markdown = await readFile(path.join(root, source.file), "utf8");
      return {
        id: source.id,
        title: source.title,
        shortTitle: source.shortTitle,
        description: source.description,
        sections: parseMarkdownSections(markdown),
      };
    }),
  );
}

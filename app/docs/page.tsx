import type { Metadata } from "next";
import { DocsGuide } from "@/components/organisms/DocsGuide/DocsGuide";
import { loadDocs } from "@/lib/domain/usecases/docs/load_docs.usecase";

export const metadata: Metadata = {
  title: "Docs | BBAI",
  description:
    "Boneless Bangus AI documentation — app features, quick start, and architecture.",
};

export default async function DocsPage() {
  const docs = await loadDocs();
  return <DocsGuide docs={docs} />;
}

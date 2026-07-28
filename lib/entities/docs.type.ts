export type DocsDocId = "features" | "readme" | "architecture";

export type DocsSection = {
  id: string;
  title: string;
  content: string;
};

export type DocsDoc = {
  id: DocsDocId;
  title: string;
  shortTitle: string;
  description: string;
  sections: DocsSection[];
};

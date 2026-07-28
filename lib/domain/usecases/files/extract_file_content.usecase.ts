// @ts-ignore – pdf-parse index.js triggers debug code in bundlers; use the lib directly
import pdfParse from "pdf-parse/lib/pdf-parse.js";
// @ts-ignore – mammoth ships its own types but they are not always resolved by tsc
import mammoth from "mammoth";
import XLSX from "xlsx";
// @ts-ignore – officeparser has no type declarations
import officeparser from "officeparser";

export type ExtractedFile =
  | { type: "text"; name: string; content: string }
  | { type: "image"; name: string; data: string; mimeType: string }
  | { type: "unsupported"; name: string };

/**
 * Extracts readable content from an uploaded file given its base64 data URL.
 *
 * Supported formats:
 *   - Images (image/*)  → returned as-is for native AI vision handling
 *   - PDF               → text extracted via pdf-parse
 *   - DOCX              → text extracted via mammoth
 *   - PPTX / PPT        → text extracted via officeparser
 *   - XLSX / XLS        → CSV representation via SheetJS
 *   - CSV               → decoded as UTF-8 text
 *   - TXT / text/*      → decoded as UTF-8 text
 *   - Other binary      → type: "unsupported" (silently skipped by callers)
 */
export async function extractFileContent(file: {
  name: string;
  mimeType: string;
  base64Data: string;
}): Promise<ExtractedFile> {
  const mime = file.mimeType.toLowerCase();
  // Strip the data URL prefix if present (e.g. "data:application/pdf;base64,...")
  const base64 = file.base64Data.includes(",")
    ? file.base64Data.split(",")[1]
    : file.base64Data;

  // ── Images ──────────────────────────────────────────────────────────────────
  if (mime.startsWith("image/")) {
    return { type: "image", name: file.name, data: base64, mimeType: mime };
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────
  if (mime === "application/pdf") {
    try {
      const buf = Buffer.from(base64, "base64");
      const parsed = await pdfParse(buf);
      return { type: "text", name: file.name, content: parsed.text };
    } catch (e) {
      console.warn(`[extractor] Failed to parse PDF "${file.name}":`, e);
      return { type: "unsupported", name: file.name };
    }
  }

  // ── DOCX ────────────────────────────────────────────────────────────────────
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  ) {
    try {
      const buf = Buffer.from(base64, "base64");
      const result = await mammoth.extractRawText({ buffer: buf });
      return { type: "text", name: file.name, content: result.value };
    } catch (e) {
      console.warn(`[extractor] Failed to parse DOCX "${file.name}":`, e);
      return { type: "unsupported", name: file.name };
    }
  }

  // ── PPTX / PPT ──────────────────────────────────────────────────────────────
  if (
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mime === "application/vnd.ms-powerpoint"
  ) {
    try {
      const buf = Buffer.from(base64, "base64");
      const ast = await officeparser.parseOffice(buf);
      const text = ast.toText();
      return { type: "text", name: file.name, content: text };
    } catch (e) {
      console.warn(`[extractor] Failed to parse PPTX "${file.name}":`, e);
      return { type: "unsupported", name: file.name };
    }
  }

  // ── XLSX / XLS / CSV ────────────────────────────────────────────────────────
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel" ||
    mime === "text/csv" ||
    mime === "application/csv"
  ) {
    try {
      const buf = Buffer.from(base64, "base64");
      const workbook = XLSX.read(buf, { type: "buffer" });
      const sheets = workbook.SheetNames.map((sheetName) => {
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        return `### Sheet: ${sheetName}\n${csv}`;
      });
      return { type: "text", name: file.name, content: sheets.join("\n\n") };
    } catch (e) {
      console.warn(`[extractor] Failed to parse spreadsheet "${file.name}":`, e);
      return { type: "unsupported", name: file.name };
    }
  }

  // ── Plain text (txt, md, json, etc.) ────────────────────────────────────────
  if (mime.startsWith("text/") || mime === "application/json") {
    try {
      const text = Buffer.from(base64, "base64").toString("utf-8");
      // Reject binary-looking content (null bytes indicate binary)
      if (!text.includes("\u0000")) {
        return { type: "text", name: file.name, content: text };
      }
    } catch {
      // fall through to unsupported
    }
  }

  return { type: "unsupported", name: file.name };
}

/**
 * Processes a list of uploaded files and returns:
 *  - textParts: extracted text content ready to be injected into a prompt
 *  - images:    raw image payloads for native AI vision APIs
 */
export async function processUploadedFiles(
  files: { name: string; mimeType: string; base64Data: string }[]
): Promise<{
  textParts: string[];
  images: { name: string; data: string; mimeType: string }[];
}> {
  const results = await Promise.all(files.map(extractFileContent));

  const textParts: string[] = [];
  const images: { name: string; data: string; mimeType: string }[] = [];

  for (const r of results) {
    if (r.type === "text") {
      textParts.push(
        `The user has uploaded a file named "${r.name}". Here is the extracted content:\n\n<file_content filename="${r.name}">\n${r.content}\n</file_content>`
      );
    } else if (r.type === "image") {
      images.push({ name: r.name, data: r.data, mimeType: r.mimeType });
    }
    // "unsupported" → silently skip
  }

  return { textParts, images };
}

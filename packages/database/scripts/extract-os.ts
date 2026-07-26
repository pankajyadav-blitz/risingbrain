/**
 * One-off content extractor for the Operating Systems interview PDF
 * (OSAryanWithDiagram.pdf). Writes seed/domain-os.json + the figures under
 * apps/web/public/study-notes/os/. All parsing lives in qa-pdf-extractor.ts.
 *
 * Run once (or whenever the PDF changes):
 *   bun run packages/database/scripts/extract-os.ts   (or: bun run db:extract-os)
 */
import { extractQaPdf } from "./qa-pdf-extractor";

extractQaPdf({
  subject: "OS",
  pdfFile: "OSAryanWithDiagram.pdf",
  key: "os",
  expectedTopics: 36, // Chapters 1–5, Q1–Q36
});

/**
 * One-off content extractor for the Computer Networks interview PDF
 * (cnKeshavWithDiagram.pdf). Writes seed/domain-cn.json + the figures under
 * apps/web/public/study-notes/cn/. All parsing lives in qa-pdf-extractor.ts.
 *
 * Run once (or whenever the PDF changes):
 *   bun run packages/database/scripts/extract-cn.ts   (or: bun run db:extract-cn)
 */
import { extractQaPdf } from "./qa-pdf-extractor";

extractQaPdf({
  subject: "CN",
  pdfFile: "cnKeshavWithDiagram.pdf",
  key: "cn",
  expectedTopics: 50, // Chapters 1–8, Q1–Q50
});

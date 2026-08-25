/**
 * Zod payload schemas for the ADMIN content editor — shared by the client forms
 * and the `/api/admin/*` route handlers so both validate identically (mirrors
 * `lib/auth/validation.ts`). Slugs are NOT accepted from the client; routes
 * derive them from the name/title via `slugify` and let the DB unique
 * constraints enforce collisions.
 *
 * Enums come from the pure `@risingbrain/database/enums` so this file is safe to
 * import from client components too.
 */
import { z } from "zod";
import { Difficulty, DomainSubject, QuizKind, Role } from "@risingbrain/database/enums";

/** Trim a string; treat "" as "not provided" for optional fields. */
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().optional(),
);

const requiredText = z.string().trim().min(1, "Required");
const orderField = z.coerce.number().int().min(0).optional();
const id = z.string().min(1);

// ---------------------------------------------------------------------------
// Sheets (DSA): DsaSheet → DsaTopic → DsaPattern → DsaProblem + Company
// ---------------------------------------------------------------------------

export const dsaSheetCreate = z.object({
  name: requiredText,
  description: optionalText,
  order: orderField,
  isPublished: z.boolean().optional(),
});
export const dsaSheetUpdate = dsaSheetCreate.partial().extend({ id });

export const dsaTopicCreate = z.object({
  sheetId: id,
  name: requiredText,
  description: optionalText,
  order: orderField,
});
export const dsaTopicUpdate = dsaTopicCreate.omit({ sheetId: true }).partial().extend({ id });

export const dsaPatternCreate = z.object({
  topicId: id,
  name: requiredText,
  strategy: optionalText,
  identification: optionalText,
  order: orderField,
});
export const dsaPatternUpdate = dsaPatternCreate.omit({ topicId: true }).partial().extend({ id });

export const dsaProblemCreate = z.object({
  patternId: id,
  title: requiredText,
  reference: optionalText,
  difficulty: z.nativeEnum(Difficulty).optional(),
  leetcodeUrl: optionalText,
  gfgUrl: optionalText,
  youtubeUrl: optionalText,
  order: orderField,
  companyIds: z.array(z.string()).optional(),
});
export const dsaProblemUpdate = dsaProblemCreate.omit({ patternId: true }).partial().extend({ id });

export const companyCreate = z.object({
  name: requiredText,
  logoUrl: optionalText,
});
export const companyUpdate = companyCreate.partial().extend({ id });

// ---------------------------------------------------------------------------
// Domain: unified DomainTopic
// ---------------------------------------------------------------------------

export const domainTopicCreate = z.object({
  subject: z.nativeEnum(DomainSubject),
  title: requiredText,
  groupLabel: requiredText,
  groupOrder: orderField,
  summary: optionalText,
  notes: requiredText, // markdown body — required by the model
  order: orderField,
  isPublished: z.boolean().optional(),
});
export const domainTopicUpdate = domainTopicCreate.partial().extend({ id });

// ---------------------------------------------------------------------------
// Screening: QuizCategory → QuizTopic → QuizQuestion
// ---------------------------------------------------------------------------

export const quizCategoryCreate = z.object({
  kind: z.nativeEnum(QuizKind),
  name: requiredText,
  order: orderField,
});
export const quizCategoryUpdate = quizCategoryCreate.partial().extend({ id });

export const quizTopicCreate = z.object({
  categoryId: id,
  name: requiredText,
  theory: optionalText,
  formula: optionalText,
  order: orderField,
});
export const quizTopicUpdate = quizTopicCreate.omit({ categoryId: true }).partial().extend({ id });

const quizOption = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
});

/** The MCQ payload: options must be distinct keys and answerKey must be one. */
const quizQuestionBody = {
  prompt: requiredText,
  options: z.array(quizOption).min(2, "At least two options").max(8),
  answerKey: requiredText,
  explanation: optionalText,
  hint: optionalText,
  difficulty: z.nativeEnum(Difficulty).optional(),
  order: orderField,
};

const uniqueKeys = (d: { options: { key: string }[] }) =>
  new Set(d.options.map((o) => o.key)).size === d.options.length;
const answerIsAnOption = (d: { options: { key: string }[]; answerKey: string }) =>
  d.options.some((o) => o.key === d.answerKey);

export const quizQuestionCreate = z
  .object({ topicId: id, ...quizQuestionBody })
  .refine(uniqueKeys, { message: "Option keys must be unique", path: ["options"] })
  .refine(answerIsAnOption, { message: "Answer key must match an option", path: ["answerKey"] });

export const quizQuestionUpdate = z
  .object({ id, ...quizQuestionBody })
  .refine(uniqueKeys, { message: "Option keys must be unique", path: ["options"] })
  .refine(answerIsAnOption, { message: "Answer key must match an option", path: ["answerKey"] });

/** Delete-by-id payload, shared by every DELETE handler. */
export const idPayload = z.object({ id });

/** Admin user management: change role and/or disable an account. */
export const userUpdate = z
  .object({
    id,
    role: z.nativeEnum(Role).optional(),
    disabled: z.boolean().optional(),
  })
  .refine((d) => d.role !== undefined || d.disabled !== undefined, {
    message: "Nothing to update",
  });

/** Move a row up/down: swap `order` between two siblings of one `entity`. */
export const reorderPayload = z.object({
  entity: z.enum([
    "dsaSheet",
    "dsaTopic",
    "dsaPattern",
    "dsaProblem",
    "domainTopic",
    "quizCategory",
    "quizTopic",
    "quizQuestion",
  ]),
  aId: id,
  bId: id,
});

// Convenience inferred types for the client forms.
export type DsaSheetInput = z.infer<typeof dsaSheetCreate>;
export type DsaTopicInput = z.infer<typeof dsaTopicCreate>;
export type DsaPatternInput = z.infer<typeof dsaPatternCreate>;
export type DsaProblemInput = z.infer<typeof dsaProblemCreate>;
export type DomainTopicInput = z.infer<typeof domainTopicCreate>;
export type QuizCategoryInput = z.infer<typeof quizCategoryCreate>;
export type QuizTopicInput = z.infer<typeof quizTopicCreate>;
export type QuizQuestionInput = z.infer<typeof quizQuestionCreate>;

import { Boxes, Cpu, Database, Network, Shapes, type LucideIcon } from "lucide-react";
import type { DomainSubject } from "@risingbrain/database/enums";

/**
 * Presentation metadata for the Domain subjects (label / icon / blurb) — the
 * discriminating `DomainSubject` enum lives in the DB, this only decorates it.
 *
 * The set of subjects actually shown is DATA-DRIVEN: `getDomainIndex()` returns
 * only the subjects that have published topics, in this display order, so seeding
 * a new subject makes its tab appear (and with one subject the tab bar collapses
 * to a plain header). No `available` flag / placeholder tabs — if it's not in the
 * DB, it isn't rendered.
 */
export type DomainSubjectMeta = {
  subject: DomainSubject;
  /** Tab / header label. */
  label: string;
  /** One-line pitch shown under the subject header. */
  blurb: string;
  icon: LucideIcon;
};

export const SUBJECT_META: Record<DomainSubject, DomainSubjectMeta> = {
  OOPS: {
    subject: "OOPS",
    label: "OOP",
    blurb: "The four pillars, SOLID, and design questions that separate juniors from seniors.",
    icon: Shapes,
  },
  SQL: {
    subject: "SQL",
    label: "SQL",
    blurb: "Query patterns and the joins, windows and aggregates interviewers reach for.",
    icon: Database,
  },
  DBMS: {
    subject: "DBMS",
    label: "DBMS",
    blurb: "Transactions, normalization, indexing and concurrency — the DB internals interviewers probe.",
    icon: Boxes,
  },
  OS: {
    subject: "OS",
    label: "Operating Systems",
    blurb: "Processes, scheduling, memory, deadlocks and synchronization, explained for interviews.",
    icon: Cpu,
  },
  CN: {
    subject: "CN",
    label: "Computer Networks",
    blurb: "The OSI/TCP-IP stack, routing, and the protocols that come up in every SDE screen.",
    icon: Network,
  },
};

/** Display order for subjects that have content. */
export const SUBJECT_ORDER: DomainSubject[] = ["OOPS", "SQL", "DBMS", "OS", "CN"];

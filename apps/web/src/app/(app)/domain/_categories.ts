import { Boxes, Cpu, Database, Network, Shapes, type LucideIcon } from "lucide-react";

export type DomainCategoryKey = "sql" | "dbms" | "os" | "cn" | "oops";

export type DomainCategoryMeta = {
  key: DomainCategoryKey;
  /** Tab label. */
  label: string;
  /** One-line pitch shown on the coming-soon card. */
  blurb: string;
  icon: LucideIcon;
  /**
   * Whether a real content view is wired up for this section. `false` renders the
   * shared "coming soon" placeholder in the same shell. Flip to `true` and add a
   * branch in `domain-workspace.tsx` when the section (and its data) ships.
   */
  available: boolean;
};

/**
 * The Domain sections — core-CS subjects asked in interviews. This is the single
 * source of truth for the category tabs: add / reorder entries here, no migration
 * needed. Only SQL has real content today; the rest are placeholders.
 *
 * Kept as a code registry (not a DB table) on purpose — every section's content
 * model is different (SQL problems vs. DBMS theory vs. OS MCQs …), so there is no
 * single "domain content" table to drive. If categories ever need to be
 * admin-managed, swap this array for a cached DB query returning the same shape.
 */
export const DOMAIN_CATEGORIES: DomainCategoryMeta[] = [
  {
    key: "sql",
    label: "SQL",
    blurb: "Real SQL interview problems with the optimal approach and a clean, copy-ready query.",
    icon: Database,
    available: true,
  },
  {
    key: "dbms",
    label: "DBMS",
    blurb: "Transactions, normalization, indexing and concurrency — the DB internals interviewers probe.",
    icon: Boxes,
    available: false,
  },
  {
    key: "os",
    label: "Operating Systems",
    blurb: "Processes, scheduling, memory, deadlocks and synchronization, explained for interviews.",
    icon: Cpu,
    available: false,
  },
  {
    key: "cn",
    label: "Computer Networks",
    blurb: "The OSI/TCP-IP stack, routing, and the protocols that come up in every SDE screen.",
    icon: Network,
    available: false,
  },
  {
    key: "oops",
    label: "OOPS",
    blurb: "The four pillars, SOLID, and design questions that separate juniors from seniors.",
    icon: Shapes,
    available: false,
  },
];

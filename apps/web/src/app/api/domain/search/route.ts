import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWriteLimit } from "@/lib/auth/rate-limit";
import { SUBJECT_META } from "@/app/(app)/domain/_categories";

/**
 * Public server-side search for Domain topics. The `/domain` search box debounces
 * the query on the client and hits this endpoint — all matching/ranking happens
 * HERE (never in the browser), so the topic bodies never ship to the client just
 * to be searched. Matches topic titles and summaries case-insensitively across
 * every subject and returns lightweight suggestions.
 */
export async function GET(req: Request) {
  // Unauthenticated and DB-hitting: two unindexed `contains` scans per call, fired
  // per debounced keystroke. Without a limit, a loop here saturates the small
  // Postgres pool and takes every other page down with it.
  const limited = await checkWriteLimit(req);
  if (limited) return limited;

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const rows = await prisma.domainTopic.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ subject: "asc" }, { groupOrder: "asc" }, { order: "asc" }],
    select: { id: true, title: true, subject: true, groupLabel: true, summary: true },
    take: 24,
  });

  // Rank: title match beats summary-only; an earlier position in the title wins.
  const lower = q.toLowerCase();
  const rankOf = (title: string) => {
    const i = title.toLowerCase().indexOf(lower);
    return i === 0 ? 0 : i > 0 ? 1 : 2;
  };

  const results = rows
    .slice()
    .sort((a, b) => rankOf(a.title) - rankOf(b.title))
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      subjectLabel: SUBJECT_META[r.subject].label,
      groupLabel: r.groupLabel,
      summary: r.summary,
    }));

  return NextResponse.json({ results });
}

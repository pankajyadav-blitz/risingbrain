import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit } from "@/lib/auth/rate-limit";
import { parseExperiencePayload } from "./_payload";

/**
 * POST /api/interview
 *
 * Publishes a new interview experience authored by the current user. Auth is
 * required; anonymous callers get a 401. Returns the new experience `{ id }`.
 *
 * Editing and removing an existing one live in `[id]/route.ts`; validation is
 * shared via `_payload.ts` so the two paths enforce identical rules.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseExperiencePayload(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const created = await prisma.interviewExperience.create({
    data: { authorId: user.id, ...parsed.data, status: "PUBLISHED" },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}

-- Slug-based routing.
--
-- Public URLs used to carry cuids (/interview/<cuid>, /screening/<cuid>, ...).
-- This migration makes the slug the addressable key instead.
--
-- domain_topics is deliberately untouched: /domain/<subject>/<slug> is served by
-- the existing domain_topics_subject_slug_key composite, so the constraint that
-- already guards the data is the same one that resolves the route.

-- ---------------------------------------------------------------------------
-- quiz_topics: slug becomes globally unique
-- ---------------------------------------------------------------------------
-- /screening/<slug> and /puzzles/<slug> read from this one table, so a slug has
-- to identify a topic without its category. The (categoryId, slug) composite is
-- implied by a global unique, and nothing looked it up by categoryId_slug.
-- Prisma renders @@unique as a unique INDEX on Postgres, not a table
-- constraint, so this is DROP INDEX rather than DROP CONSTRAINT.
DROP INDEX "quiz_topics_categoryId_slug_key";
CREATE UNIQUE INDEX "quiz_topics_slug_key" ON "quiz_topics"("slug");

-- ---------------------------------------------------------------------------
-- interview_experiences: add slug, backfilled from title + a token
-- ---------------------------------------------------------------------------
-- Added nullable, backfilled, then constrained — the column has to hold a value
-- for every existing row before NOT NULL and the unique index can apply.
ALTER TABLE "interview_experiences" ADD COLUMN "slug" TEXT;

-- Must produce byte-identical output to slugifyTitle() in
-- apps/web/src/lib/slug.ts, which mints the slug for every row created after
-- this runs. The trailing token is the row's own id tail: deterministic, so
-- re-running this backfill is a no-op rather than a second set of slugs.
UPDATE "interview_experiences"
SET "slug" =
  COALESCE(
    NULLIF(
      regexp_replace(
        left(
          regexp_replace(
            regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g'),
            '^-+|-+$', '', 'g'
          ),
          60
        ),
        '-+$', ''
      ),
      ''
    ),
    'interview'
  )
  || '-' || right("id", 6)
WHERE "slug" IS NULL;

ALTER TABLE "interview_experiences" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "interview_experiences_slug_key" ON "interview_experiences"("slug");

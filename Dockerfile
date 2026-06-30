# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────────────────
# RisingBrain — production image.
#
# Multi-stage so the final image is tiny: we build with Bun, but ship only the
# Next.js *standalone* server (a self-contained bundle of the app + just the
# traced runtime deps) on a slim Node base. `public/` and `.next/static` are
# copied in explicitly (standalone doesn't include them) — when you move static
# assets to S3 later, drop the `public` COPY.
#
# No DATABASE_URL/secret is needed to BUILD: nothing connects at build time
# (every page is dynamic, Prisma only generates, Redis is lazy). The throwaway
# envs below just satisfy "required" env checks; the REAL values are supplied at
# RUNTIME by docker-compose.prod.yml and never bake into the image.
# ──────────────────────────────────────────────────────────────────────────────

# ---------- builder: install + generate Prisma client + build standalone --------
FROM oven/bun:1 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://neondb_owner:npg_qJDHrZLBu9N4@ep-holy-feather-atde6vmv-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=verify-full"
ENV AUTH_SECRET="IbueTy4mvrQm2jWmMYmjCbTY2eaGUEROk4Wa+hN+w8Z2erBDZnIbOcaDUfvxHcmw"
# Install with the FULL source present so Bun's workspace symlinks and .bin
# binstubs (prisma, next, …) resolve correctly. Copying node_modules across
# build stages breaks Bun's symlink layout — that's why `prisma`/`next` weren't
# found. Installing in-place mirrors the working local setup.
COPY . .
RUN bun install --frozen-lockfile

# Generate the Prisma 7 client (transpiled into the Next build). No DB contacted.
RUN cd packages/database && bun run db:generate

# Production standalone build (output: "standalone" in next.config.js).
ENV NODE_ENV=production
RUN cd apps/web && bun run build

# ---------- runner: minimal image with just the standalone server ---------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0


# Run as a non-root user.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone bundle (monorepo layout preserved: server.js lives at apps/web/).
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# Compiled client assets + public files (NOT included in the standalone bundle).
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

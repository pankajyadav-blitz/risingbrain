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
# envs below only satisfy the "required" env checks in src/lib/env.ts; the REAL
# values are supplied at RUNTIME by docker-compose.prod.yml.
#
# They are deliberately FAKE rather than copies of the production values. This is
# safe because the app reads these at runtime, not build time — worth stating
# because the usual Next.js gotcha (`process.env.*` inlined into the EDGE bundle,
# which has no runtime env) would make a build-time AUTH_SECRET permanent. It does
# not apply here: `src/proxy.ts` is a Next 16 proxy on the NODE runtime, and the
# built chunk still reads `process.env.AUTH_SECRET` at call time. Verify with:
#
#   grep -o 'process\.env\.AUTH_SECRET' .next/server/chunks/*root-of-the-server*.js
#
# If that ever comes back empty — a move to the edge runtime would do it — the
# build-time secret becomes the one the proxy verifies against forever, and any
# drift from the runtime secret rejects every token: every request looks signed
# out, bounces through /api/auth/refresh, and comes back still unverifiable.
# ──────────────────────────────────────────────────────────────────────────────

# ---------- builder: install + generate Prisma client + build standalone --------
FROM oven/bun:1 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Placeholders ONLY. `next build` evaluates src/lib/env.ts while collecting page
# data, and every `required()` there must resolve or the build dies. Nothing
# connects at build time, so these values are never used — the REAL ones arrive
# at runtime from docker-compose.prod.yml. Keep them obviously fake so a leaked
# image layer (`docker history`) never exposes a production credential.
#
# Every key that env.ts marks required in production needs a line here.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV AUTH_SECRET="BUILD_TIME_PLACEHOLDER_NOT_A_REAL_SECRET_xxxxxxxxxxxxxxxxxx"
ENV REDIS_URL="redis://127.0.0.1:6379"
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

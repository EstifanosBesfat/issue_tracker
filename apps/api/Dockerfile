# EthioTelecom Project Manager — NestJS API
# Build context MUST be the monorepo root.

# ─── 1) Install ALL deps (incl. @nestjs/cli) with package manifests ───────────
FROM node:22-alpine AS deps
WORKDIR /app
ENV NODE_ENV=development \
    NPM_CONFIG_PRODUCTION=false

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/

# Ignore scripts: prisma schema is not present yet
RUN npm ci \
  --workspace=@ethio/api \
  --workspace=@ethio/database \
  --include-workspace-root \
  --include=dev \
  --ignore-scripts

# ─── 2) Build: keep workspace node_modules, then overlay source ───────────────
FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=development \
    NPM_CONFIG_PRODUCTION=false

# Copy the full install tree first (root + nested workspace node_modules)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/package.json /app/package-lock.json ./
COPY --from=deps /app/apps/api/package.json ./apps/api/
COPY --from=deps /app/packages/database/package.json ./packages/database/

# Overlay source WITHOUT deleting workspace node_modules
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/src ./packages/database/src
COPY packages/database/tsconfig.json ./packages/database/
COPY packages/database/prisma.config.ts ./packages/database/
COPY apps/api/src ./apps/api/src
COPY apps/api/scripts ./apps/api/scripts
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/tsconfig.build.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

# Verify Nest CLI is present, then generate + build
RUN test -f apps/api/node_modules/@nestjs/cli/bin/nest.js \
  && npm run generate -w @ethio/database \
  && npm run build -w @ethio/database \
  && npm run build -w @ethio/api

# ─── 3) Production deps only (pruned) ─────────────────────────────────────────
FROM node:22-alpine AS prod-deps
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/prisma.config.ts ./packages/database/

RUN npm ci \
  --workspace=@ethio/api \
  --workspace=@ethio/database \
  --include-workspace-root \
  --omit=dev \
  --ignore-scripts \
  && npm run generate -w @ethio/database

# ─── 4) Runtime image ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/package.json /app/package-lock.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/package.json ./apps/api/
COPY --from=prod-deps /app/packages/database ./packages/database
# Nested workspace installs (if any) from prod-deps
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules

# Built artifacts only
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist

EXPOSE 4000
CMD ["sh", "-c", "npm run db:deploy && npm run start:prod -w @ethio/api"]

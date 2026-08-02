# EthioTelecom Project Manager — NestJS API
# Build context must be the monorepo root.

FROM node:22-alpine AS deps
WORKDIR /app
# Ensure devDependencies (and build tooling) are installed even if the
# platform sets NODE_ENV=production during image build.
ENV NODE_ENV=development
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
# Skip lifecycle scripts: prisma schema is not copied yet
RUN npm ci \
  --workspace=@ethio/api \
  --workspace=@ethio/database \
  --include-workspace-root \
  --ignore-scripts \
  --include=dev

FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/database ./packages/database
COPY apps/api ./apps/api
RUN npm run generate -w @ethio/database \
  && npm run build -w @ethio/database \
  && npm run build -w @ethio/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api ./apps/api
EXPOSE 4000
# Apply Prisma migrations against Neon, then start NestJS
CMD ["sh", "-c", "npm run db:deploy && npm run start:prod -w @ethio/api"]

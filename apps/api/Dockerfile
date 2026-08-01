# EthioTelecom Project Manager — NestJS API
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
RUN npm ci --workspace=@ethio/api --workspace=@ethio/database --include-workspace-root

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/database ./packages/database
COPY apps/api ./apps/api
RUN npm run generate -w @ethio/database \
  && npm run build -w @ethio/database \
  && npm run build -w @ethio/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api ./apps/api
EXPOSE 4000
CMD ["npm", "run", "start:prod", "-w", "@ethio/api"]

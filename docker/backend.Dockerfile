# syntax=docker/dockerfile:1.7
# Imagen del backend NestJS para MutualMetrics.
# Compatible con docker y podman.

# --- Etapa 1: build ---
FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install --workspaces --include-workspace-root

COPY packages/shared packages/shared
COPY apps/backend apps/backend

RUN npm --workspace @mutual-metrics/shared run build \
  && npm --workspace @mutual-metrics/backend run build

# --- Etapa 2: runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/apps/backend/dist ./dist
COPY --from=builder /repo/apps/backend/package.json ./package.json
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages/shared/dist ./node_modules/@mutual-metrics/shared/dist
COPY --from=builder /repo/packages/shared/package.json ./node_modules/@mutual-metrics/shared/package.json

EXPOSE 3000
CMD ["node", "dist/main.js"]

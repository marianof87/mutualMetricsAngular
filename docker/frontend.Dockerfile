# syntax=docker/dockerfile:1.7
# Imagen del frontend Angular (SPA, archivos estáticos servidos con nginx).
# Compatible con docker y podman.

# --- Etapa 1: build ---
FROM node:20-alpine AS builder
WORKDIR /repo

# 1) Manifests primero para cachear npm install
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

# 2) Código fuente
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend

# 3) Build de shared (el frontend lo consume) y después frontend.
#    El `ls` final falla fuerte si el build no produjo el browser bundle.
RUN npm --workspace @mutual-metrics/shared run build \
  && npm --workspace @mutual-metrics/frontend run build \
  && ls apps/frontend/dist/mutualMetrics/browser/index.html

# --- Etapa 2: runtime (nginx sirviendo archivos estáticos) ---
FROM nginx:1.27-alpine AS runner
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/frontend/dist/mutualMetrics/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

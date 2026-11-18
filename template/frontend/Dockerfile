FROM node:24-alpine AS base
WORKDIR /app

# Build: runs natively on the runner; the standalone output is JavaScript for any platform
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter frontend
COPY frontend ./frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter frontend build

# Runner: a user of its own, declared by its uid so Kubernetes can check runAsNonRoot
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --ingroup nodejs nextjs
COPY --from=build --chown=1001:1001 /app/frontend/.next/standalone ./
COPY --from=build --chown=1001:1001 /app/frontend/.next/static ./frontend/.next/static
USER 1001
EXPOSE 80
ENV PORT=80
ENV HOSTNAME="0.0.0.0"
CMD ["node", "frontend/server.js"]

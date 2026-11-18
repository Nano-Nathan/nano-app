FROM node:24-bookworm-slim
WORKDIR /app
RUN corepack enable

# Production dependencies of the backend only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --prod --filter backend

# Sources: Node runs the TypeScript as is
COPY backend ./backend
WORKDIR /app/backend
ENV NODE_ENV=production

# The node user of the image, by its uid: Kubernetes checks runAsNonRoot only with a number
USER 1000
EXPOSE 3000
CMD ["node", "src/app.ts"]

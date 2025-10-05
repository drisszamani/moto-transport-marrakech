######## Backend (NestJS) Dockerfile ########

# Stage 1: Install workspace deps from repo root
FROM node:20-bullseye AS deps
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
ENV HUSKY=0

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: Build backend
FROM node:20-bullseye AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/backend/package.json ./apps/backend/package.json
COPY apps/backend ./apps/backend

RUN pnpm --filter backend... build

# Stage 3: Runtime
FROM node:20-bullseye-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# Only prod deps for backend
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
ENV HUSKY=0
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile --prod --filter backend... --ignore-scripts

# Copy built files
COPY --from=build /repo/apps/backend/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD node -e "require('http').get('http://localhost:3000/health',()=>process.exit(0)).on('error',()=>process.exit(1))"
CMD ["node", "dist/main.js"]
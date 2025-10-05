######## Web app Dockerfile (Next.js standalone) ########

# Stage 1: Install workspace deps from repo root
FROM node:20-bullseye AS deps
WORKDIR /repo

# Use corepack pnpm
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

# Copy root manifests and workspace package.jsons for proper install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/*/package.json ./packages/*/
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

# Stage 2: Build only the web app
FROM node:20-bullseye AS builder
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

# Bring node_modules from deps layer
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages ./packages
COPY --from=deps /repo/apps/web/package.json ./apps/web/package.json

# Copy source code for the web app and shared packages
COPY apps/web ./apps/web
COPY packages ./packages

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter web... build

# Stage 3: Runtime image
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy built app from builder
COPY --from=builder /repo/apps/web/public ./public
RUN mkdir -p .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', r=>process.exit(0)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]


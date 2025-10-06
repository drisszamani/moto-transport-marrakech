######## Admin app Dockerfile (Next.js standalone) ########

# Stage 1: Install workspace deps from repo root
FROM node:20-bullseye AS deps
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
ENV HUSKY=0

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN mkdir -p packages/eslint-config packages/typescript-config packages/ui
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/admin/package.json ./apps/admin/package.json

RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Stage 2: Build only the admin app
FROM node:20-bullseye AS builder 
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages ./packages
COPY --from=deps /repo/apps/admin/package.json ./apps/admin/package.json

COPY apps/admin ./apps/admin
COPY packages ./packages

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production 
ENV PATH=/repo/node_modules/.bin:$PATH

RUN pnpm --filter admin... install --prod --no-frozen-lockfile --ignore-scripts
RUN pnpm --filter admin... admin

# Stage 3 : Runner 
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production 
ENV NEXT_TELEMETRY_DISABLED=1 

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /repo/apps/admin/public ./public
RUN mkdir -p .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/.next/static ./.next/static

USER nextjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', r=>process.exit(0)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]
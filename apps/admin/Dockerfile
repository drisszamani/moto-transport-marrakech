# Stage 1 : Dependencies
FROM node:20-bullseye AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app 

# Copy package files 
COPY package.json pnpm-lock.yaml ./
COPY packages/ ./packages/

# Install pnpm
RUN npm install -g pnpm 

# Install dependencies 
RUN pnpm install --frozen-lockfile

# Stage 2 : Builder 
FROM node:20-bullseye as builder 
WORKDIR /app 

# COpy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code 
COPY . .

# Set environnement variables for build
ENV NEXT_TELEMETRY_DISABLED 1 
ENV NODE_ENV production 

# Build the application
RUN pnpm run build 

# Stage 3 : Runner 
FROM node:20-bullseye as runner
WORKDIR /app

# Set environement 
ENV NODE_ENV production 
ENV NEXT_TELEMETRY_DISABLED 1 

# Creat non-root user 
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next 
RUN chown nextjs:nodejs .next

# Copy built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port (différent de la web app)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
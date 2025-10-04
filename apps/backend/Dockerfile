# Stage 1 : Build
FROM node:20-bullseye AS build

WORKDIR /app

# Copy package file
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm 
RUN npm instll - g pnpm 

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Stage 2 : Production
FROM node:20-bullseye-slim AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files from the build stage
COPY --from=build /app/dist ./dist

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the application files
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose the application port
EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
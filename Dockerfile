# Multi-stage build for optimized production image
# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
# Install all dependencies and generate Prisma client
RUN npm ci && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma
# Copy source code
COPY package*.json ./
COPY tsconfig*.json ./
COPY src ./src
COPY scripts ./scripts
# Build the application
RUN npm run build && \
    rm -rf src scripts tsconfig*.json

# Stage 3: Production dependencies
FROM node:20-alpine AS production
# Add security updates and required packages
RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies (includes dev deps; acceptable for now)
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
# Provide tsconfig for path-alias resolution at runtime
COPY --chown=nodejs:nodejs tsconfig*.json ./
# Copy Prisma files
COPY --chown=nodejs:nodejs prisma ./prisma

# Set environment to production
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Expose port (should match PORT env variable)
EXPOSE 4010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4010/api/v1/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run migrations and start server
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy || true; TS_NODE_PROJECT=tsconfig.runtime.json node -r tsconfig-paths/register dist/server.js"]

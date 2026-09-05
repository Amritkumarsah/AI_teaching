# ==============================================================================
# Multi-Stage Production Dockerfile for AI Teacher Express API
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root dependency manifest & workspaces
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY apps/api/package*.json ./apps/api/

# Install dependencies across all workspaces
RUN npm ci

# Copy full source tree
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# Compile TypeScript
RUN npm run build --workspace=@ai-teacher/api

# ==============================================================================
# Production Runtime Stage
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install non-root user and curl for health check
RUN apk add --no-cache curl

# Copy compiled bundles and node_modules from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/apps/api ./apps/api

# Create storage directories
RUN mkdir -p /app/apps/api/uploads /app/apps/api/static && chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["npm", "run", "start", "--workspace=@ai-teacher/api"]

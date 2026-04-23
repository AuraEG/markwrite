# ==========================================================================
# Dockerfile for MarkWrite Sync Server
# ==========================================================================
# Standalone multi-stage image (works with any Docker host).
# Build context must be apps/sync-server.
# ==========================================================================

# --------------------------------------------------------------------------
# Stage 1: Build
# --------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev for TypeScript build)
COPY package.json ./
RUN npm install

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --------------------------------------------------------------------------
# Stage 2: Production
# --------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0

# Install runtime dependencies only
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy build output
COPY --from=builder /app/dist ./dist

# Expose app port
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

CMD ["node", "dist/index.js"]

# ==============================================================================
# GhatWatch AI - Production Multi-Stage Dockerfile
# Serves: React Frontend + Express REST API + Python Risk Engine
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the Vite React Frontend
# ------------------------------------------------------------------------------
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime with Node.js and Python 3
# ------------------------------------------------------------------------------
FROM node:22-slim AS runner

# Ensure UTF-8 encoding across all tools
ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

# Install Python 3, pip, venv, build tools for native node modules, and curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create Python virtual environment and install risk engine requirements
COPY engine/requirements.txt ./engine/
RUN python3 -m venv /app/venv && \
    /app/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/venv/bin/pip install --no-cache-dir -r ./engine/requirements.txt

# Install server production dependencies (with resilient fallback)
COPY server/package*.json ./server/
RUN cd server && (npm ci --omit=dev || npm install --omit=dev --no-audit --no-fund)

# Copy application data and source files
COPY track-2-visarjan-ghat-watch ./track-2-visarjan-ghat-watch
COPY server ./server
COPY engine ./engine

# SQLite database directory (server/data is git-ignored, so it must be created here)
RUN mkdir -p /app/server/data

# Copy compiled frontend from Stage 1 into server's accessible path
COPY --from=client-builder /app/client/dist ./client/dist

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    ENGINE_URL=http://127.0.0.1:8000 \
    CLIENT_ORIGIN=* \
    PATH="/app/venv/bin:$PATH"

EXPOSE 5000

# Start supervisor entrypoint
CMD ["/app/docker-entrypoint.sh"]

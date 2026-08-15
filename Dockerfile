# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for compiling better-sqlite3 native binary
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=./data/database.sqlite

# Prepare persistent data folder and adjust permissions for non-root user
RUN mkdir -p /app/data && chown -R node:node /app

USER node

# Copy built node_modules and application code
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/
COPY --chown=node:node public/ ./public/

EXPOSE 3000

# Native Node.js health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]

# ── Stage 1: Build client ──────────────────────────────────────────────────
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --silent

COPY client/ ./
RUN npm run build

# ── Stage 2: Production server ─────────────────────────────────────────────
FROM node:20-alpine AS server

# Install Docker CLI for code execution
RUN apk add --no-cache docker-cli

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production --silent

COPY server/ ./

# Copy built client
COPY --from=client-build /app/client/dist /app/client/dist

WORKDIR /app/server

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "index.js"]

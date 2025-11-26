# Dockerfile ottimizzato per Cloud Run - TT2112 Digitale
# Multi-stage build per ridurre dimensione immagine finale

# Stage 1: Build dell'applicazione React
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package files per sfruttare layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install --save-dev vite @vitejs/plugin-react typescript

# Copia il resto dei file
COPY . .

# Build dell'applicazione (include public/tt2112-template.pdf)
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS production

WORKDIR /app

# Installa solo production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copia built files dallo stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Crea user non-root per security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Esponi porta (Cloud Run usa PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]

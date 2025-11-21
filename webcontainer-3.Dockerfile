# WebContainer Runtime Service
FROM node:18-alpine AS builder

# Install WebContainer dependencies and system packages
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    git \
    bash

# Install WebContainer Engine
RUN npm install -g @webcontainer/api

# Working directory
WORKDIR /app

# Copy WebContainer service code
COPY deployment/webcontainer/ /app/
RUN chmod +x /app/webcontainer-service.js

# Create WebContainer directories
RUN mkdir -p /var/lib/webcontainers /tmp/ephemeral /var/log/webcontainer

# Security hardening
RUN chmod 750 /var/lib/webcontainers /tmp/ephemeral /var/log/webcontainer

# Set up Node.js options for memory management
ENV NODE_OPTIONS="--max-old-space-size=512"

# Expose port
EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8083/health || exit 1

# Start WebContainer service
CMD ["node", "/app/webcontainer-service.js"]
# Sovereign AI Disposable Browser - Main Frontend
FROM node:18-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    gVisor-bin \
    wireguard-tools \
    iptables \
    jq \
    curl \
    git

# Install gVisor
RUN wget https://github.com/google/gvisor/releases/download/v0.6.0/gvisor_0.6.0_amd64.deb && \
    dpkg -i gvisor_0.6.0_amd64.deb || true && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up AppArmor profile
COPY browser-apparmor-profile /etc/apparmor.d/browser-profile

# Configure WireGuard
WORKDIR /app
COPY deployment/browser-scripts/ /scripts/

# Create necessary directories
RUN mkdir -p \
    /etc/wireguard \
    /var/lib/ephemeral \
    /var/log/browser \
    /tmp/isolated

# Install browser dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy browser application
COPY ai_disposable_browser.html ./
COPY deployment/browser-scripts/ /app/scripts/

# Security hardening
RUN chmod 750 /etc/wireguard /var/lib/ephemeral /var/log/browser

# Expose port
EXPOSE 8080

# Set up runtime user
RUN addgroup --system browser && \
    adduser --system --no-create-home --gecos "Sovereign Browser" --shell /sbin/nologin --group browser

USER browser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start script
CMD ["/scripts/start-browser.sh"]
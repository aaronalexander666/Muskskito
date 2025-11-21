# WireGuard VPN Server
FROM alpine:3.18 AS builder

# Install WireGuard and dependencies
RUN apk add --no-cache \
    wireguard-tools \
    iptables \
    iproute2 \
    jq \
    curl \
    bash \
    su-exec

# Set up WireGuard configuration
WORKDIR /app

# Create WireGuard directory structure
RUN mkdir -p /etc/wireguard /etc/keys /var/log/wireguard

# Copy WireGuard configuration templates
COPY deployment/wireguard/ /app/config/

# Copy WireGuard management scripts
COPY deployment/wireguard/ /app/scripts/

# Make scripts executable
RUN chmod +x /app/scripts/*.sh

# Generate server configuration if it doesn't exist
RUN /app/scripts/generate-server-config.sh

# Security hardening
RUN chmod 750 /etc/wireguard /etc/keys /var/log/wireguard

# Expose WireGuard port
EXPOSE 51820/udp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wg show || exit 1

# Start WireGuard
CMD ["wg", "show", "wg0", "status"]
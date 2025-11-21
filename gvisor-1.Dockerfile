# gVisor Sandbox Service
FROM ubuntu:22.04 AS builder

# Install gVisor and dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg2 \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    net-tools \
    iptables \
    systemd \
    libseccomp-dev \
    && rm -rf /var/lib/apt/lists/*

# Add gVisor repository
RUN curl -fsSL https://gvisor.dev/archive.key | apt-key add - && \
    echo "deb [arch=amd64] https://storage.googleapis.com/gvisor-deb main" | tee /etc/apt/sources.list.d/gvisor.list

# Install gVisor
RUN apt-get update && apt-get install -y \
    runsc \
    shimv2 \
    && rm -rf /var/lib/apt/lists/*

# Working directory
WORKDIR /app

# Copy gVisor configuration and scripts
COPY deployment/gvisor/ /app/config/
COPY deployment/gvisor/ /app/scripts/

# Make scripts executable
RUN chmod +x /app/scripts/*.sh

# Set up gVisor runtime
RUN /app/scripts/setup-gvisor.sh

# Create necessary directories
RUN mkdir -p /run/gvisor /var/lib/containers /var/log/gvisor

# Security hardening
RUN chmod 750 /run/gvisor /var/lib/containers /var/log/gvisor

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8082/health || exit 1

# Start gVisor service
CMD ["/app/scripts/start-gvisor.sh"]
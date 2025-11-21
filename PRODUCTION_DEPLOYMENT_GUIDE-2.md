# Sovereign AI Disposable Browser - Deployment Guide

**Author:** MiniMax Agent  
**Version:** 1.0  
**Updated:** 2025-11-21

## Overview

The Sovereign AI Disposable Browser is a privacy-focused, ephemeral browsing solution that implements zero-trust architecture with AI-powered security. This deployment guide covers production-ready deployment scenarios using Docker and Kubernetes.

## Architecture Components

### Core Services

1. **Sovereign Browser Frontend** - Main web interface with anti-fingerprinting
2. **WireGuard VPN Server** - Encrypted network routing
3. **AI Security Service** - On-device malware detection using Phi-3 and LLaMA models
4. **gVisor Sandbox** - Container runtime isolation
5. **WebContainer Service** - Browser isolation via WebAssembly
6. **Anti-Fingerprinting Service** - Canvas, WebGL, and audio fingerprint protection
7. **Storage Cleanup Service** - Ephemeral data management

### Security Features

- **Zero-persistence architecture** - All data is ephemeral
- **Network isolation** - WireGuard VPN with restricted routing
- **Container sandboxing** - gVisor and AppArmor profiles
- **AI-powered threat detection** - Real-time malware analysis
- **Anti-fingerprinting** - Dynamic identity randomization
- **Memory protection** - ASLR, stack protection, NX bits

## Deployment Options

### Option 1: Docker Compose (Recommended for Development/Testing)

**Prerequisites:**
- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 10GB+ disk space
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+

**Quick Deployment:**
```bash
# Make scripts executable
chmod +x deployment/quick-setup.sh

# Run quick setup (installs dependencies, builds, and deploys)
./deployment/quick-setup.sh
```

**Manual Deployment:**
```bash
# 1. Check system requirements
./deployment/deploy.sh check

# 2. Install dependencies (if needed)
./deployment/deploy.sh install

# 3. Generate configurations
./deployment/deploy.sh config

# 4. Build Docker images
./deployment/deploy.sh build

# 5. Deploy services
./deployment/deploy.sh deploy

# 6. Check status
./deployment/deploy.sh status
```

**Service Access URLs:**
- Browser Frontend: http://localhost:8080
- AI Security Service: http://localhost:8081
- gVisor Sandbox: http://localhost:8082
- WebContainer Service: http://localhost:8083
- Anti-Fingerprinting Service: http://localhost:8084

### Option 2: Kubernetes (Recommended for Production)

**Prerequisites:**
- Kubernetes 1.20+
- kubectl configured
- Storage class with persistent volumes
- Optional: GPU nodes for AI inference

**Deploy to Kubernetes:**
```bash
# Create namespace and apply manifests
kubectl apply -f deployment/kubernetes-deployment.yaml

# Check deployment status
kubectl get pods -n sovereign-browser

# Scale services if needed
kubectl scale deployment ai-security-service --replicas=5 -n sovereign-browser
```

**Access Services:**
```bash
# Get LoadBalancer IP
kubectl get svc sovereign-browser-service -n sovereign-browser

# Port-forward for development
kubectl port-forward svc/sovereign-browser-service 8080:80 -n sovereign-browser
```

## Configuration Management

### WireGuard VPN Configuration

**Server Setup:**
```bash
# Generate server keys (automatic in deployment scripts)
wg genkey | tee server_private.key | wg pubkey > server_public.key

# Server configuration
cat > wg0.conf << EOF
[Interface]
PrivateKey = $(cat server_private.key)
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
EOF
```

**Client Configuration:**
```bash
# Generate client keys
wg genkey | tee client_private.key | wg pubkey > client_public.key

# Client config
cat > client.conf << EOF
[Interface]
PrivateKey = $(cat client_private.key)
Address = 10.0.0.2/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = YOUR_SERVER_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF
```

### AI Models Configuration

**Model Download (Production):**
```bash
# Download quantized Phi-3 model (2GB)
wget https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf \
    -O /models/phi-3-quantized.gguf

# Download LLaMA 3.2 1B model (1GB)
wget https://huggingface.co/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-q4.gguf \
    -O /models/llama-3.2-1b-quantized.gguf

# Set proper permissions
chmod 644 /models/*.gguf
chown -R 65534:65534 /models/
```

### Security Policies Configuration

**AppArmor Profiles:**
```bash
# Browser profile
cat > /etc/apparmor.d/browser-profile << EOF
#include <tunables/global>

profile browser flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>
  
  # Network access
  network inet stream,
  network inet6 stream,
  
  # File access
  /var/log/browser/** r,
  /tmp/** rw,
  /var/tmp/** rw,
  
  # Deny dangerous operations
  deny /proc/sys/** w,
  deny /sys/** w,
  deny /dev/** w,
}
EOF

# Load profile
sudo apparmor_parser -r /etc/apparmor.d/browser-profile
```

## Production Considerations

### Performance Optimization

**Docker Daemon Configuration:**
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "userland-proxy": false,
  "live-restore": true,
  "experimental": false
}
```

**Kernel Parameters:**
```bash
# /etc/sysctl.d/99-container.conf
net.ipv4.ip_forward=1
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
vm.overcommit_memory=1
vm.swappiness=1
```

### Security Hardening

**SELinux Configuration:**
```bash
# Enable SELinux (if available)
sudo setenforce 1

# Create container-specific policies
sudo semanage fcontext -a -t container_file_t "/var/lib/containers(/.*)?"

# AppArmor integration
sudo apparmor_parser -r /etc/apparmor.d/docker
```

**Firewall Rules:**
```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 8080/tcp  # Browser frontend
sudo ufw allow 51820/udp # WireGuard
sudo ufw enable
```

### Monitoring and Logging

**Service Health Monitoring:**
```bash
# Check all services
./deployment/maintain.sh health

# Monitor performance
./deployment/maintain.sh monitor

# Security audit
./deployment/maintain.sh audit

# Generate report
./deployment/maintain.sh report
```

**Log Analysis:**
```bash
# View recent logs
./deployment/maintain.sh logs

# Follow logs in real-time
docker-compose logs -f

# Analyze errors
docker-compose logs --tail=100 | grep -i error
```

### Backup and Recovery

**Configuration Backup:**
```bash
# Create backup
./deployment/maintain.sh backup

# Restore from backup
cp -r backup/20231121_134840/config/* ./config/
docker-compose up -d
```

**Data Persistence:**
- AI models: Persistent volume (10GB recommended)
- WireGuard keys: ConfigMap with secret management
- Security logs: Persistent volume for audit trail
- WireGuard logs: Temporary (recreated on restart)

## Maintenance Tasks

### Regular Maintenance
```bash
# Weekly cleanup
./deployment/maintain.sh cleanup

# Monthly updates
./deployment/maintain.sh update

# Performance optimization
./deployment/maintain.sh optimize

# Security updates
sudo apt update && sudo apt upgrade
docker-compose pull
```

### Troubleshooting

**Common Issues:**

1. **Services not starting:**
   ```bash
   # Check logs
   ./deployment/maintain.sh logs
   
   # Restart specific service
   docker-compose restart sovereign-browser
   ```

2. **Memory issues:**
   ```bash
   # Check memory usage
   ./deployment/maintain.sh resources
   
   # Adjust memory limits in docker-compose.yml
   ```

3. **Network connectivity:**
   ```bash
   # Check WireGuard status
   wg show
   
   # Test VPN connectivity
   ping 10.0.0.1
   ```

4. **AI model loading:**
   ```bash
   # Check model files
   ls -la /models/
   
   # Verify model permissions
   chmod 644 /models/*.gguf
   ```

## Scaling and High Availability

### Horizontal Scaling
```yaml
# Docker Compose (scale individual services)
docker-compose up --scale ai-security-service=3 --scale gvisor-sandbox=5

# Kubernetes (automatic scaling)
kubectl autoscale deployment ai-security-service --cpu-percent=70 --min=2 --max=10
```

### Load Balancing
```bash
# Nginx configuration for load balancing
upstream sovereign_browser {
    server sovereign-browser-1:8080;
    server sovereign-browser-2:8080;
    server sovereign-browser-3:8080;
}

server {
    listen 80;
    location / {
        proxy_pass http://sovereign_browser;
    }
}
```

### Database Considerations
- **No persistent database required** - all data is ephemeral
- **Session state**: In-memory only
- **Audit logs**: Optional persistent storage
- **Configuration**: Version controlled in Git

## Support and Troubleshooting

### Health Check Commands
```bash
# Complete health check
./deployment/maintain.sh health

# Resource monitoring
./deployment/maintain.sh monitor

# Security audit
./deployment/maintain.sh audit

# Generate detailed report
./deployment/maintain.sh report
```

### Log Locations
- Service logs: `docker-compose logs`
- System logs: `/var/log/syslog`
- Docker daemon: `journalctl -u docker`
- AppArmor logs: `journalctl -u apparmor`

### Emergency Procedures
```bash
# Stop all services
./deployment/deploy.sh cleanup

# Reset to clean state
docker system prune -af --volumes
./deployment/quick-setup.sh

# Emergency configuration reset
git checkout HEAD -- deployment/
```

---

## Next Steps

After successful deployment:

1. **Configure client devices** with WireGuard VPN settings
2. **Set up monitoring** with external tools (Prometheus, Grafana)
3. **Configure SSL/TLS** for production HTTPS
4. **Set up backup schedules** for configurations
5. **Review security policies** regularly
6. **Test disaster recovery** procedures

For additional support, refer to the AI Browser Research Report and individual service documentation.
# Sovereign AI Disposable Browser - Deployment Scripts

**Author:** MiniMax Agent  
**Project:** Sovereign AI Disposable Browser  
**Version:** 1.0

This directory contains comprehensive deployment automation scripts for the Sovereign AI Disposable Browser system, a privacy-focused, ephemeral browsing solution with AI-powered security.

## 🏗️ Architecture Overview

The Sovereign AI Disposable Browser implements a multi-layered security architecture:

- **WebContainer Integration**: Browser isolation via WebAssembly
- **gVisor Sandboxing**: Container runtime isolation
- **WireGuard VPN**: Encrypted network routing
- **AI Security**: On-device malware detection (Phi-3, LLaMA 3.2)
- **Anti-Fingerprinting**: Dynamic identity randomization
- **Ephemeral Storage**: Zero-persistence architecture

## 📁 Directory Structure

```
deployment/
├── README.md                           # This file
├── PRODUCTION_DEPLOYMENT_GUIDE.md      # Detailed production guide
├── docker-compose.yml                  # Multi-service Docker Compose
├── kubernetes-deployment.yaml          # Kubernetes manifests
├── deploy.sh                           # Main deployment automation
├── maintain.sh                         # Monitoring & maintenance
├── quick-setup.sh                      # One-command setup
├── browser.Dockerfile                  # Frontend container
├── ai-security.Dockerfile              # AI service container
├── wireguard.Dockerfile                # VPN server container
├── gvisor.Dockerfile                   # Sandbox container
└── webcontainer.Dockerfile             # WebContainer service
```

## 🚀 Quick Start

### Option 1: One-Command Setup (Recommended for Development)

```bash
# Make script executable and run
chmod +x deployment/quick-setup.sh
./deployment/quick-setup.sh
```

This will:
1. Check and install prerequisites
2. Build all Docker images
3. Generate security configurations
4. Deploy all services
5. Verify deployment status

### Option 2: Manual Deployment

```bash
# Full deployment process
./deployment/deploy.sh full

# Or step by step:
./deployment/deploy.sh check    # Verify requirements
./deployment/deploy.sh install  # Install dependencies
./deployment/deploy.sh config   # Generate configs
./deployment/deploy.sh build    # Build images
./deployment/deploy.sh deploy   # Deploy services
./deployment/deploy.sh status   # Check status
```

## 🔧 Script Reference

### deploy.sh - Main Deployment Script

Comprehensive deployment automation for all deployment scenarios.

**Usage:**
```bash
./deployment/deploy.sh [COMMAND]

Commands:
  check     - Verify system requirements
  install   - Install system dependencies  
  config    - Generate configuration files
  build     - Build Docker images
  deploy    - Deploy with Docker Compose
  status    - Show deployment status
  logs      - View service logs
  cleanup   - Stop and remove services
  full      - Complete deployment (default)
  help      - Show help message
```

**Features:**
- Automatic dependency detection and installation
- WireGuard key generation
- AI model configuration setup
- Security policy generation
- Multi-stage Docker image building
- Health check validation

### maintain.sh - Monitoring & Maintenance

Health monitoring, performance analysis, and maintenance utilities.

**Usage:**
```bash
./deployment/maintain.sh [COMMAND]

Commands:
  health    - Run health checks
  resources - Check system resources
  monitor   - Performance monitoring (30s)
  audit     - Security audit
  logs      - Analyze service logs
  backup    - Create configuration backup
  update    - Update all services
  cleanup   - Clean up old resources
  optimize  - Performance optimization
  report    - Generate health report
  help      - Show help message
```

**Features:**
- Service health validation
- Resource usage monitoring
- Security policy compliance checking
- Automated log analysis
- Configuration backup/restore
- Performance optimization

### quick-setup.sh - One-Command Setup

Streamlined setup for rapid deployment in development environments.

**Features:**
- Automatic OS detection and dependency installation
- Docker/Docker Compose installation
- System requirement validation
- One-command deployment
- Status verification with detailed reporting

## 🐳 Docker Services

### sovereign-browser (Main Frontend)
- **Port:** 8080
- **Function:** Browser web interface with anti-fingerprinting
- **Resources:** 512MB RAM, 250m CPU (min) / 1GB RAM, 500m CPU (max)
- **Security:** AppArmor profile, NET_ADMIN, SYS_ADMIN capabilities

### wireguard-server (VPN Service)
- **Port:** 51820/udp
- **Function:** WireGuard VPN server for encrypted routing
- **Resources:** 64MB RAM, 50m CPU (min) / 128MB RAM, 100m CPU (max)
- **Security:** No privilege escalation, read-only root filesystem

### ai-security-service (AI Detection)
- **Port:** 8081
- **Function:** On-device malware detection using Phi-3 and LLaMA models
- **Resources:** 2GB RAM, 1 CPU (min) / 4GB RAM, 2 CPU (max)
- **Optional:** GPU acceleration (NVIDIA) for faster inference
- **Models:** Phi-3-mini-4k-instruct-q4.gguf (2GB), LLaMA-3.2-1B-q4.gguf (1GB)

### gvisor-sandbox (Container Runtime)
- **Port:** 8082
- **Function:** gVisor container runtime for isolation
- **Resources:** 512MB RAM, 250m CPU (min) / 1GB RAM, 500m CPU (max)
- **Security:** AppArmor profile, SYS_ADMIN, SYS_PTRACE capabilities

### webcontainer-runtime (Browser Isolation)
- **Port:** 8083
- **Function:** WebContainer service for browser isolation
- **Resources:** Configurable (default: 512MB RAM, 2 CPU)
- **Runtime:** Node.js with WebAssembly isolation

## 🔐 Security Features

### Network Isolation
- WireGuard VPN with custom routing
- Service-to-service communication via isolated Docker network
- Network policies in Kubernetes deployments

### Container Security
- AppArmor profiles for all services
- Read-only root filesystems where possible
- Capability dropping (ALL) with selective additions
- Non-root user execution
- Resource limits and quotas

### Data Protection
- Ephemeral storage with auto-cleanup
- Secure deletion of temporary data
- No persistent sensitive data storage
- Configurable data retention policies

### AI Security
- On-device model inference (no external AI calls)
- Quantized models for privacy and performance
- Configurable detection thresholds
- Real-time threat analysis

## 📊 Monitoring & Observability

### Health Checks
```bash
# Check all services
./deployment/maintain.sh health

# Service-specific checks
docker-compose ps
docker-compose logs --tail=50 [service-name]
```

### Performance Monitoring
```bash
# Real-time monitoring
./deployment/maintain.sh monitor

# Resource usage
./deployment/maintain.sh resources

# Generate detailed report
./deployment/maintain.sh report
```

### Security Monitoring
```bash
# Security audit
./deployment/maintain.sh audit

# Log analysis
./deployment/maintain.sh logs
```

## 🚢 Production Deployment

### Kubernetes Deployment

For production environments, use the provided Kubernetes manifests:

```bash
# Deploy to Kubernetes
kubectl apply -f deployment/kubernetes-deployment.yaml

# Check status
kubectl get pods -n sovereign-browser

# Scale services
kubectl scale deployment ai-security-service --replicas=5 -n sovereign-browser
```

**Production Features:**
- Horizontal Pod Autoscaling
- Persistent Volume Claims for AI models
- Network Policies for isolation
- Security Context configurations
- Resource requests and limits

### Production Considerations

1. **Hardware Requirements:**
   - CPU: 4+ cores (8+ recommended for AI services)
   - RAM: 8GB+ (16GB+ recommended)
   - Storage: 50GB+ for models and logs
   - GPU: Optional, for AI acceleration

2. **Security Hardening:**
   - Enable SELinux/AppArmor
   - Configure firewall rules
   - Regular security updates
   - Audit log retention

3. **Performance Optimization:**
   - Adjust Docker daemon settings
   - Configure kernel parameters
   - Enable cgroupv2
   - Optimize network settings

## 🔧 Configuration

### Environment Variables

Key configuration options:

```bash
# WireGuard
WG_INTERFACE_NAME=wg0
WG_LISTEN_PORT=51820

# AI Models
MODEL_PATH=/models/phi-3-quantized.gguf
SECURITY_LEVEL=high
DETECTION_THRESHOLD=0.85

# gVisor
GVISOR_SANDBOX_PATH=/run/gvisor
MAX_CONTAINERS=10

# WebContainer
WEBCONTAINER_MAX_MEMORY=512MB
EPHEMERAL_STORAGE_TTL=300s
```

### Security Policies

Security configurations are auto-generated in:
- `/workspace/config/security-policies.json`
- AppArmor profiles
- Network policies (Kubernetes)
- Container security contexts

## 🆘 Troubleshooting

### Common Issues

1. **Services Not Starting:**
   ```bash
   # Check logs
   ./deployment/maintain.sh logs
   
   # Restart service
   docker-compose restart [service-name]
   ```

2. **Memory Issues:**
   ```bash
   # Check resources
   ./deployment/maintain.sh resources
   
   # Adjust limits in docker-compose.yml
   ```

3. **Network Problems:**
   ```bash
   # Check WireGuard status
   wg show
   
   # Test connectivity
   ping 10.0.0.1
   ```

4. **AI Model Loading:**
   ```bash
   # Verify model files
   ls -la /models/
   
   # Check permissions
   chmod 644 /models/*.gguf
   ```

### Emergency Procedures

```bash
# Complete cleanup
./deployment/deploy.sh cleanup

# Reset to clean state
docker system prune -af --volumes

# Restore from backup
./deployment/maintain.sh backup
```

## 📋 Requirements

### System Requirements

- **OS:** Ubuntu 20.04+, Debian 11+, CentOS 8+, or similar
- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Memory:** 4GB+ (8GB+ recommended)
- **Storage:** 10GB+ (50GB+ recommended)
- **CPU:** 2+ cores (4+ recommended)

### Network Requirements

- **Ports Required:**
  - 8080: Browser frontend
  - 8081: AI security service
  - 8082: gVisor sandbox
  - 8083: WebContainer service
  - 51820/udp: WireGuard VPN

### Optional Components

- **GPU:** NVIDIA GPU for AI acceleration
- **SELinux/AppArmor:** For enhanced security
- **GPU drivers:** For AI model acceleration

## 📚 Documentation

- **Main README:** This file
- **Production Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Browser Research Report:** `/workspace/AI_Browser_Research_Report.md`
- **Interactive Demo:** `/workspace/ai_disposable_browser.html`

## 🤝 Support

For deployment issues:

1. Check the troubleshooting section above
2. Run `./deployment/maintain.sh health` for diagnostics
3. Review logs with `./deployment/maintain.sh logs`
4. Consult the production deployment guide
5. Generate a health report with `./deployment/maintain.sh report`

---

**Created by:** MiniMax Agent  
**Last Updated:** 2025-11-21  
**Version:** 1.0
#!/bin/bash

# Sovereign AI Disposable Browser - Main Deployment Script
# Author: MiniMax Agent
# Description: Automated deployment script for Sovereign AI Disposable Browser

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOG_FILE="/var/log/sovereign-deploy.log"
DEPLOYMENT_ENV="development"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
    
    case "${level}" in
        ERROR)   echo -e "${RED}[ERROR]${NC} ${message}" >&2 ;;
        SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} ${message}" ;;
        WARN)    echo -e "${YELLOW}[WARN]${NC} ${message}" ;;
        INFO)    echo -e "${BLUE}[INFO]${NC} ${message}" ;;
    esac
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    log INFO "Checking system requirements..."
    
    local missing_deps=()
    
    # Check for required commands
    for cmd in docker docker-compose git curl wget; do
        if ! command_exists "$cmd"; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        log ERROR "Docker daemon is not running. Please start Docker."
        missing_deps+=("docker-daemon")
    fi
    
    # Check available memory (minimum 4GB)
    local available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [[ "$available_mem" -lt 4000 ]]; then
        log WARN "Available memory is less than 4GB. Performance may be degraded."
    fi
    
    # Check available disk space (minimum 10GB)
    local available_disk=$(df / | awk 'NR==2{printf "%.0f", $4/1024/1024}')
    if [[ "$available_disk" -lt 10 ]]; then
        log ERROR "Available disk space is less than 10GB. Please free up space."
        missing_deps+=("disk-space")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log ERROR "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
    
    log SUCCESS "System requirements check passed"
    return 0
}

# Install system dependencies
install_dependencies() {
    log INFO "Installing system dependencies..."
    
    local os_type=""
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        os_type="${ID:-ubuntu}"
    fi
    
    case "$os_type" in
        ubuntu|debian)
            sudo apt-get update
            sudo apt-get install -y \
                docker.io \
                docker-compose \
                git \
                curl \
                wget \
                jq \
                htop \
                iotop \
                nload \
                apparmor \
                wireguard-tools \
                iptables-persistent
            ;;
        fedora|rhel|centos)
            sudo yum install -y \
                docker \
                docker-compose \
                git \
                curl \
                wget \
                jq \
                htop \
                iotop \
                nload \
                libseccomp-devel
            sudo systemctl enable docker
            sudo systemctl start docker
            ;;
        alpine)
            sudo apk add \
                docker \
                docker-compose \
                git \
                curl \
                wget \
                jq \
                htop \
                iotop \
                nload \
                libseccomp-dev
            sudo rc-service docker start
            ;;
        *)
            log WARN "Unknown OS type: $os_type. Skipping automatic dependency installation."
            ;;
    esac
    
    # Install gVisor
    if ! command_exists runsc; then
        log INFO "Installing gVisor..."
        curl -fsSL https://gvisor.dev/archive.key | sudo apt-key add -
        echo "deb [arch=amd64] https://storage.googleapis.com/gvisor-deb main" | sudo tee /etc/apt/sources.list.d/gvisor.list
        sudo apt-get update
        sudo apt-get install -y runsc shimv2
    fi
    
    log SUCCESS "System dependencies installed"
}

# Generate configuration files
generate_configs() {
    log INFO "Generating configuration files..."
    
    local config_dir="${PROJECT_ROOT}/config"
    mkdir -p "$config_dir"
    
    # Generate WireGuard server config
    if [[ ! -f "${config_dir}/wireguard-server.conf" ]]; then
        log INFO "Generating WireGuard server configuration..."
        
        local server_private_key=$(wg genkey)
        local server_public_key=$(echo "$server_private_key" | wg pubkey)
        local pre_shared_key=$(wg genpsk)
        
        cat > "${config_dir}/wireguard-server.conf" << EOF
[Interface]
PrivateKey = ${server_private_key}
Address = 10.0.0.1/24
ListenPort = 51820
SaveConfig = true

# Test client configuration
[Peer]
PublicKey = CLIENT_PUBLIC_KEY_PLACEHOLDER
AllowedIPs = 10.0.0.2/32
EOF
        
        echo "$server_public_key" > "${config_dir}/wireguard-server-public.key"
        echo "$pre_shared_key" > "${config_dir}/wireguard-psk.key"
        
        log SUCCESS "WireGuard server configuration generated"
    fi
    
    # Generate AI model configuration
    if [[ ! -f "${config_dir}/ai-models.conf" ]]; then
        log INFO "Generating AI model configuration..."
        
        cat > "${config_dir}/ai-models.conf" << EOF
{
  "phi3_model_path": "/models/phi-3-quantized.gguf",
  "llama_model_path": "/models/llama-3.2-1b-quantized.gguf",
  "detection_threshold": 0.85,
  "confidence_threshold": 0.9,
  "max_tokens": 512,
  "temperature": 0.1,
  "device": "auto",
  "quantization": "q4",
  "max_batch_size": 4,
  "memory_limit_gb": 4
}
EOF
        
        log SUCCESS "AI model configuration generated"
    fi
    
    # Generate security policies
    if [[ ! -f "${config_dir}/security-policies.json" ]]; then
        log INFO "Generating security policies..."
        
        cat > "${config_dir}/security-policies.json" << EOF
{
  "network_isolation": {
    "enabled": true,
    "allowed_ports": [80, 443, 8080],
    "blocked_protocols": ["telnet", "ftp", "irc"]
  },
  "file_access": {
    "enabled": true,
    "allowed_paths": ["/tmp", "/var/tmp"],
    "blocked_extensions": [".exe", ".bat", ".sh", ".ps1"]
  },
  "memory_protection": {
    "enabled": true,
    "stack_protection": true,
    "aslr_enabled": true,
    "nx_enabled": true
  },
  "anti_fingerprinting": {
    "canvas_spoofing": true,
    "webgl_randomization": true,
    "audio_fingerprint_protection": true,
    "font_randomization": true
  },
  "session_management": {
    "ephemeral_storage": true,
    "auto_cleanup": true,
    "cleanup_interval": 300,
    "secure_deletion": true
  }
}
EOF
        
        log SUCCESS "Security policies generated"
    fi
    
    log SUCCESS "Configuration files generated"
}

# Build Docker images
build_images() {
    log INFO "Building Docker images..."
    
    local services=("browser" "wireguard-server" "ai-security-service" "gvisor-sandbox" "webcontainer-runtime" "sovereign-backend-2025")
    
    for service in "${services[@]}"; do
        log INFO "Building ${service} image..."
        cd "$PROJECT_ROOT"
        
        case "$service" in
            browser)
                docker build -f deployment/browser.Dockerfile -t sovereign-browser:latest .
                ;;
            wireguard-server)
                docker build -f deployment/wireguard.Dockerfile -t wireguard-server:latest .
                ;;
            ai-security-service)
                docker build -f deployment/ai-security.Dockerfile -t ai-security-service:latest .
                ;;
            gvisor-sandbox)
                docker build -f deployment/gvisor.Dockerfile -t gvisor-sandbox:latest .
                ;;
            webcontainer-runtime)
                docker build -f deployment/webcontainer.Dockerfile -t webcontainer-runtime:latest .
                ;;
            sovereign-backend-2025)
                # Build backend first using specialized script
                log INFO "Building 2025 backend security engine..."
                cd "$PROJECT_ROOT/deployment/backend"
                if [[ -f "build-backend.sh" ]]; then
                    chmod +x build-backend.sh
                    ./build-backend.sh build
                else
                    # Fallback to direct docker build
                    cd "$PROJECT_ROOT"
                    docker build -f deployment/backend/Dockerfile.backend -t sovereign-backend-2025:latest .
                fi
                ;;
        esac
        
        if [[ $? -eq 0 ]]; then
            log SUCCESS "Built ${service} image"
        else
            log ERROR "Failed to build ${service} image"
            return 1
        fi
    done
    
    log SUCCESS "All Docker images built successfully"
}

# Deploy using Docker Compose
deploy_compose() {
    log INFO "Deploying using Docker Compose..."
    
    cd "$PROJECT_ROOT/deployment"
    
    # Copy configuration files
    cp -r ../config ./config
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    log INFO "Waiting for services to become healthy..."
    sleep 30
    
    # Check service health
    local services=("sovereign-browser" "wireguard-server" "ai-security-service" "gvisor-sandbox" "webcontainer-runtime" "sovereign-backend-2025")
    
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up (healthy)"; then
            log SUCCESS "${service} is healthy"
        else
            log WARN "${service} may not be healthy yet"
        fi
    done
    
    log SUCCESS "Docker Compose deployment completed"
}

# Show deployment status
show_status() {
    log INFO "Deployment Status:"
    
    cd "$PROJECT_ROOT/deployment"
    
    echo
    echo "Docker Compose Services:"
    docker-compose ps
    
    echo
    echo "Service URLs:"
    echo "- Browser Frontend: http://localhost:8080"
    echo "- AI Security Service: http://localhost:8081"
    echo "- gVisor Sandbox: http://localhost:8082"
    echo "- WebContainer Service: http://localhost:8083"
    echo "- Anti-Fingerprinting: http://localhost:8084"
    echo "- Backend Security Engine: https://localhost:8443"
    
    echo
    echo "Logs (last 50 lines):"
    docker-compose logs --tail=50
}

# Cleanup function
cleanup() {
    log INFO "Cleaning up deployment..."
    
    cd "$PROJECT_ROOT/deployment"
    docker-compose down --volumes --remove-orphans
    
    # Clean up dangling images
    docker image prune -f
    
    log SUCCESS "Cleanup completed"
}

# Help function
show_help() {
    cat << EOF
Sovereign AI Disposable Browser Deployment Script

Usage: $0 [COMMAND]

Commands:
    check           Check system requirements
    install         Install system dependencies
    config          Generate configuration files
    build           Build Docker images
    deploy          Deploy with Docker Compose
    status          Show deployment status
    logs            Show service logs
    cleanup         Stop and remove all services
    full            Run full deployment (check + install + config + build + deploy)
    help            Show this help message

Environment Variables:
    DEPLOYMENT_ENV  Set deployment environment (default: development)

Examples:
    $0 full         # Full deployment
    $0 deploy       # Deploy only
    $0 status       # Check deployment status
    $0 cleanup      # Clean up deployment

EOF
}

# Main deployment logic
main() {
    local command="${1:-full}"
    
    case "$command" in
        check)
            check_requirements
            ;;
        install)
            install_dependencies
            ;;
        config)
            generate_configs
            ;;
        build)
            check_requirements
            build_images
            ;;
        deploy)
            check_requirements
            generate_configs
            deploy_compose
            ;;
        status)
            show_status
            ;;
        logs)
            cd "$PROJECT_ROOT/deployment"
            docker-compose logs -f
            ;;
        cleanup)
            cleanup
            ;;
        full)
            check_requirements || exit 1
            install_dependencies
            generate_configs
            build_images
            deploy_compose
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log ERROR "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Create log file
touch "$LOG_FILE" || true

# Run main function
main "$@"
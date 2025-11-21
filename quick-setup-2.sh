#!/bin/bash

# Sovereign AI Disposable Browser - Quick Setup Script
# Author: MiniMax Agent
# Description: One-command setup for quick deployment

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   Sovereign AI Browser Quick Setup   ${NC}"
echo -e "${BLUE}======================================${NC}"
echo

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}Docker is not installed. Installing Docker...${NC}"
    
    # Detect OS and install Docker
    if [[ -f /etc/os-release ]]; then
        source /etc/os-release
        case "$ID" in
            ubuntu|debian)
                sudo apt-get update
                sudo apt-get install -y docker.io docker-compose
                sudo usermod -aG docker $USER
                ;;
            fedora|rhel|centos)
                sudo yum install -y docker docker-compose
                sudo systemctl enable docker
                sudo systemctl start docker
                sudo usermod -aG docker $USER
                ;;
            *)
                echo -e "${RED}Unsupported OS. Please install Docker manually.${NC}"
                exit 1
                ;;
        esac
    else
        echo -e "${RED}Cannot detect OS. Please install Docker manually.${NC}"
        exit 1
    fi
fi

# Check if Docker Compose is installed
if ! command -v docker-compose >/dev/null 2>&1; then
    echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Check system requirements
echo -e "${BLUE}Checking system requirements...${NC}"

# Check available memory (minimum 4GB recommended)
available_mem=$(free -g | awk 'NR==2{print $7}')
if [[ $available_mem -lt 4 ]]; then
    echo -e "${YELLOW}Warning: Available memory is ${available_mem}GB (4GB recommended)${NC}"
fi

# Check available disk space (minimum 10GB recommended)
available_disk=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
if [[ $available_disk -lt 10 ]]; then
    echo -e "${YELLOW}Warning: Available disk space is ${available_disk}GB (10GB recommended)${NC}"
fi

# Set up project structure
echo -e "${BLUE}Setting up project structure...${NC}"

mkdir -p "${PROJECT_ROOT}/config"
mkdir -p "${PROJECT_ROOT}/logs"
mkdir -p "${PROJECT_ROOT}/backup"

# Generate WireGuard configuration
echo -e "${BLUE}Generating WireGuard configuration...${NC}"

if [[ ! -f "${PROJECT_ROOT}/config/wireguard-server.conf" ]]; then
    server_private_key=$(wg genkey)
    server_public_key=$(echo "$server_private_key" | wg pubkey)
    
    cat > "${PROJECT_ROOT}/config/wireguard-server.conf" << EOF
[Interface]
PrivateKey = $server_private_key
Address = 10.0.0.1/24
ListenPort = 51820
SaveConfig = true

[Peer]
# Add your client public key here
PublicKey = CLIENT_PUBLIC_KEY_PLACEHOLDER
AllowedIPs = 10.0.0.2/32
EOF
    
    echo "$server_public_key" > "${PROJECT_ROOT}/config/wireguard-server-public.key"
    echo -e "${GREEN}WireGuard configuration generated${NC}"
fi

# Generate AI models configuration
echo -e "${BLUE}Generating AI models configuration...${NC}"

if [[ ! -f "${PROJECT_ROOT}/config/ai-models.conf" ]]; then
    cat > "${PROJECT_ROOT}/config/ai-models.conf" << EOF
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
    echo -e "${GREEN}AI models configuration generated${NC}"
fi

# Build Docker images
echo -e "${BLUE}Building Docker images...${NC}"

cd "$PROJECT_ROOT"

# Build each service
services=("browser" "wireguard-server" "ai-security-service" "gvisor-sandbox" "webcontainer-runtime")
for service in "${services[@]}"; do
    echo -e "${BLUE}Building $service...${NC}"
    
    case "$service" in
        browser)
            docker build -f deployment/browser.Dockerfile -t sovereign-browser:latest . || {
                echo -e "${RED}Failed to build $service${NC}"
                exit 1
            }
            ;;
        wireguard-server)
            docker build -f deployment/wireguard.Dockerfile -t wireguard-server:latest . || {
                echo -e "${RED}Failed to build $service${NC}"
                exit 1
            }
            ;;
        ai-security-service)
            docker build -f deployment/ai-security.Dockerfile -t ai-security-service:latest . || {
                echo -e "${RED}Failed to build $service${NC}"
                exit 1
            }
            ;;
        gvisor-sandbox)
            docker build -f deployment/gvisor.Dockerfile -t gvisor-sandbox:latest . || {
                echo -e "${RED}Failed to build $service${NC}"
                exit 1
            }
            ;;
        webcontainer-runtime)
            docker build -f deployment/webcontainer.Dockerfile -t webcontainer-runtime:latest . || {
                echo -e "${RED}Failed to build $service${NC}"
                exit 1
            }
            ;;
    esac
    
    echo -e "${GREEN}$service built successfully${NC}"
done

# Deploy services
echo -e "${BLUE}Deploying services...${NC}"

cd "$PROJECT_ROOT/deployment"

# Copy configuration files
cp -r "$PROJECT_ROOT/config" ./config/

# Start services
docker-compose up -d

# Wait for services to start
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 30

# Check deployment status
echo -e "${BLUE}Checking deployment status...${NC}"

running_services=0
total_services=5

for service in sovereign-browser wireguard-server ai-security-service gvisor-sandbox webcontainer-runtime; do
    if docker-compose ps "$service" | grep -q "Up"; then
        ((running_services++))
        echo -e "${GREEN}✓ $service is running${NC}"
    else
        echo -e "${RED}✗ $service is not running${NC}"
    fi
done

echo
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}          Setup Complete!              ${NC}"
echo -e "${BLUE}======================================${NC}"
echo

if [[ $running_services -eq $total_services ]]; then
    echo -e "${GREEN}All $total_services services are running successfully!${NC}"
    echo
    echo -e "${BLUE}Access your Sovereign AI Browser at:${NC}"
    echo -e "  • Browser Frontend: ${YELLOW}http://localhost:8080${NC}"
    echo -e "  • AI Security API: ${YELLOW}http://localhost:8081${NC}"
    echo -e "  • gVisor Sandbox: ${YELLOW}http://localhost:8082${NC}"
    echo -e "  • WebContainer: ${YELLOW}http://localhost:8083${NC}"
    echo
    echo -e "${BLUE}Management commands:${NC}"
    echo -e "  • Check status: ${YELLOW}./deployment/maintain.sh health${NC}"
    echo -e "  • View logs: ${YELLOW}./deployment/maintain.sh logs${NC}"
    echo -e "  • Stop services: ${YELLOW}cd deployment && docker-compose down${NC}"
    echo
    echo -e "${GREEN}Setup completed successfully!${NC}"
else
    echo -e "${RED}Some services failed to start ($running_services/$total_services)${NC}"
    echo -e "${YELLOW}Check logs with: ./deployment/maintain.sh logs${NC}"
    exit 1
fi
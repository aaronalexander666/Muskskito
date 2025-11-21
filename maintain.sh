#!/bin/bash

# Sovereign AI Disposable Browser - Monitoring and Maintenance Script
# Author: MiniMax Agent
# Description: Monitoring, maintenance, and health check utilities

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "${level}" in
        ERROR)   echo -e "${RED}[ERROR]${NC} ${message}" >&2 ;;
        SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} ${message}" ;;
        WARN)    echo -e "${YELLOW}[WARN]${NC} ${message}" ;;
        INFO)    echo -e "${BLUE}[INFO]${NC} ${message}" ;;
    esac
}

# Health check all services
health_check() {
    log INFO "Running comprehensive health check..."
    
    local services=("sovereign-browser" "wireguard-server" "ai-security-service" "gvisor-sandbox" "webcontainer-runtime")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        log INFO "Checking $service..."
        
        if docker-compose ps "$service" 2>/dev/null | grep -q "Up (healthy)"; then
            log SUCCESS "$service is healthy"
        elif docker-compose ps "$service" 2>/dev/null | grep -q "Up"; then
            log WARN "$service is running but may not be healthy"
            all_healthy=false
        else
            log ERROR "$service is not running"
            all_healthy=false
        fi
    done
    
    # Check system resources
    check_resources
    
    if [[ "$all_healthy" == "true" ]]; then
        log SUCCESS "All services are healthy"
        return 0
    else
        log WARN "Some services are not healthy"
        return 1
    fi
}

# Check system resources
check_resources() {
    log INFO "Checking system resources..."
    
    # Memory usage
    local memory_info=$(free -h | awk 'NR==2{printf "Used: %s/%s (%.1f%%)", $3,$2,$3*100/$2}')
    log INFO "Memory: $memory_info"
    
    # Disk usage
    local disk_info=$(df -h / | awk 'NR==2{printf "Used: %s/%s (%.1f%%)", $3,$2,$5}')
    log INFO "Disk: $disk_info"
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    log INFO "CPU usage: ${cpu_usage}%"
    
    # Container count
    local container_count=$(docker ps -q | wc -l)
    log INFO "Running containers: $container_count"
}

# Performance monitoring
monitor_performance() {
    log INFO "Starting performance monitoring (30 seconds)..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + 30))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        local timestamp=$(date '+%H:%M:%S')
        local cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
        local mem=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
        local containers=$(docker ps -q | wc -l)
        
        echo "[$timestamp] CPU: ${cpu}% | Memory: ${mem}% | Containers: $containers"
        sleep 5
    done
}

# Security audit
security_audit() {
    log INFO "Running security audit..."
    
    # Check Docker security
    log INFO "Checking Docker security settings..."
    docker version --format '{{.Server.Version}}'
    
    # Check AppArmor status
    if command_exists aa-status; then
        log INFO "AppArmor status:"
        sudo aa-status 2>/dev/null || log WARN "Cannot read AppArmor status"
    fi
    
    # Check SELinux status
    if command_exists getenforce; then
        log INFO "SELinux status: $(getenforce)"
    fi
    
    # Check kernel security features
    log INFO "Kernel security features:"
    cat /proc/sys/kernel/randomize_va_space
    cat /proc/sys/kernel/kptr_restrict
    cat /proc/sys/net/ipv4/ip_forward
    
    # Check container security context
    if docker info 2>/dev/null | grep -q "Security Options"; then
        log INFO "Docker security options:"
        docker info 2>/dev/null | grep "Security Options"
    fi
}

# Log analysis
analyze_logs() {
    log INFO "Analyzing service logs..."
    
    local services=("sovereign-browser" "ai-security-service" "gvisor-sandbox")
    
    for service in "${services[@]}"; do
        log INFO "Analyzing logs for $service..."
        
        # Check for errors in last 100 lines
        local error_count=$(docker-compose logs --tail=100 "$service" 2>/dev/null | grep -i error | wc -l)
        local warn_count=$(docker-compose logs --tail=100 "$service" 2>/dev/null | grep -i warn | wc -l)
        
        echo "  Errors: $error_count, Warnings: $warn_count"
        
        if [[ $error_count -gt 0 ]]; then
            log WARN "Found $error_count errors in $service logs"
            echo "Recent errors:"
            docker-compose logs --tail=10 "$service" 2>/dev/null | grep -i error
        fi
    done
}

# Backup configuration
backup_configs() {
    log INFO "Creating configuration backup..."
    
    local backup_dir="${PROJECT_ROOT}/backup/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup Docker Compose configuration
    cp "${PROJECT_ROOT}/deployment/docker-compose.yml" "$backup_dir/"
    
    # Backup generated configs
    if [[ -d "${PROJECT_ROOT}/config" ]]; then
        cp -r "${PROJECT_ROOT}/config" "$backup_dir/"
    fi
    
    # Backup WireGuard configuration
    if [[ -d "${PROJECT_ROOT}/deployment/wireguard" ]]; then
        cp -r "${PROJECT_ROOT}/deployment/wireguard" "$backup_dir/"
    fi
    
    log SUCCESS "Configuration backup created at: $backup_dir"
}

# Update services
update_services() {
    log INFO "Updating services..."
    
    cd "$PROJECT_ROOT/deployment"
    
    # Pull latest images
    log INFO "Pulling latest Docker images..."
    docker-compose pull
    
    # Rebuild and redeploy
    log INFO "Rebuilding and redeploying services..."
    docker-compose up -d --build --force-recreate
    
    # Wait for services to start
    log INFO "Waiting for services to start..."
    sleep 30
    
    # Run health check
    health_check
}

# Clean up old resources
cleanup_resources() {
    log INFO "Cleaning up old resources..."
    
    # Remove unused images
    log INFO "Removing unused Docker images..."
    docker image prune -f
    
    # Remove unused volumes
    log INFO "Removing unused volumes..."
    docker volume prune -f
    
    # Remove unused networks
    log INFO "Removing unused networks..."
    docker network prune -f
    
    # Clean up logs older than 7 days
    if [[ -d "${PROJECT_ROOT}/logs" ]]; then
        find "${PROJECT_ROOT}/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    fi
    
    log SUCCESS "Cleanup completed"
}

# Performance optimization
optimize_performance() {
    log INFO "Optimizing system performance..."
    
    # Set Docker daemon optimization
    if [[ -f /etc/docker/daemon.json ]]; then
        log INFO "Updating Docker daemon configuration..."
        sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
    fi
    
    cat << 'EOF' | sudo tee /etc/docker/daemon.json > /dev/null
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
EOF
    
    sudo systemctl restart docker
    
    # Set kernel parameters for containers
    log INFO "Setting kernel parameters for better container performance..."
    cat << 'EOF' | sudo tee /etc/sysctl.d/99-container.conf > /dev/null
net.ipv4.ip_forward=1
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
vm.overcommit_memory=1
vm.swappiness=1
EOF
    
    sudo sysctl -p /etc/sysctl.d/99-container.conf
    
    log SUCCESS "Performance optimization completed"
}

# Generate health report
generate_report() {
    local report_file="${PROJECT_ROOT}/health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    log INFO "Generating health report: $report_file"
    
    {
        echo "Sovereign AI Disposable Browser - Health Report"
        echo "Generated: $(date)"
        echo "=============================================="
        echo
        
        echo "System Information:"
        echo "- OS: $(lsb_release -d 2>/dev/null | cut -f2 || echo "Unknown")"
        echo "- Kernel: $(uname -r)"
        echo "- Docker Version: $(docker --version)"
        echo "- Memory: $(free -h | awk 'NR==2{print $2}')"
        echo "- Disk: $(df -h / | awk 'NR==2{print $2}')"
        echo
        
        echo "Service Status:"
        docker-compose ps
        echo
        
        echo "Resource Usage:"
        echo "- CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
        echo "- Memory: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
        echo "- Disk: $(df -h / | awk 'NR==2{printf "%.1f%%", $3/$2 * 100.0}')"
        echo
        
        echo "Container Count: $(docker ps -q | wc -l)"
        echo
        
        echo "Recent Logs Summary:"
        echo "==================="
        docker-compose logs --tail=20
    } > "$report_file"
    
    log SUCCESS "Health report saved to: $report_file"
}

# Show help
show_help() {
    cat << EOF
Sovereign AI Disposable Browser - Monitoring & Maintenance Script

Usage: $0 [COMMAND]

Commands:
    health         Run comprehensive health check
    resources      Check system resources
    monitor        Monitor performance (30 seconds)
    audit          Run security audit
    logs           Analyze service logs
    backup         Create configuration backup
    update         Update all services
    cleanup        Clean up old resources
    optimize       Optimize system performance
    report         Generate detailed health report
    help           Show this help message

Examples:
    $0 health      # Quick health check
    $0 monitor     # Performance monitoring
    $0 audit       # Security audit
    $0 report      # Generate health report

EOF
}

# Main function
main() {
    local command="${1:-health}"
    
    case "$command" in
        health)
            health_check
            ;;
        resources)
            check_resources
            ;;
        monitor)
            monitor_performance
            ;;
        audit)
            security_audit
            ;;
        logs)
            analyze_logs
            ;;
        backup)
            backup_configs
            ;;
        update)
            update_services
            ;;
        cleanup)
            cleanup_resources
            ;;
        optimize)
            optimize_performance
            ;;
        report)
            generate_report
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

main "$@"
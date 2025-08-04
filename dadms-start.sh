#!/bin/bash

# DADMS System Management Script
# Usage: ./dadms-start.sh [status|start|stop|restart|logs|memory|backup|restore]

# Configuration - match actual container names from docker-compose.yml
DADMS_CONTAINERS=(
    "dadms-postgres"      # postgres
    "dadms-qdrant"        # qdrant  
    "dadms-redis"         # redis
    "neo4j"               # neo4j
    "neo4j-memory"        # neo4j-memory
    "minio"               # minio
    "ollama"              # ollama
    "camunda"             # camunda
    "jupyter-lab"         # jupyter-lab
)

show_status() {
    echo "🎯 DADMS System Status"
    echo "===================="
    echo ""
    
    echo "🐳 Infrastructure (Podman):"
    # More robust container detection
    local running_containers=$(podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -E "(dadms|neo4j|ollama|minio|jupyter|camunda)" || echo "No DADMS containers running")
    echo "$running_containers"
    
    echo ""
    echo "🚀 Applications (PM2):"
    pm2 list 2>/dev/null | grep -E "(dadms-backend|dadms-ui-dev)" || echo "No DADMS applications running"
    
    echo ""
    echo "📋 Key Services:"
    echo "- PostgreSQL: http://localhost:5432"
    echo "- Qdrant: http://localhost:6333"
    echo "- Redis: redis://localhost:6379" 
    echo "- Neo4j: http://localhost:7474"
    echo "- Neo4j Memory: http://localhost:7475"
    echo "- Jupyter: http://localhost:8888"
    echo "- Camunda: http://localhost:8080"
    echo "- MinIO: http://localhost:9001"
    echo "- Ollama: http://localhost:11434"
    echo "- Backend API: http://localhost:3001"
    echo "- Frontend UI: http://localhost:3000"
}

# Improved container detection function
is_container_running() {
    local container_name="$1"
    podman ps --format "{{.Names}}" 2>/dev/null | grep -q "^${container_name}$"
}

# Improved container health check
check_container_health() {
    local container_name="$1"
    local max_attempts="${2:-10}"
    local delay="${3:-3}"
    
    echo "⏳ Checking health of $container_name..."
    for i in $(seq 1 $max_attempts); do
        # First check if container is running
        if ! is_container_running "$container_name"; then
            echo "   Attempt $i/$max_attempts: $container_name not running yet..."
            sleep "$delay"
            continue
        fi
        
        # Check if container is actually responding
        case "$container_name" in
                "dadms-postgres")
                    if podman exec "$container_name" pg_isready -U dadms_user -d dadms >/dev/null 2>&1; then
                        echo "✅ $container_name is healthy"
                        return 0
                    fi
                    ;;
                "dadms-redis")
                    if podman exec "$container_name" redis-cli ping >/dev/null 2>&1; then
                        echo "✅ $container_name is healthy"
                        return 0
                    fi
                    ;;
                "dadms-qdrant")
                    if curl -sf http://localhost:6333/ >/dev/null 2>&1; then
                        echo "✅ $container_name is healthy"
                        return 0
                    fi
                    ;;
                "neo4j")
                    if curl -sf http://localhost:7474 >/dev/null 2>&1; then
                        echo "✅ $container_name is healthy"
                        return 0
                    fi
                    ;;
                "neo4j-memory")
                    if curl -sf http://localhost:7475 >/dev/null 2>&1; then
                        echo "✅ $container_name is healthy"
                        return 0
                    fi
                    ;;
                "ollama")
                    if curl -sf http://localhost:11434 >/dev/null 2>&1; then
                        echo "✅ $container_name is healthy"
                        return 0
                    fi
                    ;;
                "minio")
                    if curl -sf http://localhost:9000/minio/health/live >/dev/null 2>&1; then
                        echo "✅ $container_name is healthy"
                        return 0
                    fi
                    ;;
                "camunda")
                    if curl -sf http://localhost:8080/engine-rest/engine >/dev/null 2>&1; then
                        echo "✅ $container_name is healthy"
                        return 0
                    fi
                    ;;
                "jupyter-lab")
                    if curl -sf http://localhost:8888/api/status >/dev/null 2>&1; then
                        echo "✅ $container_name is healthy"
                        return 0
                    fi
                    ;;
                *)
                    # For containers without specific health checks, just check if running
                    echo "✅ $container_name is running"
                    return 0
                    ;;
            esac
        
        echo "   Attempt $i/$max_attempts: $container_name not ready yet..."
        sleep "$delay"
    done
    
    echo "❌ $container_name failed health check after $max_attempts attempts"
    return 1
}

wait_for_service() {
    local service_name="$1"
    local max_attempts="$2"
    local check_cmd="$3"
    
    echo "⏳ Waiting for $service_name to be ready..."
    for i in $(seq 1 $max_attempts); do
        if eval "$check_cmd" >/dev/null 2>&1; then
            echo "✅ $service_name is ready"
            return 0
        fi
        echo "   Attempt $i/$max_attempts: $service_name not ready yet..."
        sleep 3
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

start_infrastructure_tier() {
    local tier="$1"
    shift
    local services=("$@")
    
    echo "🚀 Starting $tier services: ${services[*]}"
    
    # Start services with better error handling
    if ! podman-compose -f dadms-infrastructure/docker-compose.yml up -d "${services[@]}" 2>/dev/null; then
        echo "⚠️  Some services in $tier may have failed to start"
    fi
    
    # Wait for services to be healthy with improved detection
    local failed_services=()
    for service in "${services[@]}"; do
        # Map service names to container names
        local container_name
        case "$service" in
            "postgres") container_name="dadms-postgres" ;;
            "redis") container_name="dadms-redis" ;;
            "qdrant") container_name="dadms-qdrant" ;;
            "neo4j") container_name="neo4j" ;;
            "neo4j-memory") container_name="neo4j-memory" ;;
            "minio") container_name="minio" ;;
            "ollama") container_name="ollama" ;;
            "camunda") container_name="camunda" ;;
            "jupyter-lab") container_name="jupyter-lab" ;;
            *) container_name="$service" ;;
        esac
        
        # Optimized timeouts - Neo4j needs a bit more time but not excessive
        local health_timeout=15
        local health_delay=2
        if [[ "$container_name" == "neo4j" || "$container_name" == "neo4j-memory" ]]; then
            health_timeout=25
            health_delay=3
        fi
        
        if ! check_container_health "$container_name" "$health_timeout" "$health_delay"; then
            failed_services+=("$container_name")
            echo "⚠️  $container_name failed health check, but continuing..."
        fi
    done
    
    # Report any failed services
    if [ ${#failed_services[@]} -gt 0 ]; then
        echo "⚠️  Some services failed health checks: ${failed_services[*]}"
        echo "   You can check logs with: ./dadms-start.sh logs"
        echo "   Or restart specific services manually"
    fi
}

start_services() {
    echo "🎯 Starting DADMS Infrastructure in Tiers..."
    
    # Check if we're in the right directory
    if [ ! -f "dadms-infrastructure/docker-compose.yml" ]; then
        echo "❌ Error: docker-compose.yml not found. Please run from the DADMS root directory."
        return 1
    fi
    
    # Tier 1: Core databases
    start_infrastructure_tier "Core Database" "postgres" "redis"
    
    # Tier 2: Specialized databases (depends on core being stable)
    start_infrastructure_tier "Graph & Vector Databases" "neo4j" "qdrant"
    
    # Tier 3: Neo4j Memory (now starts independently)
    start_infrastructure_tier "Memory Database" "neo4j-memory"
    
    # Tier 4: Application services
    start_infrastructure_tier "Application Services" "minio" "ollama"
    
    # Tier 5: Optional services (non-critical)
    echo "🚀 Starting optional services..."
    podman-compose -f dadms-infrastructure/docker-compose.yml up -d camunda jupyter-lab >/dev/null 2>&1 || echo "⚠️  Some optional services may have failed (continuing...)"
    
    echo ""
    echo "🔧 Starting DADMS Backend Services..."
    # Clean up old PM2 processes first
    pm2 delete dadms-backend >/dev/null 2>&1 || true
    pm2 delete dadms-ui-dev >/dev/null 2>&1 || true
    
    # Start backend service
    if [ -d "dadms-services/user-project" ]; then
        cd dadms-services/user-project
        pm2 start npm --name dadms-backend -- run dev >/dev/null 2>&1 && echo "✅ Backend started" || echo "❌ Backend failed"
        cd ../..
    fi
    
    # Start frontend UI
    if [ -d "dadms-ui" ]; then
        cd dadms-ui
        pm2 start npm --name dadms-ui-dev -- run dev >/dev/null 2>&1 && echo "✅ Frontend started" || echo "❌ Frontend failed"
        cd ..
    fi
    
    echo ""
    echo "📋 Final Service Status:"
    pm2 list 2>/dev/null || echo "   PM2 not available"
}

start_services_quick() {
    echo "🎯 Quick Starting DADMS Infrastructure..."
    
    # Check if we're in the right directory
    if [ ! -f "dadms-infrastructure/docker-compose.yml" ]; then
        echo "❌ Error: docker-compose.yml not found. Please run from the DADMS root directory."
        return 1
    fi
    
    # Start all services at once - NO health checks, just start and go
    echo "🚀 Starting all infrastructure services..."
    podman-compose -f dadms-infrastructure/docker-compose.yml up -d
    
    echo "⏳ Waiting 5 seconds for services to initialize..."
    sleep 5
    
    echo "🔧 Starting DADMS Backend Services..."
    # Clean up old PM2 processes first
    pm2 delete dadms-backend >/dev/null 2>&1 || true
    pm2 delete dadms-ui-dev >/dev/null 2>&1 || true
    
    # Start backend service
    if [ -d "dadms-services/user-project" ]; then
        cd dadms-services/user-project
        pm2 start npm --name dadms-backend -- run dev >/dev/null 2>&1 && echo "✅ Backend started" || echo "❌ Backend failed"
        cd ../..
    fi
    
    # Start frontend UI
    if [ -d "dadms-ui" ]; then
        cd dadms-ui
        pm2 start npm --name dadms-ui-dev -- run dev >/dev/null 2>&1 && echo "✅ Frontend started" || echo "❌ Frontend failed"
        cd ..
    fi
    
    echo ""
    echo "📋 Quick Start Complete!"
    echo "   Use './dadms-start.sh status' to check service health"
    echo "   Use './dadms-start.sh diagnose' for detailed health check"
    echo "   Note: Some services may still be starting up in the background"
}

stop_services() {
    echo "🛑 Stopping DADMS Application Services..."
    pm2 delete dadms-backend >/dev/null 2>&1 || true
    pm2 delete dadms-ui-dev >/dev/null 2>&1 || true
    
    echo "🛑 Stopping DADMS Infrastructure..."
    podman-compose -f dadms-infrastructure/docker-compose.yml down
}

restart_services() {
    echo "🔄 Restarting DADMS Infrastructure..."
    stop_services
    echo "⏳ Waiting for complete shutdown..."
    sleep 5
    echo "🔄 Starting fresh..."
    start_services
}

restart_neo4j() {
    echo "🔄 Restarting Neo4j Services..."
    echo "🛑 Stopping Neo4j services..."
    podman-compose -f dadms-infrastructure/docker-compose.yml stop neo4j neo4j-memory >/dev/null 2>&1 || true
    
    # Remove containers manually since podman-compose rm isn't supported
    podman rm -f neo4j neo4j-memory >/dev/null 2>&1 || true
    
    echo "⏳ Waiting for complete shutdown..."
    sleep 3
    
    echo "🚀 Starting Neo4j services..."
    start_infrastructure_tier "Neo4j Services" "neo4j" "neo4j-memory"
}

diagnose_services() {
    echo "🔍 DADMS Service Diagnostics"
    echo "============================"
    echo ""
    
    # Use the actual container names from docker-compose.yml
    services=("dadms-postgres" "dadms-redis" "dadms-qdrant" "neo4j" "neo4j-memory" "minio" "ollama" "camunda" "jupyter-lab")
    
    for service in "${services[@]}"; do
        echo "🔍 $service:"
        if is_container_running "$service"; then
            status=$(podman ps --format "{{.Names}}\t{{.Status}}" | grep "^${service}" | cut -f2)
            echo "   Status: ✅ $status"
            
            # Quick health check
            case "$service" in
                "dadms-postgres")
                    podman exec "$service" pg_isready -U dadms_user -d dadms >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
                "dadms-redis")
                    podman exec "$service" redis-cli ping >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
                "dadms-qdrant")
                    curl -sf http://localhost:6333/ >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
                "neo4j")
                    curl -sf http://localhost:7474 >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
                "neo4j-memory")
                    curl -sf http://localhost:7475 >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
                "ollama")
                    curl -sf http://localhost:11434 >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
                "minio")
                    curl -sf http://localhost:9000/minio/health/live >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
                "camunda")
                    curl -sf http://localhost:8080/engine-rest/engine >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
                "jupyter-lab")
                    curl -sf http://localhost:8888/api/status >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
            esac
        else
            echo "   Status: ❌ Not running"
        fi
        echo ""
    done
}

show_logs() {
    echo "📝 DADMS Service Logs:"
    echo "====================="
    
    services=("dadms-postgres" "dadms-qdrant" "dadms-redis" "neo4j" "neo4j-memory" "ollama")
    
    for service in "${services[@]}"; do
        echo ""
        echo "--- $service ---"
        if is_container_running "$service"; then
            podman logs --tail 5 "$service" 2>/dev/null || echo "Could not retrieve logs"
        else
            echo "Container not running"
        fi
    done
}

backup_memory() {
    echo "💾 Backing up MCP memory..."
    ./scripts/backup-memory.sh
}

restore_memory() {
    echo "📥 Restoring MCP memory..."
    ./scripts/restore-memory.sh "$1"
}

show_memory_info() {
    echo "🧠 MCP Memory Information"
    echo "========================"
    echo ""
    
    if is_container_running "neo4j-memory"; then
        echo "✅ Neo4j Memory Server: Running"
        echo "🌐 Web Interface: http://localhost:7475"
        echo "🔌 Bolt Connection: neo4j://localhost:7688"
        echo "👤 Credentials: neo4j/memorypassword"
        echo ""
        
        # Show memory stats
        echo "📊 Memory Database Stats:"
        podman exec neo4j-memory cypher-shell -u neo4j -p memorypassword \
            "MATCH (n) RETURN labels(n)[0] as Type, count(n) as Count" 2>/dev/null || echo "   Could not retrieve stats"
    else
        echo "❌ Neo4j Memory Server: Not Running"
        echo "   Start with: ./dadms-start.sh start"
    fi
    
    echo ""
    echo "🗂️  Available Backups:"
    if [ -d "./backups/mcp-memory" ]; then
        ls -la ./backups/mcp-memory/mcp-memory-backup-*.cypher.gz 2>/dev/null | \
            awk '{print "   " $9 " (" $5 " bytes) - " $6 " " $7 " " $8}' || echo "   No backups found"
    else
        echo "   No backup directory found"
    fi
}

case "$1" in
    "status"|"")
        show_status
        ;;
    "start")
        start_services
        ;;
    "start-quick")
        echo "🚀 Quick start - starting services with minimal health checks..."
        start_services_quick
        ;;
    "stop") 
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "restart-neo4j")
        restart_neo4j
        ;;
    "diagnose")
        diagnose_services
        ;;
    "logs")
        show_logs
        ;;
    "memory")
        show_memory_info
        ;;
    "backup")
        backup_memory
        ;;
    "restore")
        restore_memory "$2"
        ;;
    *)
        echo "🎯 DADMS System Management"
        echo "Usage: $0 [command]"
        echo ""
        echo "📋 Infrastructure Commands:"
        echo "  status        - Show service status (default)"
        echo "  start         - Start all services with robust sequencing"
        echo "  start-quick   - Quick start (faster, minimal health checks)"
        echo "  stop          - Stop all services"
        echo "  restart       - Restart all services"
        echo "  restart-neo4j - Restart only Neo4j services"
        echo "  diagnose      - Run comprehensive service diagnostics"
        echo "  logs          - Show recent logs"
        echo ""
        echo "🧠 Memory Management Commands:"
        echo "  memory        - Show MCP memory information"
        echo "  backup        - Backup MCP memory data"
        echo "  restore       - Restore MCP memory from backup"
        echo "                Usage: $0 restore <backup-file>"
        echo "                Usage: $0 restore latest"
        echo ""
        echo "🔧 Troubleshooting:"
        echo "  ./dadms-start.sh diagnose    - Check service health"
        echo "  ./dadms-start.sh restart-neo4j - Fix Neo4j issues"
        echo "  ./dadms-start.sh logs        - View error logs"
        ;;
esac

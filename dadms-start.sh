#!/bin/bash

# DADMS System Management Script
# Usage: ./dadms-start.sh [status|start|stop|restart|logs|memory|backup|restore]

show_status() {
    echo "🎯 DADMS System Status"
    echo "===================="
    echo ""
    
    echo "🐳 Infrastructure (Podman):"
    podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(dadms|neo4j|ollama|minio|jupyter|camunda)" || echo "No DADMS containers running"
    
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
    podman-compose -f dadms-infrastructure/docker-compose.yml up -d "${services[@]}"
    
    # Wait for services to be healthy
    for service in "${services[@]}"; do
        case "$service" in
            "postgres")
                wait_for_service "PostgreSQL" 20 "podman exec dadms-postgres pg_isready -U dadms_user -d dadms"
                ;;
            "redis")
                wait_for_service "Redis" 10 "podman exec dadms-redis redis-cli ping"
                ;;
            "qdrant")
                wait_for_service "Qdrant" 15 "curl -sf http://localhost:6333/health"
                ;;
            "neo4j")
                wait_for_service "Neo4j Main" 30 "curl -sf http://localhost:7474"
                ;;
            "neo4j-memory")
                wait_for_service "Neo4j Memory" 30 "curl -sf http://localhost:7475"
                ;;
            "minio")
                wait_for_service "MinIO" 15 "curl -sf http://localhost:9000/minio/health/live"
                ;;
            "ollama")
                wait_for_service "Ollama" 15 "curl -sf http://localhost:11434"
                ;;
            "camunda")
                wait_for_service "Camunda" 30 "curl -sf http://localhost:8080/engine-rest/engine"
                ;;
            "jupyter-lab")
                wait_for_service "Jupyter Lab" 25 "curl -sf http://localhost:8888/api/status"
                ;;
        esac
    done
}

start_services() {
    echo "🎯 Starting DADMS Infrastructure in Tiers..."
    
    # Tier 1: Core databases
    start_infrastructure_tier "Core Database" "postgres" "redis"
    
    # Tier 2: Specialized databases (depends on core being stable)
    start_infrastructure_tier "Graph & Vector Databases" "neo4j" "qdrant"
    
    # Tier 3: Neo4j Memory (depends on main Neo4j)
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
    
    services=("dadms-postgres" "dadms-redis" "dadms-qdrant" "neo4j" "neo4j-memory" "minio" "ollama" "camunda" "jupyter-lab")
    
    for service in "${services[@]}"; do
        echo "🔍 $service:"
        if podman ps --format "{{.Names}}" | grep -q "^${service}$"; then
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
                "neo4j")
                    curl -sf http://localhost:7474 >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
                    ;;
                "neo4j-memory")
                    curl -sf http://localhost:7475 >/dev/null 2>&1 && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Not responding"
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
        podman logs --tail 5 "$service" 2>/dev/null || echo "Service not found"
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
    
    if podman ps | grep -q "neo4j-memory"; then
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

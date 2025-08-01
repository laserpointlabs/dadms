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

start_services() {
    echo "🚀 Starting DADMS Infrastructure..."
    podman-compose -f dadms-infrastructure/docker-compose.yml up -d
    
    echo "⏳ Waiting for infrastructure to stabilize..."
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
    
    echo "📋 Service Status:"
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
    sleep 2
    start_services
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
        echo "Usage: $0 [status|start|stop|restart|logs|memory|backup|restore]"
        echo ""
        echo "Infrastructure Commands:"
        echo "  status   - Show service status (default)"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - Show recent logs"
        echo ""
        echo "Memory Management Commands:"
        echo "  memory   - Show MCP memory information"
        echo "  backup   - Backup MCP memory data"
        echo "  restore  - Restore MCP memory from backup"
        echo "           Usage: $0 restore <backup-file>"
        echo "           Usage: $0 restore latest"
        ;;
esac

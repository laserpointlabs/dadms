#!/bin/bash

# DADMS Server Management Script (Podman)
# Usage: ./dadms-servers.sh [status|start|stop|restart|logs]

show_status() {
    echo "🎯 DADMS Infrastructure Status (Podman)"
    echo "======================================"
    echo ""
    
    podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(dadms|neo4j|ollama|minio|jupyter|camunda)" || echo "No DADMS containers running"
    
    echo ""
    echo "📋 Key Services:"
    echo "- PostgreSQL: http://localhost:5432"
    echo "- Qdrant: http://localhost:6333"
    echo "- Redis: redis://localhost:6379" 
    echo "- Neo4j: http://localhost:7474"
    echo "- Jupyter: http://localhost:8888"
    echo "- Camunda: http://localhost:8080"
    echo "- MinIO: http://localhost:9001"
    echo "- Ollama: http://localhost:11434"
}

start_services() {
    echo "🚀 Starting DADMS Infrastructure..."
    podman-compose -f dadms-infrastructure/docker-compose.yml up -d
}

stop_services() {
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
    
    services=("dadms-postgres" "dadms-qdrant" "dadms-redis" "neo4j" "ollama")
    
    for service in "${services[@]}"; do
        echo ""
        echo "--- $service ---"
        podman logs --tail 5 "$service" 2>/dev/null || echo "Service not found"
    done
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
    *)
        echo "Usage: $0 [status|start|stop|restart|logs]"
        echo ""
        echo "Commands:"
        echo "  status   - Show service status (default)"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - Show recent logs"
        ;;
esac

#!/bin/bash

# DADMS Container Diagnostic Script
# Helps troubleshoot container detection and startup issues

echo "🔍 DADMS Container Diagnostic"
echo "============================"
echo ""

# Check if we're in the right directory
if [ ! -f "dadms-infrastructure/docker-compose.yml" ]; then
    echo "❌ Error: Not in DADMS root directory or docker-compose.yml not found"
    exit 1
fi

echo "📋 Environment Check:"
echo "===================="
echo "Current directory: $(pwd)"
echo "Docker compose file exists: ✅"
echo "Podman available: $(command -v podman >/dev/null && echo "✅" || echo "❌")"
echo "Podman-compose available: $(command -v podman-compose >/dev/null && echo "✅" || echo "❌")"
echo ""

echo "🐳 Container Status:"
echo "==================="

# Expected containers from docker-compose.yml
expected_containers=(
    "dadms-postgres"
    "dadms-qdrant" 
    "dadms-redis"
    "neo4j"
    "neo4j-memory"
    "minio"
    "ollama"
    "camunda"
    "jupyter-lab"
)

# Check each expected container
for container in "${expected_containers[@]}"; do
    echo "🔍 $container:"
    
    # Check if container exists (running or stopped)
    if podman ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
        # Check if it's running
        if podman ps --format "{{.Names}}" | grep -q "^${container}$"; then
            status=$(podman ps --format "{{.Names}}\t{{.Status}}" | grep "^${container}" | cut -f2)
            echo "   Status: ✅ Running ($status)"
            
            # Health check based on container type
            case "$container" in
                "dadms-postgres")
                    if podman exec "$container" pg_isready -U dadms_user -d dadms >/dev/null 2>&1; then
                        echo "   Health: ✅ Database responding"
                    else
                        echo "   Health: ❌ Database not responding"
                    fi
                    ;;
                "dadms-redis")
                    if podman exec "$container" redis-cli ping >/dev/null 2>&1; then
                        echo "   Health: ✅ Redis responding"
                    else
                        echo "   Health: ❌ Redis not responding"
                    fi
                    ;;
                "dadms-qdrant")
                    if curl -sf http://localhost:6333/ >/dev/null 2>&1; then
                        echo "   Health: ✅ Qdrant responding"
                    else
                        echo "   Health: ❌ Qdrant not responding"
                    fi
                    ;;
                "neo4j")
                    if curl -sf http://localhost:7474 >/dev/null 2>&1; then
                        echo "   Health: ✅ Neo4j responding"
                    else
                        echo "   Health: ❌ Neo4j not responding"
                    fi
                    ;;
                "neo4j-memory")
                    if curl -sf http://localhost:7475 >/dev/null 2>&1; then
                        echo "   Health: ✅ Neo4j Memory responding"
                    else
                        echo "   Health: ❌ Neo4j Memory not responding"
                    fi
                    ;;
                "ollama")
                    if curl -sf http://localhost:11434 >/dev/null 2>&1; then
                        echo "   Health: ✅ Ollama responding"
                    else
                        echo "   Health: ❌ Ollama not responding"
                    fi
                    ;;
                "minio")
                    if curl -sf http://localhost:9000/minio/health/live >/dev/null 2>&1; then
                        echo "   Health: ✅ MinIO responding"
                    else
                        echo "   Health: ❌ MinIO not responding"
                    fi
                    ;;
                "camunda")
                    if curl -sf http://localhost:8080/engine-rest/engine >/dev/null 2>&1; then
                        echo "   Health: ✅ Camunda responding"
                    else
                        echo "   Health: ❌ Camunda not responding"
                    fi
                    ;;
                "jupyter-lab")
                    if curl -sf http://localhost:8888/api/status >/dev/null 2>&1; then
                        echo "   Health: ✅ Jupyter responding"
                    else
                        echo "   Health: ❌ Jupyter not responding"
                    fi
                    ;;
                *)
                    echo "   Health: ⚠️  No health check defined"
                    ;;
            esac
        else
            echo "   Status: ⏸️  Stopped"
            echo "   Health: ❌ Not running"
        fi
    else
        echo "   Status: ❌ Container not found"
        echo "   Health: ❌ Not created"
    fi
    echo ""
done

echo "🔧 Troubleshooting Commands:"
echo "==========================="
echo "Start all services: ./dadms-start.sh start"
echo "Restart Neo4j: ./dadms-start.sh restart-neo4j"
echo "View logs: ./dadms-start.sh logs"
echo "Check status: ./dadms-start.sh status"
echo ""

echo "📊 Port Usage:"
echo "=============="
echo "PostgreSQL: 5432"
echo "Qdrant: 6333"
echo "Redis: 6379"
echo "Neo4j: 7474"
echo "Neo4j Memory: 7475"
echo "MinIO: 9000"
echo "Ollama: 11434"
echo "Camunda: 8080"
echo "Jupyter: 8888"
echo ""

# Check for port conflicts
echo "🔍 Port Conflict Check:"
echo "======================"
ports=(5432 6333 6379 7474 7475 9000 11434 8080 8888)
for port in "${ports[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "⚠️  Port $port is in use"
    else
        echo "✅ Port $port is available"
    fi
done 
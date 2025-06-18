#!/bin/bash

# DADM Backend Management Script
# Use this when the backend is down and UI buttons don't work

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    echo "DADM Backend Management"
    echo "======================="
    echo ""
    echo "Usage: ./manage-backend.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start both backend API server and analysis daemon"
    echo "  stop      - Stop both servers"
    echo "  restart   - Restart both servers"
    echo "  status    - Show server status"
    echo "  logs      - Show backend logs"
    echo "  monitor   - Open PM2 monitoring dashboard"
    echo ""
    echo "Examples:"
    echo "  ./manage-backend.sh start"
    echo "  ./manage-backend.sh status"
    echo ""
}

case "$1" in
    start)
        echo "🚀 Starting DADM backend servers..."
        npm run backend:start
        echo ""
        echo "✅ Backend started! Services available:"
        echo "   🌐 API Server: http://localhost:8000"
        echo "   ⚙️  Analysis Daemon: Running in background"
        echo ""
        ;;
    stop)
        echo "🛑 Stopping DADM backend servers..."
        pm2 stop all
        echo "✅ All servers stopped!"
        ;;
    restart)
        echo "🔄 Restarting DADM backend servers..."
        npm run backend:restart
        echo "✅ Servers restarted!"
        ;;
    status)
        echo "📊 DADM Backend Status:"
        echo "======================"
        npm run backend:status
        ;;
    logs)
        echo "📝 Backend Logs:"
        echo "==============="
        npm run backend:logs
        ;;
    monitor)
        echo "📊 Opening PM2 monitoring dashboard..."
        npm run backend:monitor
        ;;
    ""|help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

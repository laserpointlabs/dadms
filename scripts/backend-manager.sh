#!/bin/bash

# DADM Backend Management Script
# This script helps manage the DADM backend server using PM2

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
UI_DIR="$PROJECT_ROOT/ui"

cd "$UI_DIR"

case "$1" in
    start)
        echo "🚀 Starting DADM backend server..."
        pm2 start ecosystem.config.js
        echo "✅ Backend started successfully!"
        echo "📊 Use 'npm run backend:status' to check status"
        ;;
    stop)
        echo "🛑 Stopping DADM backend server..."
        pm2 stop dadm-backend
        echo "✅ Backend stopped successfully!"
        ;;
    restart)
        echo "🔄 Restarting DADM backend server..."
        pm2 restart dadm-backend
        echo "✅ Backend restarted successfully!"
        ;;
    status)
        echo "📊 DADM Backend Status:"
        pm2 status dadm-backend
        ;;
    logs)
        echo "📝 DADM Backend Logs (Press Ctrl+C to exit):"
        pm2 logs dadm-backend --lines 50
        ;;
    monitor)
        echo "📈 Opening PM2 monitoring dashboard..."
        pm2 monit
        ;;
    delete)
        echo "🗑️  Deleting DADM backend process..."
        pm2 delete dadm-backend
        echo "✅ Backend process deleted!"
        ;;
    health)
        echo "🔍 Checking backend health..."
        if curl -s http://localhost:8000/api/health > /dev/null; then
            echo "✅ Backend is healthy and responding!"
            curl -s http://localhost:8000/api/health | jq '.'
        else
            echo "❌ Backend is not responding!"
            exit 1
        fi
        ;;
    install-pm2)
        echo "📦 Installing PM2 globally..."
        sudo npm install -g pm2
        echo "✅ PM2 installed successfully!"
        ;;
    setup-startup)
        echo "🔧 Setting up PM2 auto-startup..."
        pm2 save
        echo "✅ Current process list saved!"
        echo "💡 To enable auto-startup on boot, run:"
        echo "   pm2 startup"
        echo "   Then run the command it provides with sudo"
        ;;
    *)
        echo "DADM Backend Management Script"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|monitor|delete|health|install-pm2|setup-startup}"
        echo ""
        echo "Commands:"
        echo "  start          Start the backend server"
        echo "  stop           Stop the backend server"
        echo "  restart        Restart the backend server"
        echo "  status         Show backend process status"
        echo "  logs           Show backend logs (real-time)"
        echo "  monitor        Open PM2 monitoring dashboard"
        echo "  delete         Delete the backend process"
        echo "  health         Check if backend is responding"
        echo "  install-pm2    Install PM2 globally"
        echo "  setup-startup  Configure auto-startup on boot"
        echo ""
        echo "Examples:"
        echo "  $0 start       # Start the backend"
        echo "  $0 logs        # View logs"
        echo "  $0 health      # Check if server is responding"
        exit 1
        ;;
esac

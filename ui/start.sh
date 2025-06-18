#!/bin/bash

# DADM UI Startup Script
# This script helps with WSL path issues and ensures proper startup

echo "🚀 Starting DADM React UI..."

# Set environment variables
export NODE_ENV=development
export BROWSER=none
export FORCE_COLOR=1

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the ui directory."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Clear any previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/
rm -rf .cache/

# Start the development server
echo "🌐 Starting development server..."
echo "📍 API will connect to: ${REACT_APP_API_BASE_URL:-http://localhost:8000}"
echo "🔌 WebSocket will connect to: ${REACT_APP_WS_URL:-ws://localhost:8001}"
echo ""
echo "🎯 Access the UI at: http://localhost:3000"
echo "⏹️  Press Ctrl+C to stop"
echo ""

# Use npx to ensure we're using the local version
npx react-scripts start

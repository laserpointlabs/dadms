#!/bin/bash

# Build and Test Analysis Service with Docker
set -e

echo "🚀 Building Analysis Service Docker Image..."

# Change to the docker directory
cd /home/jdehart/dadm/docker

# Build just the analysis service
docker-compose build analysis-service

echo "✅ Analysis Service built successfully!"

echo "🔄 Starting Analysis Service with dependencies..."

# Start dependencies and analysis service
docker-compose up -d consul postgres prompt-service analysis-service

echo "⏱️  Waiting for services to start..."
sleep 10

echo "🩺 Testing service health..."

# Test prompt service
echo "Testing Prompt Service..."
curl -s http://localhost:5300/health | jq . || echo "Prompt service not ready"

# Test analysis service
echo "Testing Analysis Service..."
curl -s http://localhost:8002/health | jq . || echo "Analysis service not ready"

echo "🐛 Testing configuration endpoints..."
curl -s http://localhost:8002/debug/config | jq . || echo "Config endpoint not ready"

echo "🔗 Testing connectivity..."
curl -s http://localhost:8002/debug/connectivity | jq . || echo "Connectivity endpoint not ready"

echo "📋 Available templates..."
curl -s http://localhost:8002/templates | jq . || echo "Templates endpoint not ready"

echo "📊 Service logs (last 20 lines):"
docker-compose logs --tail=20 analysis-service

echo "🎉 Analysis Service is ready! Available at:"
echo "   - Health: http://localhost:8002/health"
echo "   - Config Debug: http://localhost:8002/debug/config"
echo "   - Connectivity: http://localhost:8002/debug/connectivity"
echo "   - Templates: http://localhost:8002/templates"
echo ""
echo "🛑 To stop: docker-compose down"
echo "📝 To view logs: docker-compose logs -f analysis-service"

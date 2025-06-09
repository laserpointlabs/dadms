#!/bin/bash
# Echo Service Rebuild Script
# This script rebuilds the echo service container with the correct dependencies

echo "Rebuilding Echo Service container..."

# Stop the container if running
docker-compose -f docker/docker-compose.yml down echo-service

# Build with no cache to ensure fresh dependencies
docker-compose -f docker/docker-compose.yml build --no-cache echo-service

# Start the service
docker-compose -f docker/docker-compose.yml up -d echo-service

# Show logs
echo "Echo Service container rebuilt and started. Showing logs:"
docker-compose -f docker/docker-compose.yml logs -f echo-service
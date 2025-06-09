@echo off
REM Echo Service Rebuild Script for Windows
REM This script rebuilds the echo service container with the correct dependencies

echo Rebuilding Echo Service container...

REM Stop the container if running
docker-compose -f docker/docker-compose.yml down echo-service

REM Build with no cache to ensure fresh dependencies
docker-compose -f docker/docker-compose.yml build --no-cache echo-service

REM Start the service
docker-compose -f docker/docker-compose.yml up -d echo-service

REM Show logs
echo Echo Service container rebuilt and started. Showing logs:
docker-compose -f docker/docker-compose.yml logs -f echo-service
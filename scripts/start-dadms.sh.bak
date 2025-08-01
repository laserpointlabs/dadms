#!/bin/bash

# DADMS System Startup Script
# This script starts the infrastructure, backend, and frontend services for DADMS 2.0
# Usage: ./start-dadms.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function print_step() {
  echo -e "${YELLOW}==> $1${NC}"
}
function print_success() {
  echo -e "${GREEN}✔ $1${NC}"
}
function print_error() {
  echo -e "${RED}✖ $1${NC}"
}

print_step "[0/3] Cleaning up old pm2 processes..."
pm2 delete dadms-backend >/dev/null 2>&1 || true
pm2 delete dadms-ui-dev >/dev/null 2>&1 || true
print_success "Old pm2 processes cleaned up."

# 1. Start infrastructure
print_step "[1/3] Starting infrastructure with Podman Compose..."
cd ~/dadms/dadms-infrastructure
if podman-compose up -d --build; then
  print_success "Infrastructure started successfully."
else
  print_error "Infrastructure failed to start. Check podman-compose logs."
  exit 1
fi
sleep 5
cd ~/dadms

# 2. Start backend service
print_step "[2/3] Starting backend service with pm2..."
cd ~/dadms/dadms-services/user-project
if pm2 start npm --name dadms-backend -- run dev >/dev/null 2>&1; then
  print_success "Backend service started (pm2: dadms-backend)."
else
  print_error "Backend service failed to start. Check pm2 logs."
  exit 1
fi
cd ~/dadms

# 3. Start frontend UI
print_step "[3/3] Starting frontend UI with pm2..."
cd ~/dadms/dadms-ui
if pm2 start npm --name dadms-ui-dev -- run dev >/dev/null 2>&1; then
  print_success "Frontend UI started (pm2: dadms-ui-dev)."
else
  print_error "Frontend UI failed to start. Check pm2 logs."
  exit 1
fi
cd ~/dadms

pm2 list

print_success "\nDADMS system started successfully!"
echo -e "${YELLOW}To view running services: podman ps, pm2 list${NC}"
echo -e "${YELLOW}To stop all services: podman-compose down (in infrastructure dir), pm2 delete all${NC}" 
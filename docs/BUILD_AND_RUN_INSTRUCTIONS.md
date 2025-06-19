# DADM Build and Run Instructions

This document provides comprehensive instructions for building and running the DADM (Decision Analysis Decision Management) system, including both frontend and backend components.

## System Architecture Overview

The DADM system consists of:
- **Frontend**: React application running in Docker or natively
- **Backend API**: Node.js server managed by PM2
- **Analysis Daemon**: Python service for background processing
- **Supporting Services**: Camunda, PostgreSQL, Neo4j, Qdrant, Consul

## Current Working Configuration (Verified June 19, 2025)

### Backend Services

The backend consists of two main components managed by PM2:
1. **dadm-backend**: Node.js API server (port 8000)
2. **dadm-analysis-daemon**: Python background processing service

#### Backend Commands

```bash
# Start backend services
cd /home/jdehart/dadm/ui && npm run backend:start

# Restart backend services
cd /home/jdehart/dadm/ui && npm run backend:restart

# Check backend status
cd /home/jdehart/dadm/ui && npm run backend:status

# Stop backend services
cd /home/jdehart/dadm/ui && npm run backend:stop

# View backend logs
cd /home/jdehart/dadm/ui && npm run backend:logs

# Monitor backend services
cd /home/jdehart/dadm/ui && npm run backend:monitor
```

#### Backend Configuration

Backend services are configured via `ecosystem.config.js`:
- **dadm-backend**: Runs on port 8000, serves REST API
- **dadm-analysis-daemon**: Python background service for analysis processing

### Frontend Application

The frontend is a React application that can run in two modes:

#### 1. Development Mode (Recommended for Development)

```bash
# Start frontend development container
cd /home/jdehart/dadm/ui && docker-compose --profile dev up dadm-ui-dev

# Alternative: Run frontend natively (if container fails)
cd /home/jdehart/dadm/ui && PORT=3001 BROWSER=none npm start
```

**Development Configuration:**
- Uses `Dockerfile.dev` for hot reloading
- Proxies API calls to `http://localhost:8000`
- Environment variables applied at runtime
- Volume mounted for live code changes

#### 2. Production Mode

```bash
# Start frontend production container
cd /home/jdehart/dadm/ui && docker-compose up dadm-ui
```

**Production Configuration:**
- Uses production `Dockerfile` with optimized build
- Environment variables baked in at build time
- Serves static files via nginx

### Docker Services (Supporting Infrastructure)

The main Docker infrastructure runs from the main docker directory:

```bash
# Start all supporting services
cd /home/jdehart/dadm/docker && docker-compose up -d

# Check service status
cd /home/jdehart/dadm/docker && docker-compose ps

# View service logs
cd /home/jdehart/dadm/docker && docker-compose logs [service-name]
```

**Services included:**
- **Camunda BPM**: Process engine (port 8080)
- **PostgreSQL**: Database (port 5432)
- **Neo4j**: Graph database (ports 7474, 7687)
- **Qdrant**: Vector database (ports 6333, 6334)
- **Consul**: Service registry (port 8500)
- **OpenAI Service**: AI assistant (port 5000)
- **Echo Service**: Test service (port 5100)
- **Service Monitor**: Health monitoring (port 5200)

## Complete Startup Sequence

### 1. Start Supporting Infrastructure

```bash
cd /home/jdehart/dadm/docker && docker-compose up -d
```

Wait for all services to be healthy (check with `docker-compose ps`).

### 2. Start Backend Services

```bash
cd /home/jdehart/dadm/ui && npm run backend:restart
cd /home/jdehart/dadm/ui && npm run backend:status
```

Verify both `dadm-backend` and `dadm-analysis-daemon` are online.

### 3. Start Frontend

**Option A: Docker Development Mode**
```bash
cd /home/jdehart/dadm/ui && docker-compose --profile dev up dadm-ui-dev
```

**Option B: Native Development Mode**
```bash
cd /home/jdehart/dadm/ui && PORT=3001 BROWSER=none npm start
```

### 4. Verify System Health

```bash
# Check backend API
curl http://localhost:8000/api/health

# Check analysis data
curl http://localhost:8000/api/analysis/list

# Check thread context
curl http://localhost:8000/api/analysis/threads

# Access frontend
# Docker: http://localhost:3000
# Native: http://localhost:3001
```

## Environment Variables

### Frontend Environment Variables

```bash
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8001
REACT_APP_ENABLE_REAL_TIME=true
REACT_APP_ENABLE_AI_CHAT=true
REACT_APP_ENABLE_THREAD_CONTEXT=true
REACT_APP_ENABLE_CLI_MANAGER=true
REACT_APP_LOG_LEVEL=debug  # or info for production
BROWSER=none
```

### Backend Environment Variables

Configured in `ecosystem.config.js`:
```javascript
NODE_ENV=production  # or development
PORT=8000
PYTHONPATH=/home/jdehart/dadm/src:/home/jdehart/dadm
DADM_ENV=production  # or development
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Frontend Cannot Connect to Backend

**Symptoms:**
- Analysis Data Viewer shows no data
- Thread Context is empty
- AI Assistant cannot connect

**Solution:**
1. Verify backend is running: `npm run backend:status`
2. Test API directly: `curl http://localhost:8000/api/health`
3. Check frontend proxy configuration
4. Ensure correct environment variables

#### 2. Docker Container Fails to Start

**Symptoms:**
- Container creation hangs
- Port conflicts

**Solutions:**
1. Use native mode: `PORT=3001 npm start`
2. Check for port conflicts: `ss -tlnp | grep 3000`
3. Rebuild container: `docker-compose --profile dev build dadm-ui-dev`

#### 3. Backend Services Not Starting

**Solutions:**
1. Check PM2 logs: `npm run backend:logs`
2. Restart services: `npm run backend:restart`
3. Verify Python environment and paths

#### 4. Missing Dependencies

**Symptoms:**
- Module not found errors
- Build failures

**Solutions:**
1. Rebuild containers: `docker-compose --profile dev build`
2. Install missing packages: `npm install`
3. Check package.json for dependencies

## Port Allocation

| Service | Port | Purpose |
|---------|------|---------|
| Frontend (Docker) | 3000 | React development server |
| Frontend (Native) | 3001 | Alternative React port |
| Backend API | 8000 | REST API endpoints |
| WebSocket | 8001 | Real-time communication |
| Camunda | 8080 | Process engine |
| OpenAI Service | 5000 | AI assistant service |
| Echo Service | 5100 | Test service |
| Service Monitor | 5200 | Health monitoring |
| PostgreSQL | 5432 | Database |
| Consul | 8500 | Service registry |
| Qdrant | 6333, 6334 | Vector database |
| Neo4j | 7474, 7687 | Graph database |

## File Locations

```
/home/jdehart/dadm/
├── ui/                          # Frontend application
│   ├── docker-compose.yml      # Frontend container config
│   ├── Dockerfile              # Production build
│   ├── Dockerfile.dev          # Development build
│   ├── ecosystem.config.js     # PM2 backend configuration
│   ├── cli-api-server.js       # Backend API server
│   └── src/                    # React source code
├── docker/                     # Infrastructure services
│   └── docker-compose.yml     # Supporting services
├── services/                   # Python services
├── config/                     # Configuration files
├── logs/                       # Application logs
└── docs/                       # Documentation
    └── BUILD_AND_RUN_INSTRUCTIONS.md  # This file
```

## Health Check Commands

```bash
# Quick system health check
cd /home/jdehart/dadm/ui && npm run backend:status
cd /home/jdehart/dadm/docker && docker-compose ps
curl -s http://localhost:8000/api/health
curl -s http://localhost:3000 || curl -s http://localhost:3001

# Detailed health check
curl -s http://localhost:8000/api/system/status
curl -s http://localhost:8000/api/analysis/list | jq '.total'
```

## Maintenance Commands

```bash
# Update and rebuild everything
cd /home/jdehart/dadm/ui && docker-compose --profile dev build --no-cache
cd /home/jdehart/dadm/docker && docker-compose pull && docker-compose up -d

# Clean up
docker system prune -f
cd /home/jdehart/dadm/ui && npm run backend:stop
docker-compose down

# Logs management
cd /home/jdehart/dadm/ui && npm run backend:logs | tail -50
cd /home/jdehart/dadm/docker && docker-compose logs --tail=50
```

## Notes

- The development mode frontend container (`dadm-ui-dev`) is preferred for development as it supports hot reloading and runtime environment variables
- The production container bakes environment variables at build time, making runtime configuration changes ineffective
- Backend services use PM2 for process management and automatic restart capabilities
- All services communicate through Docker networks or localhost
- The frontend proxy configuration automatically routes API calls to the backend

Last Updated: June 19, 2025

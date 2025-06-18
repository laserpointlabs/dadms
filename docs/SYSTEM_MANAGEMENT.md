# DADM System Management Features

## Overview

The DADM (Distributed Analysis and Decision Management) system now includes comprehensive system management capabilities through both API endpoints and a React-based dashboard interface. These features allow users to monitor and control the backend services, analysis daemon, Docker containers, and system resources in real-time.

## Features Implemented

### 1. Backend API Endpoints

#### System Status
- **Endpoint**: `GET /api/system/status`
- **Description**: Provides real-time status of all system components
- **Returns**:
  - Backend service status and PM2 metrics
  - Analysis daemon status (running/stopped)
  - Docker container status for all services
  - System resource usage (memory, CPU load)

#### Backend Service Control
- **Endpoint**: `POST /api/system/backend/:action`
- **Actions**: `start`, `stop`, `restart`, `reload`
- **Description**: Control the DADM backend service via PM2
- **Returns**: Action result and output

#### Analysis Daemon Control
- **Endpoint**: `POST /api/system/daemon/:action`
- **Actions**: `start`, `stop`, `restart`, `status`
- **Description**: Control the analysis processing daemon
- **Returns**: Action result and daemon status

#### Docker Container Status
- **Endpoint**: `GET /api/system/docker`
- **Description**: Real-time status of all Docker containers
- **Returns**: Container details including health status

### 2. Dashboard Components

#### SystemManager Component
- **Location**: `ui/src/components/SystemManager.tsx`
- **Features**:
  - Real-time system status display
  - Service control buttons (start/stop/restart)
  - Docker container monitoring
  - System resource metrics
  - Error handling and user feedback
  - Auto-refresh capabilities

#### SystemStatusWidget Component
- **Location**: `ui/src/components/SystemStatusWidget.tsx`
- **Features**:
  - Compact system health overview
  - Quick status indicators
  - Integration with main dashboard
  - Real-time updates

### 3. Auto-Start Functionality

#### Daemon Auto-Start
- **Feature**: Automatic analysis daemon startup when backend starts
- **Implementation**: Built into backend server startup process
- **Benefits**: Ensures daemon is always available when the system is running
- **Logging**: Detailed startup messages in backend logs

### 4. PM2 Ecosystem Configuration

#### Configuration File
- **Location**: `ui/ecosystem.config.js`
- **Services Managed**:
  - DADM Backend API Server
  - Analysis Processing Daemon (optional PM2 management)
- **Features**:
  - Automatic restart on failure
  - Memory limit management
  - Comprehensive logging
  - Environment-specific configurations

## Technical Implementation

### Real-Time Status Monitoring
- Uses process detection via `pgrep` for daemon status
- PM2 API integration for backend service monitoring
- Docker CLI integration for container status
- System resource monitoring via `/proc/meminfo` and load averages

### Service Control
- PM2 commands for backend service management
- Shell commands with `nohup` for daemon management
- Proper error handling and status reporting
- Live process verification

### User Interface
- Material-UI components for consistent design
- Real-time status updates
- Interactive control buttons
- Error handling with user-friendly messages
- Status indicators with color coding

## Usage

### Via Dashboard
1. Navigate to the System Management section in the dashboard
2. View real-time status of all services
3. Use control buttons to start/stop/restart services
4. Monitor system resources and Docker containers

### Via API
```bash
# Get system status
curl http://localhost:8000/api/system/status

# Start analysis daemon
curl -X POST http://localhost:8000/api/system/daemon/start

# Restart backend
curl -X POST http://localhost:8000/api/system/backend/restart

# Get Docker status
curl http://localhost:8000/api/system/docker
```

### Via PM2
```bash
# Start all services
pm2 start ecosystem.config.js

# Monitor services
pm2 status

# View logs
pm2 logs
```

## Benefits

1. **Centralized Management**: All system components controllable from one interface
2. **Real-Time Monitoring**: Live status updates for all services
3. **Automated Recovery**: Auto-restart features and daemon auto-start
4. **User-Friendly**: Intuitive dashboard interface with clear status indicators
5. **API-First**: Programmatic access to all management functions
6. **Comprehensive Logging**: Detailed logs for troubleshooting
7. **System Health**: Resource monitoring and container health checks

## Future Enhancements

1. **Authentication**: Add authentication/authorization for production security
2. **Alerts**: Email/SMS notifications for service failures
3. **Metrics History**: Historical performance data and graphing
4. **Service Dependencies**: Smart startup/shutdown order management
5. **Log Viewer**: Built-in log viewing interface
6. **Performance Tuning**: Automatic resource optimization recommendations

## Troubleshooting

### Common Issues

1. **Daemon Won't Start**: Check Python environment and script permissions
2. **Backend Restart Fails**: Verify PM2 is installed and accessible
3. **Docker Status Empty**: Ensure Docker daemon is running
4. **Status API Slow**: Check system resource availability

### Log Locations
- Backend logs: `logs/dadm-backend-*.log`
- Daemon logs: `logs/daemon-*.log`
- PM2 logs: `~/.pm2/logs/`

### Health Checks
All services include health check endpoints and status verification to ensure reliable operation.

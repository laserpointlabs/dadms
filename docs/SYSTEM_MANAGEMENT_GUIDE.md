# DADM System Management Guide

## Overview

The DADM system now includes comprehensive system management capabilities accessible through both the web UI and API endpoints. This allows for real-time monitoring and control of all system components.

## System Management Dashboard

### Accessing the Dashboard
Navigate to **System Management** in the main UI navigation menu at `http://localhost:3000/system`

### Features

#### Real-time System Status
- **Backend API Server**: Status, uptime, memory usage, and PM2 process details
- **Analysis Daemon**: Current status and control options
- **Docker Containers**: Live status of all Docker services
- **System Resources**: Memory usage, load average, and performance metrics

#### Service Control
- **Start/Stop/Restart**: Control backend and analysis daemon services
- **Real-time Updates**: Status refreshes automatically every 10 seconds
- **Error Handling**: User-friendly error messages and confirmations

#### Docker Container Monitoring
Real-time status display for all containers:
- Container name and image
- Current status (Up/Down/Unhealthy)
- Port mappings
- Creation time

## API Endpoints

### System Status
```http
GET /api/system/status
```
Returns comprehensive system status including:
- Service status (backend, analysis daemon)
- Docker container status
- System resource usage
- PM2 process information

Example response:
```json
{
  "success": true,
  "timestamp": "2025-06-18T13:18:23.021Z",
  "services": {
    "backend": {
      "name": "DADM Backend API",
      "status": "running",
      "port": 8000,
      "uptime": 123.45,
      "pm2": { /* PM2 process details */ }
    },
    "analysisDaemon": {
      "name": "Analysis Daemon",
      "status": "running"
    }
  },
  "docker": [
    {
      "name": "dadm-camunda",
      "status": "Up 2 hours (healthy)",
      "image": "docker-camunda",
      "ports": "0.0.0.0:8080->8080/tcp"
    }
  ],
  "system": {
    "memory": {
      "total": 15996,
      "used": 10217,
      "free": 2399,
      "available": 5778
    },
    "loadAverage": "1.10"
  }
}
```

### Backend Service Control
```http
POST /api/system/backend/{action}
```
Actions: `start`, `stop`, `restart`, `reload`

Example:
```bash
curl -X POST http://localhost:8000/api/system/backend/restart
```

### Analysis Daemon Control
```http
POST /api/system/daemon/{action}
```
Actions: `start`, `stop`, `restart`, `status`

Example:
```bash
curl -X POST http://localhost:8000/api/system/daemon/start
```

### Docker Container Status
```http
GET /api/system/docker
```
Returns detailed Docker container information with JSON formatting.

## PM2 Process Management

### Backend Service Management
The backend API runs as a managed PM2 process:

```bash
# View status
pm2 status dadm-backend

# Start/stop/restart
pm2 start dadm-backend
pm2 stop dadm-backend
pm2 restart dadm-backend

# View logs
pm2 logs dadm-backend

# Monitor
pm2 monit
```

### NPM Scripts
Convenient management scripts:
```bash
npm run backend:start     # Start backend
npm run backend:stop      # Stop backend
npm run backend:restart   # Restart backend
npm run backend:status    # Show status
npm run backend:logs      # View logs
npm run backend:monitor   # Open monitoring
```

### Analysis Daemon Management
The analysis daemon can also be managed through PM2:

```bash
# Start both services
pm2 start ecosystem.config.js

# Manage individual services
pm2 start dadm-analysis-daemon
pm2 stop dadm-analysis-daemon
pm2 restart dadm-analysis-daemon
```

## Dashboard Widget Integration

### System Status Widget
The main dashboard now includes a real-time system status widget showing:
- Service health indicators
- Docker container health summary
- Memory usage percentage
- System load average

### Auto-refresh
The status widget automatically updates every 30 seconds to provide real-time monitoring.

## Configuration Files

### PM2 Ecosystem Configuration
`/home/jdehart/dadm/ui/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'dadm-backend',
      script: 'cli-api-server.js',
      // ... backend configuration
    },
    {
      name: 'dadm-analysis-daemon',
      script: '/home/jdehart/miniconda3/bin/python',
      args: ['-m', 'src.core.analysis_daemon', 'start'],
      // ... daemon configuration
    }
  ]
};
```

### Logging
All services log to `/home/jdehart/dadm/logs/`:
- `dadm-backend-*.log` - Backend API logs
- `dadm-analysis-daemon-*.log` - Analysis daemon logs

## Best Practices

### Production Deployment
1. **Use PM2**: Always use PM2 for process management
2. **Monitor Regularly**: Check the System Management dashboard regularly
3. **Auto-startup**: Configure PM2 auto-startup for production
4. **Log Monitoring**: Monitor logs for errors and performance issues

### Development Workflow
1. **Start Services**: Use `npm run backend:start` to start the backend
2. **Monitor Status**: Use the web dashboard for real-time monitoring
3. **Debug Issues**: Use `npm run backend:logs` to view logs
4. **Restart Services**: Use the web interface or CLI for restarts

### Security Considerations
- System management endpoints require backend access
- PM2 process control requires appropriate system permissions
- Docker operations may require elevated privileges

## Troubleshooting

### Backend Not Starting
1. Check port availability: `lsof -i :8000`
2. Verify PM2 status: `pm2 status`
3. Check logs: `pm2 logs dadm-backend`

### Analysis Daemon Issues
1. Check Python environment: `which python`
2. Verify PYTHONPATH in ecosystem config
3. Check daemon logs: `pm2 logs dadm-analysis-daemon`

### Docker Container Problems
1. Check container status: `docker ps -a`
2. View container logs: `docker logs <container_name>`
3. Restart containers: `docker restart <container_name>`

### System Resource Issues
1. Monitor memory usage in the dashboard
2. Check system load average
3. Use `pm2 monit` for detailed process monitoring

## Integration with Existing Workflows

The system management features integrate seamlessly with:
- **Analysis Data Viewer**: Delete functionality for process instances
- **CLI Manager**: Backend service status and control
- **Tech Stack Monitor**: Real-time service health
- **Dashboard Overview**: System status widget

This provides a unified management experience across all DADM components.

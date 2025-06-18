# DADM Backend Server Management

This document explains how to manage the DADM backend server using PM2 for production-ready deployment.

## Overview

The DADM backend API server is now managed by PM2 (Process Manager 2), which provides:
- **Process Management**: Automatic restart on crashes
- **Load Balancing**: Can run multiple instances
- **Monitoring**: Real-time process monitoring
- **Logging**: Centralized log management
- **Auto-Startup**: Automatically start on system boot

## Quick Start

### Starting the Backend
```bash
cd /home/jdehart/dadm/ui
npm run backend:start
```

### Checking Status
```bash
npm run backend:status
```

### Viewing Logs
```bash
npm run backend:logs
```

### Stopping the Backend
```bash
npm run backend:stop
```

## Available Commands

### NPM Scripts (Recommended)
```bash
npm run backend:start    # Start the backend server
npm run backend:stop     # Stop the backend server
npm run backend:restart  # Restart the backend server
npm run backend:status   # Show process status
npm run backend:logs     # Show real-time logs
npm run backend:monitor  # Open PM2 monitoring dashboard
```

### Direct PM2 Commands
```bash
pm2 start ecosystem.config.js  # Start using config file
pm2 stop dadm-backend          # Stop the process
pm2 restart dadm-backend       # Restart the process
pm2 delete dadm-backend        # Delete the process
pm2 logs dadm-backend          # View logs
pm2 monit                      # Monitoring dashboard
pm2 status                     # Show all processes
```

### Management Script
```bash
# Using the comprehensive management script
/home/jdehart/dadm/scripts/backend-manager.sh start
/home/jdehart/dadm/scripts/backend-manager.sh status
/home/jdehart/dadm/scripts/backend-manager.sh health
/home/jdehart/dadm/scripts/backend-manager.sh logs
```

## Configuration

The backend is configured via `ecosystem.config.js`:

```javascript
{
  name: 'dadm-backend',
  script: 'cli-api-server.js',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  env: {
    NODE_ENV: 'production',
    PORT: 8000
  }
}
```

## Logging

Logs are stored in `/home/jdehart/dadm/logs/`:
- `dadm-backend-error.log` - Error logs only
- `dadm-backend-out.log` - Standard output logs
- `dadm-backend-combined.log` - Combined logs with timestamps

## Auto-Startup on Boot

To enable auto-startup on system boot:

1. Save current process list:
   ```bash
   pm2 save
   ```

2. Generate startup script:
   ```bash
   pm2 startup
   ```

3. Run the command it provides (with sudo)

## Health Checking

The backend provides a health endpoint:
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-18T13:11:54.055Z",
  "server": "DADM CLI API"
}
```

## Available API Endpoints

- `GET    /api/health`
- `POST   /api/cli/execute`
- `GET    /api/cli/commands`
- `GET    /api/analysis/list`
- `GET    /api/analysis/:id`
- `DELETE /api/analysis/process/:processInstanceId`
- `GET    /api/process/definitions`

## Troubleshooting

### Backend Not Starting
1. Check if port 8000 is in use:
   ```bash
   lsof -i :8000
   ```

2. Check PM2 logs:
   ```bash
   pm2 logs dadm-backend
   ```

### Backend Not Responding
1. Check process status:
   ```bash
   pm2 status dadm-backend
   ```

2. Restart the process:
   ```bash
   pm2 restart dadm-backend
   ```

### View Detailed Monitoring
```bash
pm2 monit
```

## Best Practices

1. **Always use PM2** instead of running `node cli-api-server.js` directly
2. **Check status regularly** with `npm run backend:status`
3. **Monitor logs** with `npm run backend:logs` when debugging
4. **Use the health endpoint** to verify the backend is responding
5. **Set up auto-startup** for production environments

## Development vs Production

### Development
```bash
# Quick start for development
npm run backend:start
npm run backend:logs  # Keep this open to watch logs
```

### Production
```bash
# Production deployment
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Configure auto-startup
```

The backend will now survive:
- Terminal window closures
- SSH session disconnections
- Application crashes (automatic restart)
- System reboots (if auto-startup is configured)

# DADM Service Monitor

**Version**: 1.0.0  
**Last Updated**: May 28, 2025

## Overview

The DADM Service Monitor is a critical component of the DADM system that provides continuous monitoring and automatic recovery for all system services. It monitors service health, attempts to restart failed services, and provides health endpoints for Consul service discovery.

## Features

- **Continuous Monitoring**: Regularly checks the health of all DADM services
- **Automatic Recovery**: Attempts to restart failed services
- **Docker Integration**: Leverages Docker commands to manage containers
- **Health Endpoints**: Provides REST endpoints for monitoring status
- **Consul Integration**: Discovers services via Consul service registry

## API Endpoints

### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Response**: Basic health status for Consul discovery
- **Example Response**:
  ```json
  {
    "status": "healthy",
    "service": "dadm-monitor",
    "version": "1.0.0",
    "monitoring_active": true,
    "uptime": 3600.5,
    "checks_performed": 60,
    "services_monitored": 2
  }
  ```

### Status
- **URL**: `/status`
- **Method**: `GET`
- **Response**: Detailed monitoring statistics and environment info
- **Example Response**:
  ```json
  {
    "monitoring_stats": {
      "start_time": 1716907731.2,
      "checks_performed": 60,
      "services_monitored": ["dadm-echo-service", "dadm-openai-assistant"],
      "last_check": "2025-05-28 14:08:53",
      "failed_services": [],
      "restart_attempts": 2
    },
    "environment": {
      "docker_container": true,
      "consul_addr": "consul:8500",
      "log_level": "INFO"
    }
  }
  ```

## Configuration

The service monitor can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CHECK_INTERVAL` | Time between health checks in seconds | 60 |
| `CONSUL_HTTP_ADDR` | Address of the Consul service | localhost:8500 |
| `SERVICE_HOST` | Host name for this service | service-monitor |
| `PORT` | Port for the health endpoint | 5200 |

## Usage

The service monitor is typically started via Docker Compose as defined in the DADM `docker-compose.yml` file. It can also be run directly as a Python script:

```bash
python scripts/service_monitor.py --interval 60 --port 5200
```

### Command Line Arguments

- `--interval`, `-i`: Check interval in seconds (default: 60)
- `--port`, `-p`: Port for health endpoint (default: 5200)
- `--services`, `-s`: Specific services to monitor (format: name or name:endpoint)
- `--no-web-server`: Don't start the web server (monitoring only)

## Dependencies

- Flask: Web server for health endpoints
- Requests: HTTP client for service health checks
- Docker CLI: For container management (installed in Docker image)

## Logs

Logs are written to both the console and file:
- `/app/logs/monitors/service_monitor.log` (within container)
- `logs/monitors/service_monitor.log` (host mapped volume)

## Troubleshooting

1. **Service monitor is not detecting services**:
   - Check Consul is running and accessible
   - Verify services are properly registered in Consul

2. **Restart attempts fail**:
   - Ensure Docker socket is properly mounted
   - Check container names match expected patterns

3. **Web server not responding**:
   - Verify port 5200 is exposed and not in use by another service
   - Check logs for any startup errors

## Development

To extend the service monitor, consider:
- Adding more sophisticated health checks
- Implementing alerting for persistent failures
- Creating a dashboard for system status visualization
- Adding rate limiting for service restart attempts

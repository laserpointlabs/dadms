# Consul Service Discovery in DADM

This document explains how to work with the Consul service registry in the DADM system.

## Overview

DADM uses Consul as a service discovery mechanism to allow services to find and communicate with each other dynamically. This approach provides several benefits:

- **Dynamic service discovery**: Services can find each other without hardcoded URLs
- **Health monitoring**: Automatic health checks ensure only healthy services are used
- **Metadata storage**: Services can advertise capabilities, versions, and other metadata
- **Scalability**: Multiple instances of the same service can be deployed and discovered

## Services Integration

Each service in the DADM system can register itself with Consul, providing:

1. Service name
2. Host and port information
3. Service type in tags (e.g., "type-assistant")
4. Metadata (version, description, assistant_id for OpenAI services)
5. Health check endpoint

## Running Consul

### Local Development

For local development, you can run Consul using Docker:

```powershell
docker run -d --name consul -p 8500:8500 consul:1.15
```

### Docker Compose

The docker-compose.yml file already includes Consul:

```powershell
cd docker
docker-compose up -d consul
```

## Viewing Services

You can view registered services in several ways:

1. Consul UI: http://localhost:8500/ui/dc1/services
2. Service Status Dashboard:
   ```powershell
   cd scripts
   .\service_status.ps1
   ```
3. Command Line:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8500/v1/catalog/services" | ConvertTo-Json
   ```

## Troubleshooting

If services aren't appearing in Consul, you can:

1. Run the fix script:
   ```powershell
   cd scripts
   .\fix_consul_services.ps1
   ```

2. Check that services are running:
   ```powershell
   curl http://localhost:5000/health  # OpenAI service
   curl http://localhost:5100/health  # Echo service
   ```

3. Check Consul health:
   ```powershell
   curl http://localhost:8500/v1/status/leader
   ```

4. Verify environment variables:
   ```powershell
   Get-ChildItem Env: | Where-Object { $_.Name -like "CONSUL*" -or $_.Name -like "SERVICE*" }
   ```

## Docker Networking Considerations

When running Consul in Docker but services locally (or vice versa), be aware of networking differences:

- For services running locally but registering with Consul in Docker:
  - Use `host.docker.internal` in health check URLs for Docker to access local services
  - Set `DOCKER_CONTAINER=false` in your environment

- For services running in Docker:
  - Use service name as the hostname (e.g., `openai-service`)
  - Set `DOCKER_CONTAINER=true` in your environment

## Environment Variables

The following environment variables control Consul integration:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CONSUL_HTTP_ADDR` | Address of the Consul server | `localhost:8500` | `consul:8500` (Docker) |
| `SERVICE_HOST` | Hostname for service registration | `localhost` | `openai-service` (Docker) |
| `SERVICE_TYPE` | Type of service for discovery | `assistant` | `assistant` |
| `USE_CONSUL` | Whether to use Consul for service discovery | `true` | `true` |
| `DOCKER_CONTAINER` | Indicates if running in Docker container | `false` | `true` (Docker) |

## Service Registration

Services automatically register with Consul on startup if `USE_CONSUL=true`. The registration includes:

- Service name and address
- Port number
- Tags (including service type)
- Metadata
- Health check configuration

## Health Checks

Consul performs automatic health checks on all registered services. The health check:

- Calls the /health endpoint of each service
- Runs every 10 seconds (configurable)
- Times out after 2 seconds
- Updates service status to passing, warning, or critical

Health checks ensure that only healthy services are returned in service discovery queries.

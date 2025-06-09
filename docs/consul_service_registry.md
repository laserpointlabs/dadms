# Consul Service Registry Integration

This document explains the implementation of a simpler service registry using Consul for the DADM system.

## Overview

The DADM system has been updated to use Consul as a service registry, providing a more robust and scalable way to discover and connect to services like the OpenAI Assistant service.

## Key Components

### 1. Consul Service

Added to docker-compose.yml:
```yaml
consul:
  image: consul:1.15
  container_name: dadm-consul
  ports:
    - "8500:8500"
  environment:
    - CONSUL_BIND_INTERFACE=eth0
  networks:
    - dadm-network
```

### 2. Service Registration (consul_client.py)

A new module that handles registering services with Consul:

- `register_openai_service(port)`: Registers the OpenAI Assistant service with Consul
- Uses environment variables for configuration: `CONSUL_HTTP_ADDR`, `SERVICE_HOST`, `SERVICE_TYPE`
- Includes automatic deregistration on service shutdown

### 3. Service Discovery (consul_discovery.py)

A new module that provides service discovery capabilities:

- `ConsulDiscovery` class for discovering services registered with Consul
- Methods to find services by name or type
- Ability to build a complete service registry from Consul data

### 4. Enhanced Service Orchestrator (consul_service_orchestrator.py)

An extension of the ServiceOrchestrator that integrates with Consul:

- Uses Consul to build its service registry at startup
- Provides methods to find services and endpoints
- Updates its registry from Consul when needed

### 5. App Integration (consul_app.py)

Helper functions for the main app.py:

- `get_openai_service_url()`: Discovers the OpenAI service URL using Consul

## Implementation Details

### Service Registration Process

1. The OpenAI service starts up and registers with Consul using `register_openai_service()`
2. Registration includes:
   - Service name (openai-assistant)
   - Host and port information 
   - Tags for service type
   - Health check endpoint configuration

### Service Discovery Process

1. When app.py needs to find the OpenAI service, it calls `get_openai_service_url()`
2. The function tries to discover the service through Consul
3. If successful, it returns the discovered URL
4. If unsuccessful, it falls back to the default URL

### Enhanced Service Orchestrator

1. The ConsulServiceOrchestrator builds its registry from Consul at startup
2. When routing tasks, it can update its registry from Consul if needed
3. It provides a more flexible approach to service discovery

## Benefits

- **Resilience**: Services can be moved or restarted without reconfiguring clients
- **Decoupling**: Services don't need to know each other's locations
- **Scalability**: New service instances can be added dynamically
- **Health Monitoring**: Consul regularly checks service health
- **Simplicity**: Simpler code for service discovery and management

## Usage

To enable Consul integration:

1. Make sure the Consul service is defined in docker-compose.yml
2. Set the necessary environment variables in the service configuration:
   ```yaml
   environment:
     - CONSUL_HTTP_ADDR=consul:8500
     - SERVICE_HOST=openai-service
     - SERVICE_TYPE=assistant
   ```
3. The service will automatically register with Consul on startup

To discover services in code:

```python
from src.consul_app import get_openai_service_url

# Get the URL for the OpenAI service
service_url = get_openai_service_url()

# Use the service URL
response = requests.get(f"{service_url}/status")
```

## Fallbacks

The implementation includes fallback mechanisms:

1. If Consul is not available, the system uses default URLs
2. If service discovery fails, the system uses environment variables or hardcoded defaults
3. If a service is not found in the registry, the system tries to update from Consul before failing

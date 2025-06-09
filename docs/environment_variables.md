# Environment Variables for DADM Services

This document provides a comprehensive guide to configuring environment variables for the DADM services, focusing particularly on the OpenAI service and the Consul service registry integration.

## OpenAI Service Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-abcdef123456...` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | The port on which the service runs | `5000` | `5000` |
| `ASSISTANT_NAME` | Name of the OpenAI assistant | `DADM Decision Analysis Assistant` | `DADM Decision Analysis Assistant` |
| `ASSISTANT_MODEL` | OpenAI model to use | `gpt-4o` | `gpt-4o` |
| `OPENAI_ASSISTANT_ID` | Specific assistant ID | Generated automatically | `asst_abc123...` |

## Consul Integration Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CONSUL_HTTP_ADDR` | Address of the Consul server | `localhost:8500` | `consul:8500` (Docker) |
| `SERVICE_HOST` | Hostname for service registration | `localhost` | `openai-service` (Docker) |
| `SERVICE_TYPE` | Type of service for discovery | `assistant` | `assistant` |
| `USE_CONSUL` | Whether to use Consul for service discovery | `true` | `true` |
| `DOCKER_CONTAINER` | Indicates if running in Docker container | `false` | `true` (Docker) |

## Setting Variables for Local Development

### PowerShell (Windows)

```powershell
# Required
$env:OPENAI_API_KEY="your-openai-api-key"

# OpenAI Service Configuration
$env:PORT="5000"
$env:ASSISTANT_NAME="DADM Decision Analysis Assistant"
$env:ASSISTANT_MODEL="gpt-4o"

# Consul Integration
$env:CONSUL_HTTP_ADDR="localhost:8500"
$env:SERVICE_HOST="localhost"
$env:SERVICE_TYPE="assistant"
$env:USE_CONSUL="true"
$env:DOCKER_CONTAINER="false"
```

### Bash (Linux/macOS)

```bash
# Required
export OPENAI_API_KEY="your-openai-api-key"

# OpenAI Service Configuration
export PORT="5000"
export ASSISTANT_NAME="DADM Decision Analysis Assistant"
export ASSISTANT_MODEL="gpt-4o"

# Consul Integration
export CONSUL_HTTP_ADDR="localhost:8500"
export SERVICE_HOST="localhost"
export SERVICE_TYPE="assistant"
export USE_CONSUL="true"
export DOCKER_CONTAINER="false"
```

## Docker Environment Configuration

In `docker-compose.yml`, the environment variables are already configured:

```yaml
openai-service:
  build:
    context: ..
    dockerfile: services/openai_service/Dockerfile
  container_name: openai-service
  ports:
    - "5000:5000"
  environment:
    - PORT=5000
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - ASSISTANT_NAME=${ASSISTANT_NAME:-DADM Decision Analysis Assistant}
    - ASSISTANT_MODEL=${ASSISTANT_MODEL:-gpt-4o}
    - CONSUL_HTTP_ADDR=consul:8500
    - SERVICE_HOST=openai-service
    - SERVICE_TYPE=assistant
    - USE_CONSUL=true
```

To run Docker with these variables:

1. Create a `.env` file in the same directory as your `docker-compose.yml` file:

```
OPENAI_API_KEY=your-openai-api-key
ASSISTANT_NAME=DADM Decision Analysis Assistant
ASSISTANT_MODEL=gpt-4o
```

2. Start the services:

```powershell
cd docker
docker-compose up -d
```

## Verifying Environment Variables

To check if the environment variables are correctly set:

### In PowerShell:

```powershell
Get-ChildItem Env: | Where-Object { $_.Name -like "OPENAI*" -or $_.Name -like "CONSUL*" -or $_.Name -like "SERVICE*" }
```

### In Docker:

```powershell
docker exec openai-service env | findstr "OPENAI\|CONSUL\|SERVICE\|DOCKER_CONTAINER"
```

For Linux/macOS:
```bash
docker exec openai-service env | grep -E "OPENAI|CONSUL|SERVICE|DOCKER_CONTAINER"
```

## Troubleshooting

### Common Issues:

1. **Service not registering with Consul**
   - Ensure `CONSUL_HTTP_ADDR` is set correctly
   - Check that Consul is running (`docker ps` or visit `http://localhost:8500`)

2. **OpenAI service not found by other services**
   - Verify the `SERVICE_HOST` and `PORT` settings
   - Check Consul UI for registered services

3. **Assistant creation failures**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check if the `ASSISTANT_NAME` and `ASSISTANT_MODEL` are valid

4. **Service discovery failing**
   - Make sure `USE_CONSUL` is set to `true`
   - Check network connectivity between services

For more detailed troubleshooting steps, refer to the main documentation.

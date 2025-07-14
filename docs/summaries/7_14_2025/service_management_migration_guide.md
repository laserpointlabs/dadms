# DADM Service Management Migration Guide
## From Legacy Scripts to Unified Management

### Quick Reference

| Old Command | New Command | Notes |
|-------------|-------------|-------|
| `./start-all.sh` | `./services.sh start` | Enhanced with dependency management |
| `./stop-all.sh` | `./services.sh stop` | Graceful shutdown with error handling |
| `./test-api.sh` | `./services.sh test` | Comprehensive endpoint testing |
| Manual health checks | `./services.sh health` | **NEW**: Automated health verification |
| Manual log viewing | `./services.sh logs` | **NEW**: Aggregated log viewing |
| Manual dependency install | `./services.sh install` | **NEW**: Bulk dependency management |

### New Capabilities

#### Service-Specific Operations
```bash
# Start only the LLM service
./services.sh start --service llm-service

# Stop service running on port 3006  
./services.sh stop --port 3006

# Health check specific service
./services.sh health --service prompt-service
```

#### Advanced Management
```bash
# Install dependencies for all services
./services.sh install

# Build all TypeScript services
./services.sh build

# Clean build artifacts
./services.sh clean

# View aggregated logs
./services.sh logs
```

#### Testing and Monitoring
```bash
# Test all API endpoints
./services.sh test

# Test specific services
./services.sh test --service "prompt-service,llm-service"

# Comprehensive status report
./services.sh status
```

### LLM Service Integration

#### New Service Available
- **Port**: 3006
- **Purpose**: Unified LLM provider abstraction
- **Swagger Docs**: http://localhost:3006/docs
- **Providers**: OpenAI, Ollama (extensible)

#### Enhanced Prompt Service
The prompt service now uses the LLM service for better provider abstraction:
```bash
# Test the enhanced integration
./services.sh test --service prompt-service
./services.sh test --service llm-service
```

### Script Location

All service management is now centralized in:
```
/services/services.sh
```

The legacy scripts remain available for compatibility:
```
/services/start-all.sh
/services/stop-all.sh  
/services/test-api.sh
```

### Environment Setup

The new script handles environment setup automatically:
- Checks for Node.js dependencies
- Validates port availability
- Manages service startup order
- Provides detailed error reporting

### Quick Start Example

```bash
# Navigate to services directory
cd services

# Make script executable (one time)
chmod +x services.sh

# Start all services with enhanced management
./services.sh start

# Verify everything is working
./services.sh status
./services.sh health
./services.sh test

# View the LLM service documentation
# Navigate to: http://localhost:3006/docs

# Stop when done
./services.sh stop
```

### Benefits of Migration

1. **Simplified Operations**: Single script for all management tasks
2. **Better Error Handling**: Detailed diagnostics and recovery steps
3. **Enhanced Testing**: Comprehensive API validation
4. **Service Discovery**: Automatic detection of running services
5. **Dependency Management**: Smart startup/shutdown ordering
6. **Documentation**: Built-in help and API documentation
7. **Future-Proof**: Extensible framework for new services

### Getting Help

```bash
# View all available commands and options
./services.sh --help

# Get command-specific help
./services.sh start --help
./services.sh test --help
```

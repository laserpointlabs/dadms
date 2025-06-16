# Analysis Service Docker Deployment

The Analysis Service is now integrated into the DADM Docker ecosystem!

## 🚀 Quick Start

### Production Deployment
```bash
cd /home/jdehart/dadm/docker

# Start all services including analysis service
docker-compose up -d

# Check analysis service health
curl http://localhost:8002/health
```

### Development Mode
```bash
cd /home/jdehart/dadm/docker

# Start with development overrides (live reload, debug logging)
docker-compose -f docker-compose.yml -f docker-compose.analysis-dev.yml up -d

# View real-time logs
docker-compose logs -f analysis-service
```

### Test Build Only
```bash
cd /home/jdehart/dadm/docker

# Run the automated test script
./test_analysis_service.sh
```

## 🔧 Configuration

The Analysis Service automatically configures itself for Docker deployment:

### Environment Variables (Set in docker-compose.yml)
- `ANALYSIS_SERVICE_PORT=8002` - Service port
- `ANALYSIS_PROMPT_SERVICE_URL=http://prompt-service:5300` - Prompt service integration
- `ANALYSIS_CAMUNDA_BASE_URL=http://dadm-camunda:8080` - BPMN engine
- `ANALYSIS_CONSUL_ENABLED=true` - Service discovery
- `ANALYSIS_LLM_PROVIDER=openai` - LLM provider

### Service Dependencies
1. **consul** - Service discovery
2. **prompt-service** - Base prompt management  
3. **dadm-camunda** - BPMN workflow engine (optional)

## 🩺 Health & Debugging

### Health Check
```bash
curl http://localhost:8002/health
```

### Configuration Debug
```bash
curl http://localhost:8002/debug/config | jq .
```

### Connectivity Test
```bash
curl http://localhost:8002/debug/connectivity | jq .
```

### Available Templates
```bash
curl http://localhost:8002/templates | jq .
```

## 🔗 Service Endpoints

- **Analysis Service**: http://localhost:8002
- **Prompt Service**: http://localhost:5300  
- **Camunda**: http://localhost:8080
- **Consul UI**: http://localhost:8500

## 🐛 Troubleshooting

### Check Service Logs
```bash
# Analysis service logs
docker-compose logs -f analysis-service

# All services
docker-compose logs --tail=50
```

### Restart Analysis Service
```bash
docker-compose restart analysis-service
```

### Rebuild After Changes
```bash
docker-compose build analysis-service
docker-compose up -d analysis-service
```

### Development Debugging
```bash
# Enter container
docker-compose exec analysis-service bash

# Check configuration inside container
docker-compose exec analysis-service python -c "
from config_manager import load_service_config
config = load_service_config()
print(f'Prompt URL: {config.prompt_service_url}')
print(f'Port: {config.port}')
"
```

## ✅ Integration Benefits

1. **Automatic Service Discovery** - Uses Consul to find prompt service
2. **Environment Configuration** - No hardcoded URLs
3. **Health Monitoring** - Built-in health checks
4. **Log Aggregation** - Centralized logging with other DADM services
5. **Network Isolation** - Secure internal communication
6. **Restart Policies** - Automatic recovery from failures

The Analysis Service now seamlessly integrates with your existing DADM infrastructure!

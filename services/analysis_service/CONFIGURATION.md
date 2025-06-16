# Analysis Service Configuration Guide

The Analysis Service supports flexible configuration through multiple sources with the following priority:

1. **Environment Variables** (highest priority)
2. **Configuration File** (JSON)
3. **Default Values** (lowest priority)

## 🛠️ Environment Variables

All environment variables can be prefixed with `ANALYSIS_` for clarity:

### Core Service Settings
```bash
ANALYSIS_SERVICE_PORT=8002                    # Port for the analysis service
ANALYSIS_SERVICE_NAME=dadm-analysis-service   # Service name for discovery
```

### Integration URLs (IMPORTANT)
```bash
ANALYSIS_PROMPT_SERVICE_URL=http://localhost:5300     # Your Prompt Service URL
ANALYSIS_CAMUNDA_BASE_URL=http://dadm-camunda:8080    # Camunda BPMN engine URL
```

### LLM Configuration
```bash
ANALYSIS_LLM_PROVIDER=openai        # LLM provider (openai, anthropic, etc.)
ANALYSIS_LLM_MODEL=gpt-4           # Default model to use
ANALYSIS_LLM_TEMPERATURE=0.3       # Temperature for LLM responses
ANALYSIS_MAX_TOKENS=4000           # Maximum tokens for responses
```

### Service Discovery (Optional)
```bash
ANALYSIS_CONSUL_ENABLED=false              # Enable Consul service discovery
ANALYSIS_CONSUL_URL=http://consul:8500     # Consul server URL
```

### Validation & Processing
```bash
ANALYSIS_STRICT_VALIDATION=true       # Strict JSON schema validation
ANALYSIS_MAX_RETRY_ATTEMPTS=3         # Retry attempts for failed validations
ANALYSIS_VALIDATION_TIMEOUT=30.0      # Timeout for validation in seconds
```

### Storage & Caching
```bash
ANALYSIS_STORAGE_PATH=./analysis_results   # Path to store analysis results
ANALYSIS_CACHE_RESULTS=true               # Enable result caching
ANALYSIS_CACHE_TTL=3600                   # Cache time-to-live in seconds
```

### BPMN Integration
```bash
ANALYSIS_WORKFLOW_INTEGRATION=true    # Enable BPMN workflow integration
```

## 📄 Configuration File (config.json)

Create a `config.json` file in the service directory:

```json
{
  "service_name": "dadm-analysis-service",
  "version": "0.10.0",
  "port": 8002,
  "prompt_service_url": "http://localhost:5300",
  "camunda_base_url": "http://dadm-camunda:8080",
  "default_llm_provider": "openai",
  "default_model": "gpt-4",
  "default_temperature": 0.3,
  "max_tokens_default": 4000,
  "strict_validation": true,
  "max_retry_attempts": 3,
  "validation_timeout": 30.0,
  "analysis_storage_path": "./analysis_results",
  "cache_results": true,
  "cache_ttl": 3600,
  "consul_enabled": false,
  "consul_url": "http://consul:8500",
  "enable_workflow_integration": true
}
```

## 🔍 Configuration File Locations

The service will look for configuration files in this order:

1. `$ANALYSIS_CONFIG_FILE` (environment variable)
2. `./config.json` (current directory)  
3. `./analysis_config.json` (current directory)
4. `/etc/dadm/analysis_config.json` (system-wide)
5. `~/.dadm/analysis_config.json` (user-specific)

## 🚀 Usage Examples

### Development Setup
```bash
# Set environment variables for development
export ANALYSIS_PROMPT_SERVICE_URL=http://localhost:5300
export ANALYSIS_SERVICE_PORT=8002
export ANALYSIS_LLM_PROVIDER=openai
export ANALYSIS_LLM_MODEL=gpt-4

# Start the service
python -m uvicorn service:app --port 8002
```

### Docker Deployment
```dockerfile
# In your Dockerfile or docker-compose.yml
ENV ANALYSIS_PROMPT_SERVICE_URL=http://prompt-service:5300
ENV ANALYSIS_CAMUNDA_BASE_URL=http://camunda:8080
ENV ANALYSIS_CONSUL_ENABLED=true
ENV ANALYSIS_CONSUL_URL=http://consul:8500
```

### Production with Consul
```bash
# Enable service discovery for production
export ANALYSIS_CONSUL_ENABLED=true
export ANALYSIS_CONSUL_URL=http://consul.production:8500
export ANALYSIS_PROMPT_SERVICE_URL=http://prompt-service.default:5300  # Fallback URL
```

## 🔧 Configuration Validation

The service will log configuration details on startup:

```
INFO: Service configuration loaded: dadm-analysis-service v0.10.0
INFO: Prompt service URL: http://localhost:5300
INFO: Service port: 8002
INFO: Consul enabled: false
```

## 🐛 Troubleshooting

### Common Issues

1. **Cannot connect to Prompt Service**
   - Check `ANALYSIS_PROMPT_SERVICE_URL` 
   - Verify the Prompt Service is running
   - Test with: `curl http://localhost:5300/health`

2. **Service Discovery Issues**
   - Disable Consul: `ANALYSIS_CONSUL_ENABLED=false`
   - Check Consul connectivity: `curl http://consul:8500/v1/status/leader`

3. **Configuration Not Loading**
   - Check file permissions for config.json
   - Verify JSON syntax: `jq . config.json`
   - Enable debug logging: `export LOG_LEVEL=DEBUG`

### Debug Configuration
```bash
# Check effective configuration
curl http://localhost:8002/debug/config

# Health check with configuration info  
curl http://localhost:8002/health
```

This flexible configuration system allows you to easily deploy the Analysis Service in different environments without code changes!

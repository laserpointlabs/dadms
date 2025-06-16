# Docker Stack Rebuild Instructions

## Summary
Added two new services to the Docker stack:
1. `script-registry-service` (port 8004) - Analysis script registry
2. `openai-service-base` (port 5001) - Simplified OpenAI assistant

## New Services Added

### script-registry-service
- **Port**: 8004  
- **Container**: script-registry-service
- **Purpose**: Manages and executes analysis scripts (adder, sensitivity_analysis, etc.)
- **Dockerfile**: `services/analysis_service/Dockerfile.script_registry`
- **Dependencies**: consul
- **Health Check**: `http://localhost:8004/health`

### openai-service-base  
- **Port**: 5001
- **Container**: openai-service-base
- **Purpose**: Simplified OpenAI assistant without data files
- **Dockerfile**: `services/openai_service_base/Dockerfile`
- **Dependencies**: consul, camunda
- **Health Check**: `http://localhost:5001/health`

## Files Created/Modified

### New Files:
- `/services/analysis_service/Dockerfile.script_registry`
- `/services/openai_service_base/Dockerfile` (copied from openai_service)
- `/services/openai_service_base/service.py` (copied from openai_service)
- `/services/openai_service_base/requirements.txt` (copied from openai_service)
- `/services/openai_service_base/config.py` (simplified configuration)
- `/services/openai_service_base/service_config.json` (updated for base service)
- `/camunda_models/simple_adder_process.bpmn` (new simple workflow)

### Modified Files:
- `/docker/docker-compose.yml` (added both new services)

## To Rebuild and Test

1. **Rebuild the Docker stack:**
   ```bash
   cd docker
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Verify services are running:**
   ```bash
   curl http://localhost:8004/health  # Script registry
   curl http://localhost:5001/health  # Basic OpenAI service
   curl http://localhost:8004/scripts # Available scripts
   ```

3. **Deploy the BPMN process:**
   - Open Camunda Modeler
   - Open `/camunda_models/simple_adder_process.bpmn`
   - Deploy to http://localhost:8080/engine-rest

4. **Test the workflow:**
   - Start a new process instance of "Simple_Adder_Process"
   - The workflow should:
     - Call openai-service-base to format numbers
     - Call script-registry-service to execute addition
     - Complete successfully with result

## Expected Service Topology

```
BPMN Process (simple_adder_process)
├── FormatNumbersTask → openai-service-base:5001
└── AddNumbersTask → script-registry-service:8004
```

## Troubleshooting

- Check container logs: `docker-compose logs <service-name>`
- Verify service health: `curl http://localhost:<port>/health`
- Check Consul registration: `curl http://localhost:8500/v1/agent/services`
- Monitor BPMN execution in Camunda Cockpit: http://localhost:8080/camunda

This setup provides a clean foundation for testing the LLM → Analysis pipeline with real Docker containers and BPMN processes.

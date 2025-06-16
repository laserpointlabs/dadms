# DADM Integrated Analysis System

## Overview

The DADM Integrated Analysis System provides a decoupled, extensible pipeline for BPMN workflow analysis that combines:

- **LLM-driven insights** via OpenAI Service
- **Computational analysis** via Python Execution Service  
- **Structured prompts** via Prompt Service
- **Orchestrated workflows** via Analysis Service
- **Service discovery** via Consul

## Quick Start

### 1. Start the System
```bash
cd docker
docker-compose up -d
```

### 2. Verify Services
```bash
# Check all services are healthy
python3 scripts/test_decoupled_architecture.py

# Check Consul dashboard
open http://localhost:8500
```

### 3. Test Analysis Integration
```bash
# Simple analysis request
curl -X POST "http://localhost:8002/analyze/integrated" \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_type": "market_analysis",
    "data_sources": {
      "sales_data": [100, 120, 135, 150, 180]
    },
    "execution_tools": ["python"]
  }'
```

## Architecture Benefits

### ✅ **Properly Decoupled**
- Services communicate only via HTTP APIs
- No direct code dependencies between services
- Independent deployment and scaling
- Service discovery via Consul (no hardcoded URLs)

### ✅ **Fault Tolerant**
- Graceful degradation when services are unavailable
- Circuit breaker patterns for resilience
- Health checks and automatic recovery

### ✅ **Extensible**
- Easy to add new computational tools (R, Scilab, etc.)
- Plugin architecture for analysis templates
- BPMN workflow integration

### ✅ **Secure**
- Isolated execution environments
- Resource limits and timeouts
- No code injection vulnerabilities

## Service Endpoints

### Analysis Service (Port 8002)
- `POST /analyze/integrated` - Full integrated analysis
- `POST /analyze/computational` - Python execution only
- `POST /workflow/analyze` - BPMN workflow integration
- `GET /health` - Service health check

### Python Execution Service (Port 8003)
- `POST /execute` - Execute Python code
- `GET /execution/{id}/status` - Check execution status
- `GET /environments` - Available execution environments
- `GET /health` - Service health check

### Service Discovery
- Consul UI: http://localhost:8500
- All services auto-register and discover each other
- Health monitoring and automatic failover

## Example Workflows

### Market Analysis
```python
{
  "analysis_type": "market_analysis",
  "data_sources": {
    "market_data": "path/to/data.csv",
    "competitor_data": "path/to/competitors.json"
  },
  "analysis_parameters": {
    "time_period": "Q1_2024",
    "market_segment": "enterprise_software"
  },
  "execution_tools": ["python"]
}
```

### Risk Assessment  
```python
{
  "analysis_type": "risk_assessment",
  "data_sources": {
    "financial_data": "path/to/financials.csv",
    "market_conditions": "current_market_snapshot"
  },
  "analysis_parameters": {
    "risk_tolerance": "moderate",
    "time_horizon": "12_months"
  },
  "execution_tools": ["python", "r"]
}
```

## Integration with BPMN

### Service Task Configuration
```xml
<bpmn:serviceTask id="AnalyzeData" name="Analyze Market Data">
  <bpmn:extensionElements>
    <camunda:connector>
      <camunda:inputOutput>
        <camunda:inputParameter name="url">
          http://analysis-service:8002/workflow/analyze
        </camunda:inputParameter>
        <camunda:inputParameter name="method">POST</camunda:inputParameter>
        <camunda:inputParameter name="payload">
          {
            "workflow_id": "${execution.processInstanceId}",
            "analysis_type": "market_analysis",
            "data_sources": {
              "market_data": "${marketDataVariable}"
            }
          }
        </camunda:inputParameter>
      </camunda:inputOutput>
    </camunda:connector>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

## Configuration

### Environment Variables
```bash
# Service URLs (with fallbacks)
ANALYSIS_PROMPT_SERVICE_URL=http://prompt-service:5300
ANALYSIS_OPENAI_SERVICE_URL=http://openai-service:5000  
ANALYSIS_PYTHON_EXECUTION_URL=http://python-execution-service:8003

# Service Discovery
CONSUL_ENABLED=true
CONSUL_URL=http://consul:8500

# LLM Configuration
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.3
MAX_TOKENS=4000
```

### Service Registration
All services automatically register with Consul:
```python
consul_client.agent.service.register(
    name="dadm-analysis-service",
    address="analysis-service", 
    port=8002,
    tags=["analysis", "llm", "dadm"],
    check=consul.Check.http("http://analysis-service:8002/health")
)
```

## Monitoring and Debugging

### Health Checks
```bash
# Check all services
curl http://localhost:8002/health  # Analysis
curl http://localhost:5300/health  # Prompt  
curl http://localhost:5000/health  # OpenAI
curl http://localhost:8003/health  # Python Execution
curl http://localhost:5200/health  # Monitor
```

### Consul Dashboard
- View: http://localhost:8500
- Shows all registered services
- Health status and metadata
- Service discovery testing

### Logs
```bash
# View service logs
docker-compose logs -f analysis-service
docker-compose logs -f python-execution-service
docker-compose logs -f openai-service
```

### Debug Configuration
```bash
# Check effective configuration
curl http://localhost:8002/debug/config

# Test service connectivity
curl http://localhost:8002/debug/connectivity
```

## Troubleshooting

### Service Not Found
1. Check if service is registered in Consul
2. Verify health checks are passing
3. Check network connectivity between containers

### Analysis Failures
1. Check OpenAI API key configuration
2. Verify prompt service has required templates
3. Check Python execution service has required packages

### Performance Issues
1. Monitor execution timeouts
2. Check resource limits on containers
3. Scale services horizontally if needed

## Development

### Adding New Analysis Types
1. Create analysis template in Prompt Service
2. Add schema validation in Analysis Service
3. Implement computational logic for Python Execution
4. Test with BPMN workflow integration

### Adding New Execution Environments
1. Extend Python Execution Service with new environments
2. Add required packages and configurations
3. Update Analysis Service to support new tools
4. Document usage patterns

This architecture ensures the DADM system remains maintainable, scalable, and properly decoupled while providing powerful integrated analysis capabilities.

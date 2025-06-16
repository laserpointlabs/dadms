# DADM Decoupled Analysis Architecture

## Overview

This document describes the decoupled architecture for the DADM analysis pipeline, ensuring services remain independent and scalable while enabling powerful integrated analysis capabilities.

## Architecture Principles

### 1. **Service Decoupling**
- **No Direct Dependencies**: Services never import code from each other
- **HTTP-Only Communication**: All inter-service communication via REST APIs
- **Service Discovery**: Services find each other via Consul, not hardcoded URLs
- **Independent Deployment**: Each service can be deployed, scaled, and updated independently
- **Failure Isolation**: Failure of one service doesn't bring down others

### 2. **Service Discovery with Consul**
- All services register themselves with Consul on startup
- Services use Consul to discover other services dynamically
- Health checks ensure only healthy services are available
- Automatic service deregistration on shutdown

### 3. **Configuration Management**
- Environment variables for runtime configuration
- Service-specific config files for complex settings
- Consul for distributed configuration (future enhancement)
- Clear precedence: ENV vars > config files > defaults

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   BPMN/Camunda  │    │     Consul      │    │   PostgreSQL    │
│   Orchestration │    │ Service Registry │    │    Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                             │                             │
┌───▼────┐  ┌──────────┐  ┌──────▼──┐  ┌─────────────┐  ┌─────────┐
│Analysis│  │ Prompt   │  │ OpenAI  │  │ Python      │  │ Monitor │
│Service │  │ Service  │  │ Service │  │ Execution   │  │ Service │
│        │  │          │  │         │  │ Service     │  │         │
│:8002   │  │:5300     │  │:5000    │  │:8003        │  │:5200    │
└────────┘  └──────────┘  └─────────┘  └─────────────┘  └─────────┘
```

### Service Responsibilities

#### **Analysis Service (Port 8002)**
- **Primary Role**: Orchestrates analysis workflows
- **Capabilities**:
  - Compiles analysis prompts using Prompt Service
  - Calls OpenAI Service for LLM analysis
  - Triggers Python Execution Service for computational work
  - Validates and structures analysis results
  - Provides BPMN integration endpoints

#### **Prompt Service (Port 5300)**
- **Primary Role**: Manages prompts and RAG content
- **Capabilities**:
  - Stores and retrieves prompt templates
  - Injects context variables
  - Provides RAG document integration
  - Compiles final prompts for LLM consumption

#### **OpenAI Service (Port 5000)**
- **Primary Role**: LLM interactions and AI capabilities
- **Capabilities**:
  - OpenAI API integration
  - Structured output generation
  - Assistant management
  - Token usage tracking

#### **Python Execution Service (Port 8003)**
- **Primary Role**: Safe computational analysis execution
- **Capabilities**:
  - Isolated Python code execution (Docker/subprocess)
  - Scientific computing environment
  - Resource-limited execution
  - Result capture and formatting

#### **Monitor Service (Port 5200)**
- **Primary Role**: System monitoring and health
- **Capabilities**:
  - Service health monitoring
  - Performance metrics
  - System diagnostics
  - Status reporting

## Communication Patterns

### 1. **Service Discovery Flow**
```python
# Example: Analysis Service finding OpenAI Service
config = get_service_config()
if config.consul_enabled:
    consul_client = consul.Consul(host=consul_host)
    services = consul_client.health.service('dadm-openai-service', passing=True)
    if services[1]:
        service = services[1][0]['Service']
        openai_url = f"http://{service['Address']}:{service['Port']}"
else:
    openai_url = config.openai_service_url  # Fallback
```

### 2. **Analysis Workflow Flow**
```
BPMN Task → Analysis Service → Prompt Service (get prompt)
                ↓
         OpenAI Service (LLM analysis)
                ↓
      Python Execution Service (computation)
                ↓
         Final result compilation
```

### 3. **Error Handling and Resilience**
- **Circuit Breaker Pattern**: Services handle downstream failures gracefully
- **Retry Logic**: Configurable retry attempts for service calls
- **Timeout Management**: Each service call has appropriate timeouts
- **Graceful Degradation**: Analysis continues with partial results if possible

## Configuration Strategy

### Environment Variables
```bash
# Analysis Service Configuration
ANALYSIS_PROMPT_SERVICE_URL=http://prompt-service:5300
ANALYSIS_OPENAI_SERVICE_URL=http://openai-service:5000
ANALYSIS_PYTHON_EXECUTION_URL=http://python-execution-service:8003
ANALYSIS_CONSUL_ENABLED=true
ANALYSIS_CONSUL_URL=http://consul:8500

# Service Discovery
USE_CONSUL=true
CONSUL_HTTP_ADDR=consul:8500
SERVICE_HOST=analysis-service
SERVICE_TYPE=analysis
```

### Service Registration
```python
# Each service registers itself with metadata
consul_client.agent.service.register(
    name="dadm-analysis-service",
    service_id=f"dadm-analysis-service-{host}-{port}",
    address=service_host,
    port=service_port,
    tags=["analysis", "llm", "dadm"],
    meta={
        "version": "1.0.0",
        "type": "analysis",
        "capabilities": "prompt-compilation,llm-integration,validation"
    },
    check=consul.Check.http(url=health_url, interval="10s")
)
```

## Integration Examples

### 1. **BPMN Integration**
```xml
<bpmn:serviceTask id="AnalyzeMarketData" name="Analyze Market Data">
  <bpmn:extensionElements>
    <camunda:connector>
      <camunda:inputOutput>
        <camunda:inputParameter name="url">http://analysis-service:8002/workflow/analyze</camunda:inputParameter>
        <camunda:inputParameter name="method">POST</camunda:inputParameter>
        <camunda:inputParameter name="payload">
          {
            "workflow_id": "${execution.processInstanceId}",
            "task_id": "AnalyzeMarketData",
            "analysis_type": "market_analysis",
            "data_sources": {
              "market_data": "${marketDataFile}",
              "historical_trends": "${trendsData}"
            }
          }
        </camunda:inputParameter>
      </camunda:inputOutput>
    </camunda:connector>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

### 2. **Analysis Orchestration**
```python
# Analysis Service orchestrating multiple services
async def execute_complete_analysis(analysis_request):
    # Step 1: Get LLM insights
    llm_result = await openai_integration.generate_analysis(
        prompt=compiled_prompt,
        schema=analysis_schema
    )
    
    # Step 2: Execute computational analysis
    computation_result = await python_integration.execute_python_code(
        code=llm_result["python_code"],
        environment="scientific"
    )
    
    # Step 3: Generate final insights
    final_insights = await openai_integration.generate_analysis(
        prompt=insights_prompt,
        schema=insights_schema
    )
    
    return {
        "llm_analysis": llm_result,
        "computational_results": computation_result,
        "final_insights": final_insights
    }
```

### 3. **Error Handling Example**
```python
async def call_service_with_resilience(service_url, payload, max_retries=3):
    for attempt in range(max_retries):
        try:
            async with session.post(service_url, json=payload, timeout=30) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.warning(f"Service call failed: {response.status}")
        except Exception as e:
            logger.warning(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise
```

## Deployment Considerations

### 1. **Docker Compose**
- Each service in separate container
- Shared network for internal communication
- Consul for service discovery
- Persistent volumes for data

### 2. **Scaling**
- Services can be scaled independently
- Load balancing via Consul + external load balancer
- Stateless design enables horizontal scaling

### 3. **Monitoring**
- Health checks for all services
- Consul health dashboard
- Service monitor provides centralized monitoring
- Structured logging for debugging

## Security Considerations

### 1. **Network Security**
- Internal service network isolated from external traffic
- API keys and secrets via environment variables
- No hardcoded credentials in code

### 2. **Execution Security**
- Python execution in isolated containers
- Resource limits for all executions
- Timeout controls
- Read-only data access where possible

### 3. **Service Security**
- Services validate input data
- Structured output schemas prevent injection
- Error handling doesn't leak sensitive information

## Benefits of This Architecture

1. **Maintainability**: Each service has clear responsibilities
2. **Testability**: Services can be tested independently
3. **Scalability**: Scale services based on demand
4. **Reliability**: Failure isolation and graceful degradation
5. **Flexibility**: Easy to add new services or modify existing ones
6. **Observability**: Clear service boundaries enable better monitoring

This architecture ensures that the DADM system remains maintainable and scalable while providing powerful integrated analysis capabilities through loosely-coupled, well-defined service interfaces.

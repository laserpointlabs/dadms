# DADM-Camunda Integration Quick Start Guide

This guide will help you quickly set up and test the integration between DADM (Data-driven Automated Decision Making) and Camunda BPM.

## Architecture Overview

The integration provides two complementary approaches:

1. **Streamlined Service Approach**: Call DADM as a service from simple BPMN processes
2. **Detailed Orchestration Approach**: Model complex decision-making workflows in BPMN with fine-grained control

## Prerequisites

- Python 3.9+
- All DADM services running (OpenAI, MCP services, Pipeline service)
- Camunda BPM (optional for testing - we provide simulation)

## Quick Setup

### 1. Start Required Services

First, ensure all DADM services are running:

```bash
# Start OpenAI service (port 5200)
python scripts/service_manager.py start openai-service

# Start MCP services
python scripts/service_manager.py start statistical-mcp-service  # port 5201
python scripts/service_manager.py start neo4j-mcp-service       # port 5202  
python scripts/service_manager.py start script-execution-mcp-service # port 5203

# Start LLM-MCP Pipeline service (port 5204)
python scripts/pipeline_service_manager.py start
```

### 2. Start DADM Wrapper Service

```bash
# Start the DADM wrapper service (port 5205)
python scripts/dadm_wrapper_service_manager.py start
```

### 3. Verify Installation

```bash
# Check all services are healthy
python scripts/dadm_wrapper_service_manager.py validate

# Check service status
python scripts/dadm_wrapper_service_manager.py status
```

### 4. Run Integration Tests

```bash
# Run comprehensive integration test suite
python scripts/test_dadm_camunda_integration.py
```

## Usage Examples

### Example 1: Simple Service Call (Streamlined Approach)

Call DADM as a service from your application or BPMN process:

```python
import requests

# Service call payload
payload = {
    "task_name": "Strategic Analysis",
    "task_description": "Analyze strategic options for Q1 2024",
    "variables": {
        "execution_type": "pipeline",
        "pipeline_name": "decision_analysis",
        "decision_context": "Q1 2024 Strategic Planning",
        "stakeholders": ["CEO", "CTO", "CFO"],
        "criteria": ["ROI", "Risk", "Strategic Alignment"],
        "alternatives": [
            "Expand Marketing",
            "Invest in R&D", 
            "Optimize Operations"
        ]
    }
}

# Call DADM service
response = requests.post(
    "http://localhost:5205/process_task",
    json=payload
)

result = response.json()
print(f"Analysis Status: {result['status']}")
print(f"Results: {result['result']}")
```

### Example 2: Pipeline Execution

Execute specific analysis pipelines:

```python
import requests

# Direct pipeline execution
payload = {
    "pipeline_name": "stakeholder_analysis",
    "variables": {
        "project_name": "Digital Transformation Initiative",
        "stakeholder_data": "Internal: Executive team, IT department, End users. External: Customers, Partners, Vendors"
    }
}

response = requests.post(
    "http://localhost:5205/execute/pipeline",
    json=payload
)

result = response.json()
print(f"Stakeholder Analysis: {result}")
```

### Example 3: Custom Analysis

Execute custom analysis with specific tools:

```python
import requests

# Custom analysis
payload = {
    "type": "pipeline",
    "pipeline_name": "custom", 
    "variables": {
        "tools": ["statistical_mcp_service", "openai_service"],
        "analysis_prompt": "Analyze the following business data and provide insights...",
        "data_context": "Business performance metrics for Q4 2023"
    }
}

response = requests.post(
    "http://localhost:5205/execute/analysis",
    json=payload
)

result = response.json()
print(f"Custom Analysis: {result}")
```

## BPMN Integration

### Camunda External Task Configuration

Configure your Camunda process to call DADM services:

```xml
<bpmn:serviceTask id="dadm_analysis" name="Execute DADM Analysis" 
                  camunda:type="external" camunda:topic="dadm-analysis">
  <bpmn:extensionElements>
    <camunda:inputOutput>
      <camunda:inputParameter name="serviceUrl">http://localhost:5205/process_task</camunda:inputParameter>
      <camunda:inputParameter name="method">POST</camunda:inputParameter>
      <camunda:inputParameter name="payload">
        {
          "task_name": "BPMN Analysis Task",
          "variables": {
            "execution_type": "pipeline",
            "pipeline_name": "decision_analysis",
            "decision_context": "${decision_context}",
            "stakeholders": "${stakeholders}"
          }
        }
      </camunda:inputParameter>
    </camunda:inputOutput>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

### External Task Worker (Java)

```java
@ExternalTaskSubscription("dadm-analysis")
public void executeDADMAnalysis(ExternalTask externalTask, ExternalTaskService externalTaskService) {
    try {
        // Get variables from BPMN
        String serviceUrl = externalTask.getVariable("serviceUrl");
        String payload = externalTask.getVariable("payload");
        
        // Call DADM service
        String result = callDADMService(serviceUrl, payload);
        
        // Complete task with results
        Map<String, Object> variables = new HashMap<>();
        variables.put("analysis_results", result);
        externalTaskService.complete(externalTask, variables);
        
    } catch (Exception e) {
        externalTaskService.handleFailure(externalTask, "DADM Analysis Failed", e.getMessage(), 3, 10000);
    }
}
```

## Available Endpoints

### DADM Wrapper Service (Port 5205)

- `GET /health` - Health check
- `POST /process_task` - Main endpoint for Camunda integration
- `POST /execute/pipeline` - Execute analysis pipeline
- `POST /execute/process` - Execute DADM process
- `POST /execute/analysis` - Execute custom analysis

### Payload Examples

#### Process Task (Camunda Integration)
```json
{
  "task_name": "Strategic Decision Analysis",
  "task_description": "Comprehensive strategic analysis",
  "variables": {
    "execution_type": "pipeline",
    "pipeline_name": "decision_analysis",
    "decision_context": "Your decision context here",
    "criteria": ["criterion1", "criterion2"],
    "alternatives": ["option1", "option2"]
  }
}
```

#### Pipeline Execution
```json
{
  "pipeline_name": "stakeholder_analysis",
  "variables": {
    "project_name": "Your Project Name",
    "stakeholder_data": "Stakeholder information..."
  }
}
```

## Available Pipelines

1. **decision_analysis** - Comprehensive decision analysis with criteria and alternatives
2. **stakeholder_analysis** - Stakeholder impact and engagement analysis  
3. **optimization_analysis** - Optimization and efficiency analysis
4. **custom** - Custom pipeline with specified tools and prompts

## Troubleshooting

### Common Issues

1. **Service Not Available**
   ```bash
   # Check service status
   python scripts/dadm_wrapper_service_manager.py status
   
   # Restart service
   python scripts/dadm_wrapper_service_manager.py stop
   python scripts/dadm_wrapper_service_manager.py start
   ```

2. **Dependencies Missing**
   ```bash
   # Validate all dependencies
   python scripts/dadm_wrapper_service_manager.py validate
   ```

3. **Analysis Timeout**
   - Increase timeout values in your HTTP client
   - Check service logs for performance issues
   - Consider breaking complex analyses into smaller steps

### Testing Commands

```bash
# Test specific functionality
python scripts/dadm_wrapper_service_manager.py test

# Run full integration test suite
python scripts/test_dadm_camunda_integration.py

# Check service health
curl http://localhost:5205/health
```

### Monitoring

Monitor service performance and health:

```bash
# View service logs
tail -f logs/dadm_wrapper_service.log

# Check service registry
python -c "from config.service_registry import ServiceRegistry; sr = ServiceRegistry(); print(sr.get_all_services())"
```

## Best Practices

### 1. Error Handling
- Always implement proper error handling in your BPMN processes
- Use retry mechanisms for transient failures  
- Log analysis results for audit trails

### 2. Performance
- Set appropriate timeouts for long-running analyses
- Consider async processing for complex workflows
- Monitor service performance and scale as needed

### 3. Security
- Secure service communications with HTTPS in production
- Implement authentication/authorization
- Validate input data and sanitize outputs

### 4. Process Design
- Use streamlined approach for simple decision support
- Use detailed orchestration for complex multi-step analyses
- Document your integration patterns for team consistency

## Next Steps

1. **Deploy to Production**: Configure services for production environment
2. **Scale Services**: Set up load balancing and scaling for high-volume usage
3. **Monitoring**: Implement comprehensive monitoring and alerting
4. **Custom Pipelines**: Create domain-specific analysis pipelines
5. **Advanced Integration**: Integrate with other enterprise systems

## Support

For issues and questions:
- Check the troubleshooting section above
- Review service logs for error details
- Run the integration test suite to identify specific problems
- Consult the detailed integration patterns documentation

## Related Documentation

- [LLM-MCP Pipeline Service Usage](LLM_MCP_PIPELINE_SERVICE_USAGE.md)
- [DADM-Camunda Integration Patterns](CAMUNDA_DADM_INTEGRATION_PATTERNS.md)
- [Service Architecture Overview](SERVICE_ARCHITECTURE.md)

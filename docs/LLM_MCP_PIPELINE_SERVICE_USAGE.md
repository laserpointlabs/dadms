# LLM-MCP Pipeline Service Usage Guide

## Overview

The LLM-MCP Pipeline Service provides a streamlined way to integrate LLMs with MCP servers in your DADM workflows. Instead of modeling complex pipelines in BPMN, you can call this service as a single service task that orchestrates the entire LLM-MCP interaction.

## Architecture Benefits

### 1. **Clean Separation of Concerns**
- **Pipeline Logic**: Handled by the Pipeline Service
- **BPMN Modeling**: Focus on business process flow
- **Service Integration**: Abstracted away from BPMN

### 2. **Streamlined Configuration**
Instead of configuring multiple service tasks in BPMN:
```xml
<!-- Old way: Multiple service tasks -->
<serviceTask id="PrepareData" />
<serviceTask id="AnalyzeWithMCP" />
<serviceTask id="InterpretWithLLM" />
<serviceTask id="FormatResults" />
```

You now have a single service task:
```xml
<!-- New way: Single pipeline task -->
<serviceTask id="AnalysisTask" />
```

### 3. **Flexible Pipeline Definitions**
- **Predefined Pipelines**: Ready-to-use for common scenarios
- **Custom Pipelines**: Define your own LLM-MCP combinations
- **Runtime Configuration**: Configure pipelines via task variables

## Usage Examples

### 1. BPMN Service Task Configuration

Configure your BPMN service task to use the pipeline service:

```xml
<bpmn:serviceTask id="DecisionAnalysisTask" 
                  name="Comprehensive Decision Analysis" 
                  camunda:type="external" 
                  camunda:topic="ProcessDecisionAnalysis">
  <bpmn:documentation>
    Perform comprehensive decision analysis using both statistical methods and AI reasoning.
  </bpmn:documentation>
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.type" value="pipeline" />
      <camunda:property name="service.name" value="llm-mcp-pipeline" />
      <camunda:property name="service.version" value="1.0" />
      <camunda:property name="pipeline.name" value="decision_analysis" />
      <camunda:property name="pipeline.output_format" value="structured" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

### 2. Process Variables

Your BPMN process should provide these variables:

```json
{
  "decision_alternatives": [
    {
      "name": "Alternative A",
      "cost": 100000,
      "performance_score": 85,
      "risk_level": "medium"
    },
    {
      "name": "Alternative B", 
      "cost": 150000,
      "performance_score": 92,
      "risk_level": "low"
    }
  ],
  "criteria": [
    {"name": "cost", "weight": 0.3, "type": "minimize"},
    {"name": "performance", "weight": 0.5, "type": "maximize"},
    {"name": "risk", "weight": 0.2, "type": "minimize"}
  ],
  "context": "Software system selection for enterprise deployment"
}
```

### 3. Custom Pipeline Configuration

For specialized analysis, you can define custom pipelines:

```json
{
  "pipeline_name": "risk_assessment",
  "custom_config": {
    "pipeline_name": "custom_risk_assessment",
    "llm_config": {
      "service_name": "dadm-openai-assistant",
      "service_type": "assistant",
      "endpoint": "http://localhost:5000",
      "timeout": 120
    },
    "mcp_config": {
      "server_name": "script_execution",
      "service_name": "mcp-script-execution-service",
      "tools": ["monte_carlo_simulation", "risk_analysis"],
      "endpoint": "http://localhost:5203"
    },
    "output_format": "structured",
    "analysis_type": "risk_assessment",
    "enable_reasoning": true,
    "enable_mathematical_analysis": true
  }
}
```

## Predefined Pipelines

### 1. **decision_analysis**
- **LLM**: OpenAI Assistant for reasoning and interpretation
- **MCP**: Statistical Service for quantitative analysis
- **Tools**: calculate_statistics, run_statistical_test
- **Use Case**: Multi-criteria decision analysis with statistical validation

### 2. **stakeholder_analysis**
- **LLM**: OpenAI Assistant for stakeholder insights
- **MCP**: Neo4j Service for network analysis
- **Tools**: calculate_centrality, community_detection
- **Use Case**: Stakeholder influence mapping and relationship analysis

### 3. **optimization_analysis**
- **LLM**: OpenAI Assistant for optimization insights
- **MCP**: Script Execution Service for mathematical optimization
- **Tools**: optimize_function, monte_carlo_simulation
- **Use Case**: Mathematical optimization with AI-driven interpretation

## Service Endpoints

### Health Check
```
GET http://localhost:5204/health
```

### List Available Pipelines
```
GET http://localhost:5204/pipelines
```

### Process Task (Main Endpoint)
```
POST http://localhost:5204/process_task
Content-Type: application/json

{
  "task_name": "Decision Analysis",
  "task_description": "Analyze software alternatives for enterprise deployment",
  "pipeline_name": "decision_analysis",
  "variables": {
    "alternatives": [...],
    "criteria": [...],
    "context": "..."
  },
  "process_instance_id": "proc_123"
}
```

### Create Custom Pipeline
```
POST http://localhost:5204/pipelines/create
Content-Type: application/json

{
  "pipeline_name": "custom_analysis",
  "llm_config": {...},
  "mcp_config": {...},
  "output_format": "structured"
}
```

## Integration with DADM

### 1. Service Discovery
The pipeline service registers itself automatically with DADM's service discovery mechanism:

```python
# The service will be discovered as:
{
  "pipeline": {
    "llm-mcp-pipeline": {
      "endpoint": "http://localhost:5204",
      "description": "Streamlined LLM-MCP Pipeline Service",
      "capabilities": ["decision_analysis", "stakeholder_analysis", ...]
    }
  }
}
```

### 2. Service Orchestrator Integration
The DADM Service Orchestrator will automatically route tasks with `service.type=pipeline` to this service.

### 3. Result Format
The service returns structured results compatible with DADM workflows:

```json
{
  "status": "success",
  "result": {
    "analysis_type": "decision_analysis",
    "llm_analysis": {
      "summary": "Based on the analysis...",
      "recommendations": [...],
      "confidence_level": "high"
    },
    "mathematical_analysis": {
      "statistical_results": {...},
      "mcp_service_info": {...}
    },
    "metadata": {
      "llm_service": "dadm-openai-assistant",
      "mcp_service": "mcp-statistical-service",
      "tools_used": ["calculate_statistics"]
    }
  }
}
```

## Best Practices

### 1. **Use Predefined Pipelines for Common Cases**
Start with predefined pipelines (decision_analysis, stakeholder_analysis, optimization_analysis) for most use cases.

### 2. **Create Custom Pipelines for Specialized Analysis**
When predefined pipelines don't meet your needs, create custom configurations with specific tool combinations.

### 3. **Configure Output Format Based on Downstream Processing**
- `"structured"`: For complex analysis with multiple sections
- `"json"`: For programmatic processing
- `"text"`: For human-readable reports

### 4. **Use Process Instance IDs for Thread Persistence**
Include `process_instance_id` in your requests to maintain conversation continuity across the pipeline.

### 5. **Validate Configurations Before Deployment**
Use the `/pipelines/validate` endpoint to check custom configurations before deploying to production.

## Testing the Service

### Start the Service
```bash
cd c:\Users\JohnDeHart\Documents\dadm
python services\llm_mcp_pipeline_service\service.py
```

### Test Health Check
```bash
curl http://localhost:5204/health
```

### Test Decision Analysis Pipeline
```bash
curl -X POST http://localhost:5204/process_task \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "Test Decision Analysis",
    "pipeline_name": "decision_analysis",
    "variables": {
      "data": [1, 2, 3, 4, 5],
      "alternatives": ["A", "B", "C"],
      "context": "Test scenario"
    }
  }'
```

## Monitoring and Debugging

### Service Logs
The service provides detailed logging for:
- Pipeline execution steps
- LLM service interactions
- MCP service communications
- Error handling and recovery

### Health Monitoring
Monitor service health through:
- Health endpoint (`/health`)
- Service registry (Consul if available)
- Pipeline validation results
- Execution success rates

This streamlined approach allows you to focus on business process modeling in BPMN while delegating the complexity of LLM-MCP orchestration to a specialized service.

# DADM Analysis Service

The Analysis Service provides LLM-driven structured analysis capabilities with BPMN workflow integration. It enables BPMN service tasks to specify both a prompt and an analysis template, guiding the LLM to produce structured responses for decision analysis, risk assessment, and other analytical tasks.

## Architecture

The Analysis Service consists of four main components:

### 1. Template Manager (`template_manager.py`)
Manages analysis templates that define:
- Response schemas (JSON Schema)
- Analysis instructions for LLMs
- Output format requirements
- Validation rules

### 2. Prompt Compiler (`prompt_compiler.py`)
Compiles base prompts with injected analysis instructions:
- Fetches base prompts from the Prompt Service
- Injects analysis template instructions
- Estimates token usage
- Manages RAG content integration

### 3. Analysis Processor (`analysis_processor.py`)
Processes compiled prompts through LLMs:
- Simulates LLM calls (configurable)
- Validates LLM responses against schemas
- Extracts insights and computes metrics
- Generates recommendations

### 4. Service Interface (`service.py`)
FastAPI service providing REST endpoints:
- `/analyze` - Execute analysis requests
- `/workflow/analyze` - BPMN workflow integration
- `/templates` - Template management
- `/health` - Health checks

## Data Flow

1. **Analysis Request** → Template + Prompt references with context variables
2. **Prompt Compilation** → Base prompt + Analysis instructions
3. **LLM Processing** → Structured response generation
4. **Validation** → Schema compliance checking
5. **Analysis Execution** → Insights extraction + Metrics computation
6. **Results** → Structured analysis with recommendations

## Analysis Templates

Templates are defined in `analysis_templates.json` and include:

### Decision Analysis Template
```json
{
  "id": "decision_analysis_v1",
  "name": "Decision Analysis Framework",
  "category": "decision_support",
  "schema": {
    "type": "object",
    "required": ["decision_context", "alternatives", "criteria", "analysis", "recommendation"],
    "properties": {
      "decision_context": { "type": "string" },
      "alternatives": { "type": "array" },
      "criteria": { "type": "array" },
      "analysis": { "type": "object" },
      "recommendation": { "type": "object" }
    }
  }
}
```

### Risk Analysis Template
For risk assessment with probability, impact, and mitigation strategies.

### Business Analysis Template  
For strategic business analysis with SWOT, competitive landscape, and market analysis.

## API Usage

### Basic Analysis Request
```python
POST /analyze
{
  "prompt_reference": "business_strategy_prompt",
  "analysis_reference": "decision_analysis_v1", 
  "context_variables": {
    "company": "TechCorp",
    "decision": "market_expansion",
    "budget": 1000000
  },
  "metadata": {
    "priority": "high",
    "deadline": "2024-12-31"
  }
}
```

### BPMN Workflow Integration
```python
POST /workflow/analyze
{
  "workflow_id": "expansion_decision_process",
  "task_id": "analyze_market_opportunity", 
  "prompt_reference": "market_analysis_prompt",
  "analysis_reference": "business_analysis_v1",
  "process_variables": {
    "target_market": "europe",
    "budget": 1000000
  },
  "task_variables": {
    "analysis_depth": "comprehensive"
  }
}
```

## BPMN Integration

To use the Analysis Service in BPMN workflows:

### Service Task Configuration
```xml
<bpmn:serviceTask id="AnalyzeDecision" name="Perform Decision Analysis">
  <bpmn:extensionElements>
    <camunda:connector>
      <camunda:inputOutput>
        <camunda:inputParameter name="url">http://dadm-analysis-service:8000/workflow/analyze</camunda:inputParameter>
        <camunda:inputParameter name="method">POST</camunda:inputParameter>
        <camunda:inputParameter name="headers">
          <camunda:map>
            <camunda:entry key="Content-Type">application/json</camunda:entry>
          </camunda:map>
        </camunda:inputParameter>
        <camunda:inputParameter name="payload">
          {
            "workflow_id": "${execution.getProcessInstanceId()}",
            "task_id": "analyze_decision",
            "prompt_reference": "${prompt_template}",
            "analysis_reference": "${analysis_template}",
            "process_variables": {
              "decision_context": "${decision_context}",
              "budget": ${budget},
              "timeline": "${timeline}"
            }
          }
        </camunda:inputParameter>
        <camunda:outputParameter name="analysis_result">${response}</camunda:outputParameter>
      </camunda:inputOutput>
    </camunda:connector>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

## Configuration

Set environment variables:
```bash
export PROMPT_SERVICE_URL=http://dadm-prompt-service:8000
export CAMUNDA_URL=http://dadm-camunda:8080
export LLM_SERVICE_URL=http://dadm-llm:8000  # Optional for real LLM integration
```

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python -m uvicorn service:app --host 0.0.0.0 --port 8000

# Or run directly
python service.py
```

## Development Features

### LLM Simulation
The service includes simulated LLM responses for development:
- Generates realistic structured responses
- Validates against schemas
- Computes sample metrics and insights
- Enables full workflow testing without LLM costs

### Template Validation
- JSON Schema validation for all templates
- Runtime schema compliance checking
- Detailed validation error reporting
- Template statistics and usage tracking

### Extensibility
- Easy to add new analysis templates
- Pluggable LLM backends
- Configurable validation levels
- Comprehensive logging and monitoring

## Next Steps

1. **Real LLM Integration**: Replace simulation with actual LLM calls
2. **Result Persistence**: Store analysis results in database
3. **Advanced Analytics**: Add trend analysis and comparison features
4. **Security**: Add authentication and authorization
5. **Monitoring**: Add metrics and observability features

## Examples

See the `examples/` directory for:
- BPMN process definitions using analysis services
- Sample analysis templates
- Integration test scripts
- Performance benchmarking tools

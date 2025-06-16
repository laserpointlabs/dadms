# DADM Analysis Service - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Service
```bash
cd /home/jdehart/dadm/services/analysis_service
python -m uvicorn service:app --host 0.0.0.0 --port 8002
```

### 2. Verify Service Health
```bash
curl http://localhost:8002/health
# Expected: {"status":"healthy","service":"dadm-analysis-service"}
```

### 3. List Available Templates
```bash
curl http://localhost:8002/templates
# Returns: 3 analysis templates (decision_analysis, risk_analysis, business_analysis)
```

## 📊 Available Analysis Templates

### Decision Analysis (`decision_analysis`)
**Purpose**: Structured decision-making with stakeholder analysis  
**Use Case**: Technology selection, strategic choices, vendor evaluation  
**Output**: Stakeholders, alternatives, evaluation criteria, scoring matrix, recommendations

### Risk Analysis (`risk_analysis`)  
**Purpose**: Comprehensive risk assessment and mitigation planning  
**Use Case**: Project risk analysis, security assessments, business continuity  
**Output**: Risk identification, probability/impact assessment, mitigation strategies

### Business Analysis (`business_analysis`)
**Purpose**: Business case evaluation with financial analysis  
**Use Case**: Investment decisions, project justification, ROI analysis  
**Output**: Executive summary, financial analysis, implementation plan, success metrics

## 💡 Example Usage

### Simple Analysis Request
```bash
curl -X POST http://localhost:8002/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_reference": "strategic_decision_prompt",
    "analysis_reference": "decision_analysis",
    "context_variables": {
      "company": "TechStartup Inc",
      "decision": "cloud_platform_selection",
      "budget": 150000,
      "timeline": "Q3_2024"
    },
    "metadata": {
      "priority": "high",
      "department": "engineering"
    }
  }'
```

### BPMN Workflow Integration
```bash
curl -X POST http://localhost:8002/workflow/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "platform_selection_workflow_001",
    "task_id": "analyze_cloud_options",
    "prompt_reference": "cloud_analysis_prompt",
    "analysis_reference": "decision_analysis",
    "process_variables": {
      "project_name": "Cloud Migration Project",
      "budget": 200000,
      "timeline": "6_months",
      "compliance_requirements": ["SOC2", "GDPR"]
    },
    "task_variables": {
      "analysis_depth": "comprehensive",
      "include_cost_analysis": true,
      "vendor_preferences": ["AWS", "Azure", "GCP"]
    }
  }'
```

## 🔧 BPMN Service Task Configuration

Add this to your BPMN process definition:

```xml
<bpmn:serviceTask id="AnalyzeCloudOptions" name="Analyze Cloud Platform Options">
  <bpmn:extensionElements>
    <camunda:connector>
      <camunda:inputOutput>
        <camunda:inputParameter name="url">http://dadm-analysis-service:8002/workflow/analyze</camunda:inputParameter>
        <camunda:inputParameter name="method">POST</camunda:inputParameter>
        <camunda:inputParameter name="headers">
          <camunda:map>
            <camunda:entry key="Content-Type">application/json</camunda:entry>
          </camunda:map>
        </camunda:inputParameter>
        <camunda:inputParameter name="payload">
          {
            "workflow_id": "${execution.getProcessInstanceId()}",
            "task_id": "analyze_cloud_options",
            "prompt_reference": "${analysis_prompt_template}",
            "analysis_reference": "decision_analysis",
            "process_variables": {
              "project_name": "${project_name}",
              "budget": ${project_budget},
              "timeline": "${project_timeline}",
              "requirements": "${compliance_requirements}"
            },
            "task_variables": {
              "analysis_depth": "comprehensive",
              "include_financials": true
            }
          }
        </camunda:inputParameter>
        <camunda:outputParameter name="analysis_result">${response}</camunda:outputParameter>
        <camunda:outputParameter name="analysis_execution_id">${response.prop("execution_id").stringValue()}</camunda:outputParameter>
        <camunda:outputParameter name="analysis_confidence">${response.prop("execution").prop("confidence_score").numberValue()}</camunda:outputParameter>
      </camunda:inputOutput>
    </camunda:connector>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

## 📈 Monitoring and Statistics

### Get Service Statistics
```bash
curl http://localhost:8002/statistics
```

**Example Response:**
```json
{
  "template_statistics": {
    "total_templates": 3,
    "categories": {
      "decision_support": 1,
      "risk_management": 1, 
      "business_strategy": 1
    },
    "output_formats": {"json": 3},
    "complexity_levels": {"high": 2, "medium": 1}
  },
  "service_info": {
    "status": "running",
    "version": "1.0.0",
    "features": [
      "template_management",
      "prompt_compilation", 
      "analysis_processing",
      "workflow_integration",
      "llm_simulation"
    ]
  }
}
```

## 🎯 Response Format

All analysis requests return:

```json
{
  "execution_id": "unique_execution_identifier",
  "status": "completed|failed|pending",
  "analysis": {
    "analysis_id": "unique_analysis_id",
    "structured_content": { /* Validated analysis per template schema */ },
    "quality_score": 0.85,
    "validation": {
      "is_valid": true,
      "schema_compliance": 1.0
    }
  },
  "execution": {
    "insights": { /* Extracted patterns and insights */ },
    "metrics": { /* Computed analysis metrics */ },
    "recommendations": [ /* Actionable recommendations */ ],
    "confidence_score": 0.87,
    "execution_time": 2.5
  }
}
```

## 🛠️ Development Features

- **LLM Simulation**: Built-in simulated responses for testing without API costs
- **Schema Validation**: All responses validated against template schemas
- **Error Handling**: Graceful failure with detailed error messages
- **Logging**: Comprehensive logging for debugging and monitoring
- **Hot Reloading**: Templates can be updated without service restart

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Test Results**: See `TEST_RESULTS.md`
- **Template Definitions**: See `analysis_templates.json`
- **API Documentation**: Visit http://localhost:8002/docs (when service is running)

Happy analyzing! 🎉

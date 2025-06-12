# OpenAI + MCP Statistical Server BPMN Integration Guide

## Overview

This guide shows how to create a BPMN workflow that uses your OpenAI service to send data to the MCP statistical server for analysis. The workflow demonstrates how AI can orchestrate statistical analysis in business processes.

## Architecture

```
BPMN Process → Camunda Engine → OpenAI Service → MCP Statistical Server
```

1. **BPMN Process**: Defines the workflow steps
2. **Camunda Engine**: Orchestrates the process execution
3. **OpenAI Service**: `dadm-openai-assistant` handles AI tasks
4. **MCP Statistical Server**: Performs statistical calculations

## BPMN Workflow: `openai_statistical_analysis_process.bpmn`

### Process Steps

1. **Start Event**: Receives input data for analysis
2. **Prepare Data Task**: OpenAI service validates and prepares data
3. **Statistical Analysis Task**: OpenAI service calls MCP statistical server
4. **Interpret Results Task**: OpenAI service interprets statistical results
5. **End Event**: Process completes with analysis report

### Service Task Configuration

Each service task uses these properties:
- `service.type`: `assistant`
- `service.name`: `dadm-openai-assistant`
- `service.version`: `1.0`

For the statistical analysis task, add MCP-specific properties:
- `mcp.server`: `mcp-statistical-server`
- `mcp.tools`: `calculate_statistics,run_statistical_test,fit_regression_model,analyze_time_series`

## Testing the Workflow

### 1. Prerequisites

- OpenAI service running on port 5000
- MCP statistical server accessible
- Camunda engine running
- BPMN process deployed

### 2. Test Data Format

```json
{
  "dataset_name": "Sales Performance Q4 2024",
  "data_description": "Daily sales figures for the last quarter",
  "raw_values": [150, 165, 180, 145, 200, 175, 160, 185, 190, 155, ...]
}
```

### 3. Expected Workflow Output

The workflow produces:
- **Statistical Analysis**: Complete descriptive statistics
- **Distribution Tests**: Normality tests (Shapiro-Wilk, Anderson-Darling)
- **Business Interpretation**: AI-generated insights and recommendations
- **Action Items**: Next steps based on analysis

## Deployment Instructions

### 1. Deploy the BPMN Process

```bash
# Using Camunda Modeler
1. Open `camunda_models/openai_statistical_analysis_process.bpmn`
2. Click "Deploy" button
3. Set target: http://localhost:8080/engine-rest
4. Click "Deploy"
```

### 2. Start OpenAI Service

```bash
cd /path/to/dadm
python -m services.openai_service.service
```

### 3. Start MCP Statistical Server

```bash
cd /path/to/dadm
python mcp_servers/mcp_statistical_server.py
```

### 4. Run the Process

```bash
# Using DADM CLI
python src/app.py --start-process "OpenAI Statistical Analysis Process"

# Or via Camunda REST API
curl -X POST http://localhost:8080/engine-rest/process-definition/key/OpenAI_Statistical_Analysis_Process/start \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "dataset_name": {"value": "Test Data", "type": "String"},
      "raw_values": {"value": "[1,2,3,4,5,6,7,8,9,10]", "type": "String"}
    }
  }'
```

## Key Integration Points

### 1. OpenAI Service Configuration

The OpenAI service needs to be configured to work with MCP servers:

```json
{
  "service": {
    "name": "dadm-openai-assistant",
    "mcp_integration": {
      "enabled": true,
      "servers": [
        {
          "name": "mcp-statistical-server",
          "endpoint": "stdio",
          "command": "python mcp_servers/mcp_statistical_server.py"
        }
      ]
    }
  }
}
```

### 2. Process Variables

The workflow uses these key variables:
- `dataset_name`: Name of the dataset being analyzed
- `raw_values`: Array of numerical data
- `analysis_type`: Type of statistical analysis needed
- `statistical_results`: Results from MCP statistical server
- `business_interpretation`: AI interpretation of results

### 3. Error Handling

Each service task should include error handling:
- Data validation failures
- MCP server connection issues
- Invalid statistical inputs
- Analysis interpretation errors

## Sample Process Outputs

### Statistical Results (from MCP Server)
```json
{
  "count": 30,
  "mean": 174.67,
  "median": 175.0,
  "std": 18.89,
  "normality_test": {
    "test": "Shapiro-Wilk",
    "p_value": 0.7573,
    "is_normal": true
  }
}
```

### Business Interpretation (from OpenAI)
```json
{
  "executive_summary": "Sales analysis reveals consistent performance...",
  "key_findings": ["Average daily sales: $175", "Normal distribution"],
  "recommendations": ["Continue monitoring", "Consider forecasting"],
  "next_steps": ["Time series analysis", "Trend identification"]
}
```

## Advanced Features

### 1. Multiple Analysis Types

Extend the workflow to support:
- **Regression Analysis**: Using `fit_regression_model`
- **Time Series Analysis**: Using `analyze_time_series`
- **Hypothesis Testing**: Using `run_statistical_test`

### 2. Conditional Analysis

Add decision gateways based on:
- Data size (different tests for small vs large datasets)
- Data type (numerical vs categorical)
- Business context (sales vs financial vs operational data)

### 3. Report Generation

Add a final task to generate:
- PDF reports with charts and graphs
- Excel files with detailed statistics
- Dashboard updates with key metrics

## Monitoring and Logging

### Process Monitoring
- Track workflow execution times
- Monitor statistical analysis success rates
- Alert on analysis failures

### Data Quality Metrics
- Track data preparation success rates
- Monitor data validation results
- Log data quality issues

## Security Considerations

1. **Data Privacy**: Ensure sensitive data is handled appropriately
2. **API Security**: Secure communication between services
3. **Access Control**: Limit who can start statistical analysis processes
4. **Audit Trail**: Log all data access and analysis activities

## Troubleshooting

### Common Issues

1. **MCP Server Not Found**
   - Check server is running: `python mcp_servers/mcp_statistical_server.py`
   - Verify network connectivity
   - Check server configuration

2. **OpenAI Service Errors**
   - Verify API key is set: `OPENAI_API_KEY`
   - Check service endpoint: `http://localhost:5000/health`
   - Review service logs

3. **Data Format Issues**
   - Ensure data is numerical array
   - Check for missing values
   - Validate data size requirements

4. **Statistical Analysis Failures**
   - Verify data meets minimum requirements (3+ points for tests)
   - Check data distribution
   - Review MCP server logs

## Next Steps

1. **Test the workflow** with your sample data
2. **Customize the BPMN** for your specific use cases
3. **Integrate with your data sources** (databases, APIs, files)
4. **Add visualization components** for better reporting
5. **Implement monitoring and alerting** for production use

# OpenAI Service BPMN Test Workflows

This document describes the BPMN workflows created to test OpenAI service integration through the DADM analysis service.

## Available Test Workflows

### 1. Basic OpenAI Connectivity Test (`basic_openai_test.bpmn`)

**Purpose**: Simple connectivity test to verify OpenAI service is accessible through the analysis service.

**Process ID**: `BasicOpenAITest`

**Workflow Steps**:
1. **Start Event**: User enters a test question (default: "What is artificial intelligence?")
2. **Service Task**: Calls the analysis service `/analyze/integrated` endpoint with LLM-only execution
3. **User Task**: Displays the results including connection status and OpenAI response
4. **End Event**: Completes the test

**Use Case**: 
- Quick verification that OpenAI service is running and accessible
- Basic connectivity testing during system setup
- Troubleshooting OpenAI integration issues

**Configuration**:
- Uses GPT-4 model by default
- 60-second timeout
- Maximum 200 tokens response
- No computational tools (LLM only)

### 2. Simple OpenAI Test with Feedback (`simple_openai_test.bpmn`)

**Purpose**: Comprehensive OpenAI testing with user feedback and retry capabilities.

**Process ID**: `SimpleOpenAITest`

**Workflow Steps**:
1. **Start Event**: User configures the test with:
   - Custom question
   - Analysis type (Simple Question, Detailed Analysis, Technical Review)
   - LLM model selection
2. **Service Task**: Calls analysis service for OpenAI processing
3. **User Task**: Review response with detailed feedback options
4. **Gateway**: Decision point based on user satisfaction
5. **Branch A** (Satisfactory): Log results and complete successfully
6. **Branch B** (Needs Retry): Configure retry parameters and end with retry flag

**Use Case**:
- Interactive testing of OpenAI responses
- Quality assessment of LLM outputs
- Testing different models and analysis types
- Collecting feedback for service improvement

**Features**:
- Multiple analysis types
- Model selection (GPT-4, GPT-3.5-turbo)
- User feedback collection (Excellent, Satisfactory, Needs Improvement, Poor)
- Retry configuration for unsatisfactory responses
- Test result logging

## Integration Details

### Analysis Service Integration

Both workflows integrate with the analysis service through the `/analyze/integrated` endpoint:

```http
POST http://analysis-service:8002/analyze/integrated
Content-Type: application/json

{
  "analysis_type": "connectivity_test",
  "data_sources": {
    "question": "user_input_question",
    "test_type": "basic_openai_connectivity"
  },
  "analysis_parameters": {
    "task": "simple_response",
    "max_tokens": 200
  },
  "execution_tools": [],
  "llm_model": "gpt-4",
  "timeout": 60
}
```

### Expected Response Format

```json
{
  "execution_id": "exec_20240120_143022_abc123",
  "status": "completed",
  "llm_analysis": {
    "answer": "Artificial intelligence (AI) refers to...",
    "reasoning": "This response covers the key aspects...",
    "metadata": {
      "model_used": "gpt-4",
      "tokens_used": 150,
      "response_time": 2.3
    }
  },
  "execution_metadata": {
    "total_time": 2.5,
    "service_calls": 1
  }
}
```

## Deployment Instructions

### 1. Prerequisites

Ensure the following services are running:
- Camunda BPM Platform
- DADM Analysis Service (port 8002)
- DADM OpenAI Service (port 8001)
- Consul (if using service discovery)

### 2. Deploy BPMN Models

```bash
# Copy BPMN files to Camunda deployment directory
cp camunda_models/basic_openai_test.bpmn /camunda/deployment/
cp camunda_models/simple_openai_test.bpmn /camunda/deployment/

# Or use Camunda REST API
curl -X POST \
  'http://localhost:8080/engine-rest/deployment/create' \
  -F 'deployment-name=OpenAI Test Workflows' \
  -F 'file=@camunda_models/basic_openai_test.bpmn' \
  -F 'file=@camunda_models/simple_openai_test.bpmn'
```

### 3. Start Process Instances

#### Basic Connectivity Test
```bash
curl -X POST \
  'http://localhost:8080/engine-rest/process-definition/key/BasicOpenAITest/start' \
  -H 'Content-Type: application/json' \
  -d '{
    "variables": {
      "test_question": {"value": "Test OpenAI connectivity", "type": "String"}
    }
  }'
```

#### Interactive Test with Feedback
```bash
curl -X POST \
  'http://localhost:8080/engine-rest/process-definition/key/SimpleOpenAITest/start' \
  -H 'Content-Type: application/json' \
  -d '{
    "variables": {
      "user_question": {"value": "Explain quantum computing", "type": "String"},
      "analysis_type": {"value": "detailed_analysis", "type": "String"},
      "llm_model": {"value": "gpt-4", "type": "String"}
    }
  }'
```

## Troubleshooting

### Common Issues

1. **Service Task Fails with Connection Error**
   - Verify analysis service is running on port 8002
   - Check network connectivity between Camunda and analysis service
   - Verify service discovery configuration

2. **OpenAI Service Not Found**
   - Ensure OpenAI service is registered in Consul
   - Check analysis service configuration for OpenAI service URL
   - Verify OpenAI service is running on expected port

3. **Timeout Errors**
   - Increase timeout values in BPMN configuration
   - Check OpenAI API rate limits
   - Verify network latency between services

### Debug Endpoints

Use these endpoints to troubleshoot:

```bash
# Check analysis service health
curl http://localhost:8002/health

# Check service connectivity
curl http://localhost:8002/debug/connectivity

# Check configuration
curl http://localhost:8002/debug/config
```

### Log Monitoring

Monitor logs for these services:
- Camunda BPM Platform: `/camunda/logs/`
- Analysis Service: Check service logs for integration errors
- OpenAI Service: Monitor for API call success/failure

## Testing Scenarios

### Scenario 1: Basic Connectivity
1. Deploy `basic_openai_test.bpmn`
2. Start process with default question
3. Verify successful completion and response

### Scenario 2: Model Comparison
1. Deploy `simple_openai_test.bpmn`
2. Test with GPT-4 model
3. Retry with GPT-3.5-turbo
4. Compare response quality

### Scenario 3: Analysis Type Testing
1. Use different analysis types:
   - Simple Question
   - Detailed Analysis
   - Technical Review
2. Compare response depth and accuracy

### Scenario 4: Error Handling
1. Stop OpenAI service
2. Start basic test workflow
3. Verify proper error handling and messaging

## Performance Metrics

Track these metrics during testing:
- Response time from OpenAI service
- Analysis service processing time
- End-to-end workflow completion time
- Success/failure rates
- User satisfaction scores (from feedback workflow)

## Next Steps

1. **Enhanced Error Handling**: Add retry logic and better error classification
2. **Performance Monitoring**: Implement detailed performance metrics collection
3. **Batch Testing**: Create workflows for testing multiple questions simultaneously
4. **Integration Testing**: Combine with Python execution service for computational analysis
5. **Automated Testing**: Create scheduled workflows for continuous monitoring

## Related Documentation

- [DADM Analysis Service Documentation](DECOUPLED_ANALYSIS_ARCHITECTURE.md)
- [OpenAI Service Integration Guide](openai_integration.md)
- [BPMN Workflow Development Guide](IMPLEMENTING_SERVICES.md)
- [Service Integration Architecture](service_integration_guide.md)

# OpenAI Decision Process Workflow Testing Guide

This guide explains how to test, monitor, and optimize the OpenAI Decision Process BPMN workflow using the enhanced service orchestrator.

## Overview

The OpenAI Decision Process is a BPMN workflow designed to facilitate structured decision-making using AI assistance. The process consists of four key stages:

1. **Frame Decision**: Define the problem, stakeholders, criteria, constraints, and timeline
2. **Identify Alternatives**: Generate potential options that meet the requirements
3. **Evaluate Alternatives**: Rate each alternative against the established criteria
4. **Make Recommendation**: Provide a final recommendation with implementation plan

This guide will help you test the workflow, monitor its performance, and analyze its output quality.

## Prerequisites

- DADM framework installed and configured
- Camunda Engine running
- OpenAI service configured
- Python 3.10 or newer
- Required Python packages (see `requirements.txt`)

## Testing the Workflow

### Automated Testing

We've provided several scripts to test the workflow:

1. **Full Integration Test**

   ```powershell
   python .\scripts\test_openai_decision_process.py
   ```

   This script deploys the BPMN model (if needed), starts a process instance, monitors the execution, and generates a detailed report with metrics and output analysis.

2. **Run the Decision Process Worker**

   ```powershell
   python .\scripts\run_decision_process_worker.py
   ```

   This script starts workers for all task types in the process. You can then start process instances manually through Camunda Cockpit or API.

3. **Run Automated Test Case**

   ```powershell
   python .\tests\test_openai_decision_workflow.py
   ```

   This runs an automated test case that verifies the workflow functions correctly using mock responses.

### Manual Testing

You can also test the workflow manually:

1. Deploy the BPMN model to Camunda using Camunda Modeler or the deployment script:

   ```powershell
   python .\scripts\deploy_bpmn.py .\camunda_models\openai_decision_process.bpmn
   ```

2. Start the worker to process tasks:

   ```powershell
   python .\scripts\run_decision_process_worker.py
   ```

3. Start a process instance using Camunda Cockpit or the REST API:

   ```powershell
   # Using curl
   curl -X POST -H "Content-Type: application/json" -d "{\"variables\":{\"decision_context\":{\"value\":\"We need to select an appropriate UAS for disaster response operations\"},\"requirements\":{\"value\":\"Flight endurance of at least 45 minutes...\"}}}" http://localhost:8080/engine-rest/process-definition/key/OpenAI_Decision_Process/start
   ```

4. Monitor the execution in Camunda Cockpit and check task outputs.

## Monitoring and Performance Analysis

### Execution Metrics

The test script generates detailed metrics about the workflow execution:

- **Task Processing Times**: Time taken to process each task
- **Cache Performance**: Hit rates for XML cache, properties cache, etc.
- **API Call Counts**: Number of calls to external services
- **Overall Processing Time**: Total time to complete the workflow

These metrics are saved to `openai_decision_process_report_[timestamp].json`.

### Output Quality Analysis

The test script also analyzes the quality and completeness of task outputs:

- **Completeness Score**: Percentage of expected elements present in each task output
- **Missing Elements**: List of expected elements that were not found
- **Overall Quality Score**: Weighted score across all tasks

This analysis is saved to `openai_decision_process_analysis_[timestamp].json`.

## Optimizing Workflow Performance

### Enhanced Orchestrator Features

The Enhanced Service Orchestrator provides several features to optimize workflow performance:

1. **Caching**: XML definitions, service properties, and task documentation are cached to reduce redundant processing
2. **Connection Pooling**: HTTP connections are reused to reduce connection overhead
3. **XML Parsing Optimization**: ElementTree parsing reduces CPU usage compared to regex parsing
4. **Prefetching**: Common task definitions can be prefetched for faster processing
5. **Batch Processing**: Multiple tasks can be processed in a batch for improved efficiency

### Workflow-Specific Optimizations

For the OpenAI Decision Process specifically:

1. **Task Documentation**: Ensure task documentation is clear and specific
2. **Variable Passing**: Pass relevant variables between tasks to maintain context
3. **Service Configuration**: Configure timeouts and retries appropriately
4. **Prompt Engineering**: Refine task documentation wording for better AI response quality

## Interpreting Test Results

### Common Issues and Solutions

1. **Long Processing Times**
   - **Symptom**: Tasks taking >30 seconds to process
   - **Solution**: Check OpenAI service configuration, consider faster models, optimize prompts

2. **Missing Output Elements**
   - **Symptom**: Completeness score <80%
   - **Solution**: Review task documentation, make instructions more explicit

3. **Cache Miss Rate High**
   - **Symptom**: Cache hit rate <50%
   - **Solution**: Increase cache TTL, prefetch common process definitions

4. **Inconsistent Recommendations**
   - **Symptom**: Final recommendation doesn't match evaluation results
   - **Solution**: Improve variable passing between tasks, enhance task documentation

## OpenAI Decision Process Example

Here's an example of a complete decision process flow for selecting a UAS (drone) for disaster response:

### Frame Decision
```
# Decision Frame Analysis

## Key Decision
The key decision to be made is selecting the most appropriate Unmanned Aircraft System (UAS) for disaster response operations in urban environments.

## Stakeholders
1. Emergency Response Teams
2. Disaster Victims
3. Incident Commanders
4. Budget Authority
5. Technical Support Team
...
```

### Identify Alternatives
```
# UAS Alternatives for Disaster Response

## 1. DJI Matrice 300 RTK
**Description**: Professional-grade quadcopter designed for industrial applications.
**Specifications**:
- Flight Time: Up to 55 minutes
- Payload Capacity: 2.7 kg
...

## 2. Autel Robotics EVO II Dual 640T
...
```

### Evaluate Alternatives
```
# Evaluation of UAS Alternatives

## Evaluation Criteria Weighting
- Flight Endurance: 20%
- Payload Capacity: 15%
...

## DJI Matrice 300 RTK
1. Flight Endurance (5): Exceeds requirement with 55 minutes
...

## Weighted Score: 4.35/5
```

### Final Recommendation
```
# Final Recommendation: DJI Matrice 300 RTK

## Recommendation Justification
After evaluating all alternatives against the established criteria, I recommend the DJI Matrice 300 RTK as the optimal UAS platform for disaster response operations.
...

## Next Steps
1. Contact authorized DJI Enterprise dealers for final quotes
...
```

## Conclusion

By following this guide, you can effectively test, monitor, and optimize the OpenAI Decision Process workflow. The enhanced service orchestrator provides significant performance improvements through caching, connection pooling, and other optimizations, while the testing tools help ensure the workflow produces high-quality outputs consistently.

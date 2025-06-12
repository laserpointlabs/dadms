# DADM-Camunda Integration Patterns

This document describes integration patterns for using DADM (Data-driven Automated Decision Making) with Camunda BPM, enabling two complementary approaches:

1. **Streamlined Service Approach**: Call DADM as a service from simple BPMN processes
2. **Detailed Orchestration Approach**: Model complex decision-making workflows in BPMN

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Camunda BPM   │    │  DADM Wrapper    │    │  DADM Application   │
│                 │    │   Service        │    │                     │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────────┐ │
│ │ BPMN        │ │────┤ │ /process_task│ │────┤ │ LLM-MCP         │ │
│ │ Process     │ │    │ │ /execute/*   │ │    │ │ Pipeline        │ │
│ │ Engine      │ │    │ └──────────────┘ │    │ │ Service         │ │
│ └─────────────┘ │    └──────────────────┘    │ └─────────────────┘ │
└─────────────────┘                            │ ┌─────────────────┐ │
                                               │ │ OpenAI Service  │ │
                                               │ └─────────────────┘ │
                                               │ ┌─────────────────┐ │
                                               │ │ MCP Services    │ │
                                               │ │ (Stats, Neo4j,  │ │
                                               │ │  Script Exec)   │ │
                                               │ └─────────────────┘ │
                                               └─────────────────────┘
```

## Integration Pattern 1: Streamlined Service Approach

### Use Case
When you want to focus on business process orchestration and delegate complex AI/data analysis to DADM as a specialized service.

### BPMN Model
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" id="Definitions_1">
  <bpmn:process id="strategic_decision_process" name="Strategic Decision Process" isExecutable="true">
    
    <!-- Start Event -->
    <bpmn:startEvent id="start_decision_process" name="Decision Request Received">
      <bpmn:outgoing>flow_to_gather_info</bpmn:outgoing>
    </bpmn:startEvent>
    
    <!-- Gather Information Task -->
    <bpmn:userTask id="gather_decision_info" name="Gather Decision Information" camunda:assignee="#{initiator}">
      <bpmn:incoming>flow_to_gather_info</bpmn:incoming>
      <bpmn:outgoing>flow_to_dadm_analysis</bpmn:outgoing>
    </bpmn:userTask>
    
    <!-- DADM Analysis Service Task -->
    <bpmn:serviceTask id="dadm_analysis" name="Execute DADM Analysis" camunda:type="external" camunda:topic="dadm-analysis">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="serviceUrl">http://localhost:5205/process_task</camunda:inputParameter>
          <camunda:inputParameter name="method">POST</camunda:inputParameter>
          <camunda:inputParameter name="payload">
            {
              "task_name": "Strategic Decision Analysis",
              "task_description": "Comprehensive analysis for strategic decision making",
              "variables": {
                "execution_type": "pipeline",
                "pipeline_name": "decision_analysis",
                "decision_context": "#{decision_context}",
                "stakeholders": "#{stakeholders}",
                "criteria": "#{decision_criteria}",
                "alternatives": "#{alternatives}"
              }
            }
          </camunda:inputParameter>
        </camunda:inputOutput>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_dadm_analysis</bpmn:incoming>
      <bpmn:outgoing>flow_to_review_results</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <!-- Review Results Task -->
    <bpmn:userTask id="review_analysis_results" name="Review Analysis Results" camunda:assignee="#{decision_maker}">
      <bpmn:incoming>flow_to_review_results</bpmn:incoming>
      <bpmn:outgoing>flow_to_decision_gateway</bpmn:outgoing>
    </bpmn:userTask>
    
    <!-- Decision Gateway -->
    <bpmn:exclusiveGateway id="decision_gateway" name="Accept Analysis?">
      <bpmn:incoming>flow_to_decision_gateway</bpmn:incoming>
      <bpmn:outgoing>flow_to_implement</bpmn:outgoing>
      <bpmn:outgoing>flow_to_refine</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    
    <!-- Refine Analysis (loops back) -->
    <bpmn:serviceTask id="refine_analysis" name="Refine DADM Analysis" camunda:type="external" camunda:topic="dadm-analysis">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="serviceUrl">http://localhost:5205/process_task</camunda:inputParameter>
          <camunda:inputParameter name="method">POST</camunda:inputParameter>
          <camunda:inputParameter name="payload">
            {
              "task_name": "Refined Strategic Decision Analysis",
              "task_description": "Refined analysis with additional context",
              "variables": {
                "execution_type": "pipeline",
                "pipeline_name": "decision_analysis",
                "decision_context": "#{refined_decision_context}",
                "previous_analysis": "#{analysis_results}",
                "refinement_notes": "#{refinement_feedback}"
              }
            }
          </camunda:inputParameter>
        </camunda:inputOutput>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_refine</bpmn:incoming>
      <bpmn:outgoing>flow_back_to_review</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <!-- Implementation Task -->
    <bpmn:userTask id="implement_decision" name="Implement Decision" camunda:assignee="#{implementation_team}">
      <bpmn:incoming>flow_to_implement</bpmn:incoming>
      <bpmn:outgoing>flow_to_end</bpmn:outgoing>
    </bpmn:userTask>
    
    <!-- End Event -->
    <bpmn:endEvent id="end_decision_process" name="Decision Implemented">
      <bpmn:incoming>flow_to_end</bpmn:incoming>
    </bpmn:endEvent>
    
    <!-- Sequence Flows -->
    <bpmn:sequenceFlow id="flow_to_gather_info" sourceRef="start_decision_process" targetRef="gather_decision_info" />
    <bpmn:sequenceFlow id="flow_to_dadm_analysis" sourceRef="gather_decision_info" targetRef="dadm_analysis" />
    <bpmn:sequenceFlow id="flow_to_review_results" sourceRef="dadm_analysis" targetRef="review_analysis_results" />
    <bpmn:sequenceFlow id="flow_to_decision_gateway" sourceRef="review_analysis_results" targetRef="decision_gateway" />
    <bpmn:sequenceFlow id="flow_to_implement" sourceRef="decision_gateway" targetRef="implement_decision">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">#{analysis_approved == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow_to_refine" sourceRef="decision_gateway" targetRef="refine_analysis">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">#{analysis_approved == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow_back_to_review" sourceRef="refine_analysis" targetRef="review_analysis_results" />
    <bpmn:sequenceFlow id="flow_to_end" sourceRef="implement_decision" targetRef="end_decision_process" />
    
  </bpmn:process>
</bpmn:definitions>
```

### Benefits
- **Simple BPMN Models**: Focus on business process flow, not technical implementation
- **Reusable Service**: DADM analysis can be called from multiple processes
- **Clean Separation**: Business logic in BPMN, AI/data analysis in DADM
- **Easy Maintenance**: Changes to analysis logic don't require BPMN updates

## Integration Pattern 2: Detailed Orchestration Approach

### Use Case
When you want to model complex decision-making workflows with detailed control over each step of the analysis process.

### BPMN Model
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" id="Definitions_2">
  <bpmn:process id="detailed_analysis_orchestration" name="Detailed Analysis Orchestration" isExecutable="true">
    
    <!-- Start Event -->
    <bpmn:startEvent id="start_analysis" name="Analysis Required">
      <bpmn:outgoing>flow_to_data_collection</bpmn:outgoing>
    </bpmn:startEvent>
    
    <!-- Parallel Gateway for Data Collection -->
    <bpmn:parallelGateway id="parallel_data_collection" name="Collect Data">
      <bpmn:incoming>flow_to_data_collection</bpmn:incoming>
      <bpmn:outgoing>flow_to_statistical_analysis</bpmn:outgoing>
      <bpmn:outgoing>flow_to_stakeholder_analysis</bpmn:outgoing>
      <bpmn:outgoing>flow_to_graph_analysis</bpmn:outgoing>
    </bpmn:parallelGateway>
    
    <!-- Statistical Analysis Service Task -->
    <bpmn:serviceTask id="statistical_analysis" name="Statistical Analysis" camunda:type="external" camunda:topic="mcp-statistical">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="serviceUrl">http://localhost:5205/execute/pipeline</camunda:inputParameter>
          <camunda:inputParameter name="method">POST</camunda:inputParameter>
          <camunda:inputParameter name="payload">
            {
              "pipeline_name": "custom",
              "variables": {
                "tools": ["statistical_mcp_service"],
                "analysis_type": "descriptive_statistics",
                "data_source": "#{statistical_data}"
              }
            }
          </camunda:inputParameter>
        </camunda:inputOutput>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_statistical_analysis</bpmn:incoming>
      <bpmn:outgoing>flow_from_statistical_analysis</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <!-- Stakeholder Analysis Service Task -->
    <bpmn:serviceTask id="stakeholder_analysis" name="Stakeholder Analysis" camunda:type="external" camunda:topic="dadm-stakeholder">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="serviceUrl">http://localhost:5205/execute/pipeline</camunda:inputParameter>
          <camunda:inputParameter name="method">POST</camunda:inputParameter>
          <camunda:inputParameter name="payload">
            {
              "pipeline_name": "stakeholder_analysis",
              "variables": {
                "stakeholder_data": "#{stakeholder_information}",
                "project_context": "#{project_description}"
              }
            }
          </camunda:inputParameter>
        </camunda:inputOutput>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_stakeholder_analysis</bpmn:incoming>
      <bpmn:outgoing>flow_from_stakeholder_analysis</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <!-- Graph Analysis Service Task -->
    <bpmn:serviceTask id="graph_analysis" name="Graph Analysis" camunda:type="external" camunda:topic="mcp-neo4j">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="serviceUrl">http://localhost:5205/execute/pipeline</camunda:inputParameter>
          <camunda:inputParameter name="method">POST</camunda:inputParameter>
          <camunda:inputParameter name="payload">
            {
              "pipeline_name": "custom",
              "variables": {
                "tools": ["neo4j_mcp_service"],
                "analysis_type": "relationship_analysis",
                "graph_query": "#{neo4j_query}"
              }
            }
          </camunda:inputParameter>
        </camunda:inputOutput>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_graph_analysis</bpmn:incoming>
      <bpmn:outgoing>flow_from_graph_analysis</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <!-- Parallel Gateway Join -->
    <bpmn:parallelGateway id="join_analysis_results" name="Combine Results">
      <bpmn:incoming>flow_from_statistical_analysis</bpmn:incoming>
      <bpmn:incoming>flow_from_stakeholder_analysis</bpmn:incoming>
      <bpmn:incoming>flow_from_graph_analysis</bpmn:incoming>
      <bpmn:outgoing>flow_to_synthesis</bpmn:outgoing>
    </bpmn:parallelGateway>
    
    <!-- Synthesis Service Task -->
    <bpmn:serviceTask id="synthesis_analysis" name="Synthesize Analysis Results" camunda:type="external" camunda:topic="dadm-synthesis">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="serviceUrl">http://localhost:5205/execute/pipeline</camunda:inputParameter>
          <camunda:inputParameter name="method">POST</camunda:inputParameter>
          <camunda:inputParameter name="payload">
            {
              "pipeline_name": "custom",
              "variables": {
                "tools": ["openai_service"],
                "analysis_results": {
                  "statistical": "#{statistical_results}",
                  "stakeholder": "#{stakeholder_results}",
                  "graph": "#{graph_results}"
                },
                "synthesis_prompt": "Synthesize the following analysis results into actionable recommendations..."
              }
            }
          </camunda:inputParameter>
        </camunda:inputOutput>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_synthesis</bpmn:incoming>
      <bpmn:outgoing>flow_to_quality_check</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <!-- Quality Check Task -->
    <bpmn:userTask id="quality_check" name="Review Analysis Quality" camunda:assignee="#{quality_reviewer}">
      <bpmn:incoming>flow_to_quality_check</bpmn:incoming>
      <bpmn:outgoing>flow_to_quality_gateway</bpmn:outgoing>
    </bpmn:userTask>
    
    <!-- Quality Gateway -->
    <bpmn:exclusiveGateway id="quality_gateway" name="Quality Acceptable?">
      <bpmn:incoming>flow_to_quality_gateway</bpmn:incoming>
      <bpmn:outgoing>flow_to_finalize</bpmn:outgoing>
      <bpmn:outgoing>flow_to_rework</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    
    <!-- Rework Task (loops back) -->
    <bpmn:userTask id="rework_analysis" name="Rework Analysis Parameters" camunda:assignee="#{analyst}">
      <bpmn:incoming>flow_to_rework</bpmn:incoming>
      <bpmn:outgoing>flow_back_to_data_collection</bpmn:outgoing>
    </bpmn:userTask>
    
    <!-- Finalize Results Task -->
    <bpmn:userTask id="finalize_results" name="Finalize Analysis Results" camunda:assignee="#{decision_maker}">
      <bpmn:incoming>flow_to_finalize</bpmn:incoming>
      <bpmn:outgoing>flow_to_end</bpmn:outgoing>
    </bpmn:userTask>
    
    <!-- End Event -->
    <bpmn:endEvent id="end_analysis" name="Analysis Complete">
      <bpmn:incoming>flow_to_end</bpmn:incoming>
    </bpmn:endEvent>
    
    <!-- Sequence Flows -->
    <bpmn:sequenceFlow id="flow_to_data_collection" sourceRef="start_analysis" targetRef="parallel_data_collection" />
    <bpmn:sequenceFlow id="flow_to_statistical_analysis" sourceRef="parallel_data_collection" targetRef="statistical_analysis" />
    <bpmn:sequenceFlow id="flow_to_stakeholder_analysis" sourceRef="parallel_data_collection" targetRef="stakeholder_analysis" />
    <bpmn:sequenceFlow id="flow_to_graph_analysis" sourceRef="parallel_data_collection" targetRef="graph_analysis" />
    <bpmn:sequenceFlow id="flow_from_statistical_analysis" sourceRef="statistical_analysis" targetRef="join_analysis_results" />
    <bpmn:sequenceFlow id="flow_from_stakeholder_analysis" sourceRef="stakeholder_analysis" targetRef="join_analysis_results" />
    <bpmn:sequenceFlow id="flow_from_graph_analysis" sourceRef="graph_analysis" targetRef="join_analysis_results" />
    <bpmn:sequenceFlow id="flow_to_synthesis" sourceRef="join_analysis_results" targetRef="synthesis_analysis" />
    <bpmn:sequenceFlow id="flow_to_quality_check" sourceRef="synthesis_analysis" targetRef="quality_check" />
    <bpmn:sequenceFlow id="flow_to_quality_gateway" sourceRef="quality_check" targetRef="quality_gateway" />
    <bpmn:sequenceFlow id="flow_to_finalize" sourceRef="quality_gateway" targetRef="finalize_results">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">#{quality_approved == true}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow_to_rework" sourceRef="quality_gateway" targetRef="rework_analysis">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">#{quality_approved == false}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow_back_to_data_collection" sourceRef="rework_analysis" targetRef="parallel_data_collection" />
    <bpmn:sequenceFlow id="flow_to_end" sourceRef="finalize_results" targetRef="end_analysis" />
    
  </bpmn:process>
</bpmn:definitions>
```

### Benefits
- **Fine-grained Control**: Detailed control over each step of the analysis
- **Parallel Processing**: Multiple analyses can run in parallel  
- **Quality Gates**: Built-in quality checks and rework loops
- **Audit Trail**: Complete visibility into the analysis process

## Service Configuration

### External Task Configuration

For Camunda to call DADM services, configure external task topics:

```yaml
# application.yml
camunda:
  bpm:
    external-task:
      enabled: true
      topics:
        - topic-name: dadm-analysis
          lock-duration: 60000
          max-tasks: 5
        - topic-name: mcp-statistical  
          lock-duration: 30000
          max-tasks: 3
        - topic-name: dadm-stakeholder
          lock-duration: 45000
          max-tasks: 3
        - topic-name: mcp-neo4j
          lock-duration: 30000
          max-tasks: 3
        - topic-name: dadm-synthesis
          lock-duration: 60000  
          max-tasks: 2
```

### Service Worker Implementation

Create external task workers for each service:

```java
@Component
public class DADMServiceWorker {
    
    @ExternalTaskSubscription("dadm-analysis")
    public void executeDADMAnalysis(ExternalTask externalTask, ExternalTaskService externalTaskService) {
        try {
            // Get task variables
            String serviceUrl = externalTask.getVariable("serviceUrl");
            String payload = externalTask.getVariable("payload");
            
            // Call DADM service
            String result = callDADMService(serviceUrl, payload);
            
            // Complete task with results
            Map<String, Object> variables = new HashMap<>();
            variables.put("analysis_results", result);
            
            externalTaskService.complete(externalTask, variables);
            
        } catch (Exception e) {
            // Handle failure
            externalTaskService.handleFailure(externalTask, "DADM Analysis Failed", e.getMessage(), 3, 10000);
        }
    }
    
    private String callDADMService(String serviceUrl, String payload) {
        // Implementation for HTTP call to DADM service
        // Return analysis results
    }
}
```

## Best Practices

### When to Use Each Pattern

**Use Streamlined Service Approach when:**
- Business processes are the primary focus
- Analysis complexity is hidden from process modelers
- Multiple processes need similar analysis capabilities
- Development teams are separated (process vs. analysis)

**Use Detailed Orchestration Approach when:**
- Analysis workflow needs to be visible and controllable
- Complex error handling and quality gates are required
- Different stakeholders need to interact at specific analysis steps
- Audit requirements demand process visibility

### Implementation Guidelines

1. **Service Reliability**: Ensure DADM services are highly available
2. **Timeout Handling**: Configure appropriate timeouts for long-running analyses
3. **Error Handling**: Implement comprehensive error handling and retry logic
4. **Monitoring**: Add monitoring for service calls and analysis performance
5. **Security**: Secure service communications with authentication/authorization

### Performance Considerations

- **Async Processing**: Use asynchronous external tasks for long-running analyses
- **Resource Management**: Configure appropriate thread pools and connection limits
- **Caching**: Cache frequently used analysis results where appropriate
- **Load Balancing**: Distribute analysis load across multiple DADM service instances

## Example Usage

### Starting a Streamlined Process

```javascript
// Start strategic decision process
const processVariables = {
  decision_context: "Q1 2024 Budget Allocation",
  stakeholders: ["CFO", "Department Heads", "Board"],
  decision_criteria: ["ROI", "Strategic Alignment", "Risk Level"],
  alternatives: ["Expand Marketing", "Invest in R&D", "Improve Operations"],
  initiator: "budget.committee",
  decision_maker: "cfo"
};

camundaClient.startProcess("strategic_decision_process", processVariables);
```

### Starting a Detailed Orchestration Process

```javascript
// Start detailed analysis orchestration  
const analysisVariables = {
  statistical_data: "quarterly_performance_data.csv",
  stakeholder_information: "stakeholder_registry.json", 
  neo4j_query: "MATCH (d:Decision)-[:IMPACTS]->(s:Stakeholder) RETURN d, s",
  project_description: "Digital transformation initiative analysis",
  analyst: "data.analyst",
  quality_reviewer: "senior.analyst",
  decision_maker: "project.manager"
};

camundaClient.startProcess("detailed_analysis_orchestration", analysisVariables);
```

## Conclusion

Both integration patterns provide powerful ways to combine Camunda's process orchestration capabilities with DADM's AI-powered analysis. Choose the pattern that best fits your organizational needs, technical requirements, and process complexity.

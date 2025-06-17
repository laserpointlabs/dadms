# Agents.md

This document defines the agents involved in the DADM (Decision Analysis Data Model) system's orchestration and interaction when working with Codex or similar code-generation models. Each agent's role and responsibilities are clearly described to ensure clarity and effective collaboration.

## Vision & Goals

The DADM system represents a service-oriented architecture designed to orchestrate complex decision analysis workflows through intelligent agent coordination. Our goal is to create a seamless integration between human decision-makers, AI-powered assistants, and specialized computational services that can dynamically adapt to complex analytical requirements.

### Strategic Objectives
- **Dynamic Service Discovery**: Automatically discover and route to appropriate services based on semantic understanding
- **Intelligent Code Generation**: Generate executable Python code that integrates seamlessly with our service architecture
- **Adaptive Decision Support**: Provide contextual assistance throughout the decision-making process
- **Scalable Orchestration**: Support growing ecosystems of specialized services and tools

## 1. User Agent

**Role:** Initiates requests and interactions through natural language.

**Responsibilities:**
- Provides natural language requests or instructions for decision analysis tasks
- Interacts with the DADM system through web interface or direct API calls
- Defines decision problems, constraints, and objectives
- Reviews and validates generated analysis and recommendations

**Integration Points:**
- Web UI interface for workflow initiation
- Direct integration with Camunda BPMN processes
- Feedback loop for iterative refinement of analysis

## 2. Codex Agent (Code Generation Agent)

**Role:** Generates executable Python code based on structured prompts and system context.

**Responsibilities:**
- Transforms natural language instructions into clear, modular, executable Python scripts
- Ensures generated code follows DADM architectural patterns and service integration standards
- Includes appropriate error handling, logging, and response formatting
- Generates code that properly utilizes the service registry and orchestration layer
- Creates BPMN-compatible service task implementations
- Implements proper Camunda external task patterns

**Key Capabilities:**
- Service-aware code generation using `ServiceOrchestrator` patterns
- Integration with existing DADM components (OpenAI assistants, vector stores, Neo4j)
- Generation of containerized service implementations
- Creation of Consul service registration patterns

**Code Generation Standards:**
```python
# Example: Service-aware code generation pattern
from src.service_orchestrator import ServiceOrchestrator
from config.service_registry import get_service_registry

# Generated code should follow established patterns
orchestrator = ServiceOrchestrator()
result = orchestrator.route_task(task, variables)
```

## 3. OpenAI GPT Selection Agent

**Role:** Dynamically selects appropriate MCP services and constructs service requests.

**Responsibilities:**
- Reviews the DADM service registry and understands available service capabilities
- Analyzes natural language user requests to determine optimal service routing
- Chooses the most suitable service based on semantic understanding of requirements
- Constructs JSON payloads appropriate for the chosen service endpoints
- Ensures outputs adhere to Camunda external task response formats
- Maintains context awareness across multi-step decision processes

**Service Selection Logic:**
- Evaluates service capabilities against request requirements
- Considers service availability and load balancing
- Handles service failover and retry scenarios
- Optimizes for performance and resource utilization

**Integration with Service Registry:**
```python
# Service selection pattern
def select_service(user_request, service_registry):
    # Semantic analysis of request
    required_capabilities = analyze_request(user_request)
    
    # Match against service registry
    best_service = find_optimal_service(required_capabilities, service_registry)
    
    # Construct service payload
    payload = construct_payload(user_request, best_service)
    
    return best_service, payload
```

## 4. DADM Service Orchestrator Agent

**Role:** Central orchestration hub that manages service discovery, routing, and execution.

**Responsibilities:**
- Loads and manages the dynamic service registry (local, Consul, or fallback)
- Communicates with OpenAI GPT agent to determine service selection and payload creation
- Executes HTTP requests to appropriate service endpoints
- Manages service health monitoring and failover scenarios
- Formats and injects service responses back into Camunda workflows
- Handles caching for performance optimization
- Maintains metrics and logging for system observability

**Key Components:**
- **Service Discovery**: Dynamic discovery from service configurations, Consul, or fallback registry
- **Task Routing**: BPMN property-based routing to appropriate services
- **Response Handling**: Standardized response formatting for Camunda integration
- **Error Management**: Comprehensive error handling and retry logic

## 5. MCP Server Agent(s)

**Role:** Performs specialized computational or data retrieval tasks.

**Service Types:**

### Assistant Services
- **Decision Analysis Assistant**: Specialized in decision framing, alternative identification, and recommendation generation
- **Technical Analysis Assistant**: Focused on technical feasibility analysis and risk assessment  
- **Stakeholder Analysis Assistant**: Handles stakeholder identification and impact analysis

### Tool Services
- **GraphDB Agent**: Handles queries against graph databases (Neo4j)
- **Vector Store Agent**: Executes vector similarity searches (Qdrant, FAISS)
- **Data Analysis Agent**: Performs statistical analysis and data processing
- **Code Generation Agent**: Generates domain-specific code and scripts

**Responsibilities:**
- Provides clear, consistent REST API endpoints following OpenAPI specifications
- Returns structured JSON responses compatible with Camunda external task format
- Implements proper health check endpoints for service discovery
- Maintains service metadata for dynamic registration
- Handles graceful degradation and error reporting

**Service Implementation Pattern:**
```python
# Standard service endpoint structure
@app.route('/process_task', methods=['POST'])
def process_task():
    try:
        data = request.get_json()
        task_id = data.get('task_id')
        variables = data.get('variables', {})
        
        # Process the task
        result = service_logic(variables)
        
        # Return Camunda-compatible response
        return jsonify({
            'task_id': task_id,
            'variables': result,
            'status': 'completed'
        })
    except Exception as e:
        return jsonify({
            'task_id': task_id,
            'error': str(e),
            'status': 'failed'
        }), 500
```

## 6. Integration Agent

**Role:** Orchestrates interaction between all agents and maintains system coherence.

**Responsibilities:**
- Manages the overall workflow coordination between agents
- Maintains context and state across multi-step processes
- Handles inter-agent communication and data transformation
- Ensures data consistency and transaction integrity
- Provides system-wide logging and audit trails
- Manages authentication and authorization across services

**Integration Patterns:**
- **Event-Driven Architecture**: Publishes and subscribes to workflow events
- **State Management**: Maintains process state in Camunda and local caches
- **Data Transformation**: Converts between different agent data formats
- **Error Coordination**: Manages distributed error handling and recovery

## Communication Flow

```plaintext
User Agent
   │ Natural Language Request
   ▼
Integration Agent
   │ Process Analysis & Context
   ▼
DADM Service Orchestrator
   │ Service Discovery & Registry Lookup
   ▼
OpenAI GPT Selection Agent
   │ Service Selection & Payload Construction
   ▼
DADM Service Orchestrator
   │ Task Routing & Execution
   ▼
MCP Server Agent(s)
   │ Specialized Processing
   ▼
DADM Service Orchestrator
   │ Response Aggregation
   ▼
Integration Agent
   │ Context Integration & State Update
   ▼
Codex Agent (if code generation needed)
   │ Code Generation & Validation
   ▼
User Agent / Camunda Workflow
```

## Technical Architecture Integration

### Service Registry Integration
The agents leverage the DADM service registry system for dynamic service discovery:

```python
from config.service_registry import get_service_registry

# Dynamic service discovery
registry = get_service_registry()  # Tries: dynamic → Consul → fallback
```

### Camunda Workflow Integration
Agents integrate with Camunda through external task patterns:

```xml
<bpmn:serviceTask id="Activity_1" name="Decision Analysis">
  <bpmn:extensionElements>
    <camunda:properties>
      <camunda:property name="service.type" value="assistant" />
      <camunda:property name="service.name" value="decision-analysis" />
      <camunda:property name="agent.role" value="decision-framing" />
    </camunda:properties>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

### Performance Optimization
- **Caching**: Service properties, process XML, and task documentation
- **Connection Pooling**: HTTP session management for service calls
- **Batch Processing**: Parallel execution of similar tasks
- **Health Monitoring**: Proactive service health checks and failover

## Development Guidelines for Codex

When working with Codex to generate code for the DADM system:

1. **Use Service-Oriented Patterns**: Always consider which service should handle specific functionality
2. **Follow Registry Integration**: Leverage the dynamic service registry for service discovery
3. **Implement Camunda Compatibility**: Ensure generated code works with external task patterns
4. **Include Error Handling**: Implement comprehensive error handling and logging
5. **Consider Performance**: Use caching and connection pooling where appropriate
6. **Maintain Documentation**: Generate clear documentation and comments
7. **Follow Security Practices**: Implement proper authentication and input validation

## Future Evolution

The agent architecture is designed to evolve with:
- **Advanced LLM Integration**: Support for multiple LLM providers and model types
- **Enhanced Service Discovery**: More sophisticated service matching algorithms
- **Autonomous Learning**: Agents that learn from historical decision patterns
- **Federated Services**: Support for external and third-party service integration
- **Real-time Adaptation**: Dynamic agent behavior based on performance metrics

This document serves as both a reference for understanding the current system and a roadmap for future development when working with Codex and other AI-powered development tools.

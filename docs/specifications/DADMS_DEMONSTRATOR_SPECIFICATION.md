# DADMS Demonstrator - System Specification

## Overview

The Decision Analysis and Decision Management System (DADMS) demonstrator is designed to showcase the core capabilities of AI-assisted decision-making through project-based workflows. The system enables users to create decision projects, load domain knowledge, build analytical workflows, and execute them to generate informed recommendations.

## Core Vision

**Primary Goal**: Allow users to create a decision project, populate it with domain data and templates, build workflows using AI assistance, and execute analysis to generate decision recommendations.

**Key Innovation**: Seamless integration of knowledge management, AI assistance, workflow orchestration, and collaborative decision-making in a unified platform.

## Service Architecture

### Core Services (Ports 3001-3015)

#### **1. Agentic Oversight Service (AIOS)** - Port 3001
**Purpose**: Continuous monitoring and AI assistance across all user activities

**Key Features**:
- Real-time activity monitoring across all services
- Interactive AI assistant in popup pane (lower UI section)
- Contextual insights and suggestions based on user actions
- Natural language query interface for any system aspect
- Proactive issue detection and resolution guidance

**Responsibilities**:
- Monitor user workflow progression
- Provide contextual help and suggestions
- Answer questions about system state, data, or processes
- Surface potential issues or optimization opportunities
- Maintain conversation context across user sessions

#### **2. Event Bus Service (EBS)** - Port 3002
**Purpose**: Central nervous system for all inter-service communication

**Key Features**:
- Comprehensive activity logging from all services
- Event routing and delivery to subscribers
- Real-time event streaming to AIOS
- Event replay and audit capabilities
- Service health monitoring through event patterns

**Event Types**:
- `project.created`, `project.updated`, `project.deleted`
- `knowledge.uploaded`, `knowledge.processed`, `knowledge.indexed`
- `workflow.designed`, `workflow.deployed`, `workflow.executed`
- `task.started`, `task.completed`, `task.failed`
- `decision.recommended`, `decision.approved`, `decision.implemented`

#### **3. Decision Project Service (DPS)** - Port 3003
**Purpose**: Project lifecycle management and organization

**Key Features**:
- CRUD operations for decision projects
- Project metadata management
- User/project-level access control
- Project templates and initialization
- Resource allocation and limits per project

**Data Model**:
```typescript
interface DecisionProject {
    id: string;
    name: string;
    description: string;
    owner_id: string;
    created_at: timestamp;
    updated_at: timestamp;
    status: 'active' | 'archived' | 'completed';
    domain: string; // engineering, finance, operations, etc.
    settings: {
        rag_enabled: boolean;
        personas: string[];
        tools_enabled: string[];
    };
    metadata: object;
}
```

#### **4. Knowledge Service** - Port 3004
**Purpose**: Domain knowledge management with project-scoped RAG implementation

**Key Features**:
- Multi-format document processing (text, markdown, PDF, CSV)
- Advanced chunking with configurable overlap strategies
- Project-level knowledge domains and isolation
- Persona-specific knowledge filtering
- Domain-specific RAG collections (systems, mechanical, quality, costing)

**Processing Pipeline**:
1. Document ingestion and validation
2. Content extraction and cleaning
3. Intelligent chunking with context preservation
4. Embedding generation and vector storage
5. Metadata enrichment and indexing
6. Knowledge graph relationship extraction

**Persona-Specific Domains**:
- **Engineering Personas**: systems, mechanical, electrical, software
- **Business Personas**: quality, costing, risk, compliance
- **Analytical Personas**: data science, modeling, simulation

#### **5. LLM Service** - Port 3005
**Purpose**: Unified LLM access layer with tool integration

**Key Features**:
- Multi-provider support (OpenAI, Anthropic, Ollama)
- Context-only API for simple integrations
- Tool calling capabilities (including RAG tools)
- Provider load balancing and failover
- Cost tracking and usage analytics

**Integration Pattern**:
```typescript
// Simple context-only call
POST /llm/complete
{
    "context": "Analyze this data...",
    "provider": "openai",
    "model": "gpt-4",
    "tools": ["rag_search", "web_search"]
}

// RAG-integrated call
POST /llm/complete-with-rag
{
    "query": "What are the best practices for...",
    "project_id": "uuid",
    "persona": "mechanical_engineer",
    "domain": "systems"
}
```

#### **6. Tool Service** - Port 3006
**Purpose**: Deterministic tool management and schema-driven execution

**Key Features**:
- Tool registration with input/output schemas
- Template-based tool execution (Scilab, analysis APIs)
- Schema validation for LLM-generated inputs
- Tool capability discovery and routing
- Performance monitoring and reliability tracking

**Tool Integration Pattern**:
```typescript
interface Tool {
    id: string;
    name: string;
    description: string;
    input_schema: JSONSchema;
    template: string; // Script or API template
    output_schema: JSONSchema;
    executor: 'api' | 'script' | 'service';
    reliability_score: number;
}
```

#### **7. Process Management Service** - Port 3007
**Purpose**: BPMN workflow lifecycle management (enhanced current implementation)

**Key Features**:
- Direct reuse of current process management interface
- Process versioning and change tracking
- Integrated diagram viewer with AI annotations
- Process execution history and analytics
- Active process monitoring dashboard

**Enhancements to Current System**:
- AI-suggested process improvements
- Template library for common decision patterns
- Process performance analytics
- Integration with AIOS for process guidance

#### **8. Process Task Orchestration Engine (PTOE)** - Port 3008
**Purpose**: Enhanced service orchestrator with flexible task management

**Key Features**:
- Camunda task monitoring and consumption
- Flexible task routing and execution
- Enhanced error handling and retry logic
- Task context enrichment from knowledge service
- Real-time task status updates to UI

**Improvements Over Current System**:
- Configurable task routing rules
- Context-aware task execution
- Better error recovery and logging
- Integration with Task Execution Manager

#### **9. Task Execution Manager (TEM)** - Port 3009
**Purpose**: Comprehensive task monitoring and efficacy analysis

**Key Features**:
- Complete task I/O capture and storage
- Efficacy scoring and performance analytics
- User review and commenting system
- Task context replay capabilities
- Learning-based task optimization suggestions

**Data Capture**:
```typescript
interface TaskExecution {
    task_id: string;
    process_instance_id: string;
    thread_id: string;
    input_context: object;
    output_context: object;
    execution_time_ms: number;
    efficacy_score: number;
    user_rating: number;
    comments: string[];
    retry_count: number;
    error_details?: object;
}
```

#### **10. Context Management Service (CMS)** - Port 3010
**Purpose**: Enhanced prompt service with persona-driven context assembly

**Key Features**:
- Persona definition and management
- Dynamic context assembly from multiple sources
- Template-based context generation
- Context versioning and A/B testing
- Integration with knowledge service for domain context

**Context Sources**:
- Project knowledge base
- Persona-specific guidelines
- Tool definitions and schemas
- Historical successful patterns
- Real-time system state

#### **11. Database Manager** - Port 3011
**Purpose**: Unified database operations interface

**Key Features**:
- PostgreSQL CRUD operations with query builder
- Vector store management (Qdrant collections)
- Neo4j graph database operations
- Cross-database query capabilities
- Data migration and backup utilities

**Security Features**:
- Query validation and sanitization
- Role-based access control
- Audit logging for all operations
- Rate limiting and resource protection

#### **12. BPMN Workspace** - Port 3012
**Purpose**: AI-enhanced workflow design environment

**Key Features**:
- Integration of comprehensive_bpmn_modeler.html
- AI-suggested node additions and connections
- Support for service tasks, decision nodes, script tasks, call activities
- Real-time workflow validation
- Template library for common patterns

**Expansion Beyond Service Tasks**:
- **Decision Nodes**: AI-assisted decision logic
- **Script Tasks**: Template-based script generation
- **Call Activities**: Integration with Pipeline Service
- **User Tasks**: Form generation and routing

#### **13. Decision Thread Manager (DTM)** - Port 3013
**Purpose**: Conversation context management across decision workflows

**Key Features**:
- Self-managed thread creation and routing
- Vector store-based thread persistence
- Thread similarity analysis for related decisions
- Continuous chat capabilities outside workflows
- Thread summarization and white paper generation

**Thread Management Pattern**:
```typescript
interface DecisionThread {
    thread_id: string;
    project_id: string;
    process_definition_id?: string;
    process_instance_id?: string;
    created_at: timestamp;
    status: 'active' | 'completed' | 'archived';
    context_messages: ThreadMessage[];
    similarity_embeddings: vector;
    artifacts_generated: string[]; // artifact IDs
}
```

#### **14. Artifact Service** - Port 3014
**Purpose**: Comprehensive artifact lifecycle management

**Key Features**:
- CRUD operations for all artifact types
- Version control and change tracking
- Metadata enrichment and search
- Integration APIs for artifact embedding
- Access control and sharing permissions

**Artifact Types**:
- White papers and documentation
- Analysis results and reports
- Graphs, charts, and visualizations
- Diagrams and technical drawings
- Decision summaries and recommendations

#### **15. Agent Assistant and Documentation Service (AADS)** - Port 3015
**Purpose**: Context-aware document creation with artifact integration

**Key Features**:
- AI-assisted document writing and editing
- Dot notation artifact embedding (e.g., `{{artifact.diagram.123}}`)
- Thread context integration for informed writing
- Multi-format export (PDF, Word, HTML, Markdown)
- Collaborative editing with change tracking

**Document Integration Pattern**:
```markdown
# Analysis Report

The following diagram shows the system architecture:
{{artifact.diagram.arch_001}}

Based on the analysis in thread {{thread.analysis_2024_001}}, 
the recommendation is:
{{artifact.decision.final_rec}}
```

## Data Architecture

### PostgreSQL Schema
- **Projects**: Project metadata and settings
- **Users**: User accounts and preferences  
- **Tasks**: Task execution records and efficacy data
- **Threads**: Decision thread metadata
- **Artifacts**: Artifact metadata and versions

### Neo4j Graph
- **Relationships**: Project→Knowledge→Decisions→Artifacts
- **Impact Analysis**: Decision dependency tracking
- **Knowledge Connections**: Concept and entity relationships

### Qdrant Vector Store
- **Project Collections**: Isolated knowledge domains per project
- **Persona Collections**: Role-specific knowledge filtering
- **Thread Embeddings**: Conversation similarity and retrieval

## Integration Patterns

### Service Communication
- **Event-Driven**: All services publish events to Event Bus
- **RESTful APIs**: Synchronous operations between services
- **WebSocket**: Real-time updates to UI components

### AI Integration
- **Context Assembly**: CMS orchestrates multi-source context
- **Tool Calling**: LLM Service routes to appropriate tools
- **Feedback Loop**: TEM captures performance for improvement

### User Experience
- **Unified Interface**: Single-page application with integrated services
- **AIOS Integration**: Persistent AI assistant panel
- **Real-time Updates**: WebSocket-based live system state

## Security Model

### Authentication & Authorization
- **Project-Scoped Access**: Users access only their projects
- **Role-Based Permissions**: Different capabilities per user role
- **Service-to-Service**: JWT-based inter-service authentication

### Data Protection
- **Encryption at Rest**: All sensitive data encrypted
- **Encryption in Transit**: TLS for all communications
- **Audit Logging**: Complete action tracking via Event Bus

## Deployment Architecture

### Development Environment
```yaml
services:
  - postgresql (projects, tasks, metadata)
  - neo4j (relationships, knowledge graph)
  - qdrant (vector embeddings)
  - camunda (workflow engine)
  - redis (caching, sessions)
  - 15 microservices (ports 3001-3015)
  - nginx (reverse proxy, load balancing)
```

### Production Considerations
- **Container Orchestration**: Kubernetes or Docker Swarm
- **Load Balancing**: Service mesh for inter-service communication
- **Monitoring**: Comprehensive metrics and alerting
- **Backup & Recovery**: Automated data protection strategies

## Success Criteria

### Functional Goals
1. **User can create decision project in <30 seconds**
2. **Knowledge upload and processing completes in <5 minutes**
3. **BPMN workflow creation with AI assistance in <15 minutes**
4. **End-to-end decision workflow execution in <10 minutes**
5. **Artifact generation and documentation in <5 minutes**

### Technical Goals
1. **System handles 50+ concurrent users**
2. **99.9% uptime for critical decision processes**
3. **Sub-second response times for interactive operations**
4. **Scalable to 1000+ projects and 10K+ artifacts**
5. **Complete audit trail for regulatory compliance**

This specification provides the foundation for building a comprehensive DADMS demonstrator that showcases the core value proposition while maintaining clean architecture and extensibility for future enhancements.

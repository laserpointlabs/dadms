# DADMS 2.0 - Context Manager Service Specification

## Executive Summary

The Context Manager Service is a foundational microservice in DADMS 2.0's Event-Driven System (EDS) that provides comprehensive management of AI interaction contexts. It serves as the central hub for managing personas (AI agent personalities), teams (collections of personas with decision protocols), tools (API integrations and functions), and prompts (template management with testing capabilities). This service ensures consistent, governed, and optimized AI interactions across the entire DADMS platform.

**Current Status**: 📋 **SPECIFICATION** - Ready for implementation with existing UI foundation  
**Port**: 3020  
**Version**: 1.0.0

## Purpose & Responsibilities

### Core Context Management
- **Persona Management**: Define, manage, and deploy AI agent personalities with specific roles, expertise, and capabilities
- **Team Orchestration**: Compose teams of personas with collaborative decision-making protocols
- **Tool Integration**: Centralized registry and management of available tools and API integrations
- **Prompt Templates**: Create, test, version, and approve prompt templates for consistent AI interactions

### Governance & Quality Assurance
- **Approval Workflows**: Formal approval processes for prompts and personas before production use
- **Testing Framework**: Probabilistic testing capabilities for prompt reliability and consistency
- **Version Control**: Track changes and maintain historical versions of all context components
- **Access Control**: Role-based access to context management capabilities

### Integration & Assembly
- **Context Assembly**: Dynamic composition of prompts, personas, and tools for specific use cases
- **LLM Service Integration**: Provide context components to LLM Service for consistent AI interactions
- **Agent Assistance**: Supply context for proactive assistance and intelligent suggestions
- **Cross-Service Context**: Enable other services to leverage curated AI contexts

## Core Concepts & Data Models

### Service Architecture

```mermaid
%%{init: { 'flowchart': { 'curve': 'orthogonal' }}}%%
flowchart TD
    subgraph UI["User Interface"]
        PersonaUI["Persona Manager"]
        TeamUI["Team Manager"]
        ToolUI["Tool Manager"]
        PromptUI["Prompt Manager"]
    end
    
    subgraph Core["Core Components"]
        PersonaEngine["Persona Engine"]
        TeamOrchestrator["Team Orchestrator"]
        ToolRegistry["Tool Registry"]
        PromptManager["Prompt Manager"]
        TestingEngine["Testing Engine"]
        ApprovalWorkflow["Approval Workflow"]
    end
    
    subgraph Storage["Data Layer"]
        PostgreSQL["PostgreSQL<br/>Core Data"]
        Redis["Redis<br/>Context Cache"]
        MinIO["MinIO<br/>Assets & Artifacts"]
    end
    
    subgraph Integration["DADMS Integration"]
        LLMService["LLM Service"]
        AAS["Agent Assistance"]
        ProjectService["Project Service"]
        EventManager["EventManager"]
        KnowledgeService["Knowledge Service"]
    end
    
    UI --> Core
    Core --> Storage
    Core --> Integration
    
    classDef ui fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef core fill:#e8f5e8,stroke:#388e3c,stroke-width:2px;
    classDef storage fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef integration fill:#ffebee,stroke:#d32f2f,stroke-width:2px;
    
    class PersonaUI,TeamUI,ToolUI,PromptUI ui;
    class PersonaEngine,TeamOrchestrator,ToolRegistry,PromptManager,TestingEngine,ApprovalWorkflow core;
    class PostgreSQL,Redis,MinIO storage;
    class LLMService,AAS,ProjectService,EventManager,KnowledgeService integration;
```

### Data Models

#### Persona Management Models
```typescript
interface Persona {
    id: string;
    name: string;
    role: string;
    expertise: string[];
    guidelines: string;
    system_prompt?: string;
    tags: string[];
    tool_ids: string[];
    model_preferences?: ModelPreference[];
    parameters?: ExecutionParameters;
    approval_status: 'draft' | 'pending' | 'approved' | 'deprecated';
    created_by: string;
    created_at: Date;
    updated_at: Date;
    version: number;
}

interface ModelPreference {
    provider: string;
    model_id: string;
    priority: number;
    parameters?: ExecutionParameters;
}

interface ExecutionParameters {
    temperature: number;
    max_tokens: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
}
```

#### Team Collaboration Models
```typescript
interface Team {
    id: string;
    name: string;
    description?: string;
    persona_ids: string[];
    uses_moderator: boolean;
    moderator_id?: string;
    decision_type: DecisionType;
    collaboration_rules?: CollaborationRule[];
    approval_status: 'draft' | 'pending' | 'approved' | 'deprecated';
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

type DecisionType = 'voting' | 'moderator' | 'third_party' | 'consensus' | 'random';

interface CollaborationRule {
    trigger: string;
    action: string;
    parameters: Record<string, any>;
}

interface TeamExecution {
    id: string;
    team_id: string;
    prompt_id: string;
    context: Record<string, any>;
    persona_responses: PersonaResponse[];
    final_decision?: string;
    decision_method: DecisionType;
    execution_time: number;
    created_at: Date;
}

interface PersonaResponse {
    persona_id: string;
    response: string;
    confidence: number;
    reasoning?: string;
    tool_calls?: ToolCall[];
}
```

#### Tool Registry Models
```typescript
interface Tool {
    id: string;
    name: string;
    description: string;
    category: string;
    api_spec?: string;
    endpoint?: string;
    authentication?: AuthenticationConfig;
    parameters: ToolParameter[];
    tags: string[];
    availability_status: 'active' | 'deprecated' | 'maintenance';
    rate_limits?: RateLimit[];
    cost_per_call?: number;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default_value?: any;
    validation_rules?: ValidationRule[];
}

interface AuthenticationConfig {
    type: 'api_key' | 'oauth' | 'basic' | 'bearer';
    config: Record<string, any>;
}
```

#### Prompt Template Models
```typescript
interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    variables: TemplateVariable[];
    persona_id?: string;
    team_id?: string;
    tool_ids: string[];
    tags: string[];
    test_cases: TestCase[];
    approval_status: 'draft' | 'pending' | 'approved' | 'deprecated';
    version: number;
    parent_id?: string;
    created_by: string;
    created_at: Date;
    updated_at: Date;
    last_tested?: Date;
    test_results?: TestResults;
}

interface TemplateVariable {
    name: string;
    type: 'string' | 'number' | 'object' | 'array';
    description: string;
    required: boolean;
    default_value?: any;
    validation_pattern?: string;
}

interface TestCase {
    id: string;
    name?: string;
    input_context: Record<string, any>;
    expected_output: string;
    success_criteria: SuccessCriteria[];
}

interface SuccessCriteria {
    type: 'contains' | 'exact' | 'regex' | 'semantic' | 'length' | 'sentiment';
    value: any;
    weight: number;
}
```

## Service Components

### 1. Persona Engine

**Purpose**: Comprehensive AI persona lifecycle management

**Responsibilities**:
- Create, update, and manage AI personas with specific roles and capabilities
- Define persona-specific system prompts and behavioral guidelines
- Associate tools and model preferences with personas
- Version control for persona evolution and rollback capabilities
- Performance tracking for persona effectiveness

**Key Features**:
- **Role-Based Personas**: Define specific roles (analyst, expert, moderator, etc.)
- **Expertise Mapping**: Tag personas with domain expertise and capabilities
- **Tool Association**: Link specific tools to personas based on their role
- **Model Optimization**: Configure preferred models and parameters for each persona
- **Governance**: Approval workflows for persona deployment

### 2. Team Orchestrator

**Purpose**: Multi-persona collaboration and decision-making management

**Responsibilities**:
- Create and manage teams of personas for collaborative tasks
- Implement decision-making protocols (voting, consensus, moderated)
- Orchestrate multi-persona conversations and deliberations
- Track team performance and decision quality
- Manage moderator assignments and escalation procedures

**Key Features**:
- **Decision Protocols**: Configurable decision-making mechanisms
- **Collaboration Rules**: Define how personas interact within teams
- **Moderator Support**: Designated moderator personas for complex decisions
- **Execution Tracking**: Monitor team performance and decision outcomes
- **Conflict Resolution**: Handle disagreements and tie-breaking scenarios

### 3. Tool Registry

**Purpose**: Centralized tool and API integration management

**Responsibilities**:
- Maintain registry of available tools and their capabilities
- Manage tool authentication and access credentials
- Monitor tool availability and performance
- Handle tool versioning and deprecation
- Provide tool discovery and recommendation services

**Key Features**:
- **API Integration**: Support for various API types and authentication methods
- **Capability Mapping**: Tag tools with functional capabilities
- **Rate Limiting**: Monitor and enforce tool usage limits
- **Cost Tracking**: Track tool usage costs and budget management
- **Health Monitoring**: Monitor tool availability and response times

### 4. Prompt Manager

**Purpose**: Comprehensive prompt template lifecycle management

**Responsibilities**:
- Create, edit, and version prompt templates
- Manage template variables and validation rules
- Implement testing frameworks for prompt validation
- Handle approval workflows for production deployment
- Provide template discovery and recommendation services

**Key Features**:
- **Template Versioning**: Track prompt evolution and maintain history
- **Variable Substitution**: Dynamic variable replacement with validation
- **Testing Framework**: Probabilistic testing for consistency validation
- **Approval Workflows**: Formal review and approval processes
- **Performance Analytics**: Track prompt effectiveness and usage patterns

### 5. Testing Engine

**Purpose**: Comprehensive testing and validation framework

**Responsibilities**:
- Execute probabilistic tests across multiple models
- Validate prompt consistency and reliability
- Generate performance reports and recommendations
- Compare prompt variations and optimizations
- Automate regression testing for prompt changes

**Key Features**:
- **Multi-Model Testing**: Test prompts across different LLM providers
- **Statistical Analysis**: Provide confidence intervals and reliability metrics
- **A/B Testing**: Compare different prompt versions systematically
- **Automated Testing**: Scheduled testing for continuous validation
- **Regression Detection**: Identify performance degradation over time

### 6. Approval Workflow

**Purpose**: Governance and quality assurance for all context components

**Responsibilities**:
- Implement approval processes for personas, teams, tools, and prompts
- Manage reviewer assignments and approval hierarchies
- Track approval history and decision rationale
- Handle rejection feedback and revision cycles
- Ensure compliance with organizational policies

**Key Features**:
- **Multi-Stage Approval**: Configurable approval workflows
- **Role-Based Reviews**: Different review requirements based on component type
- **Audit Trail**: Complete history of all approval decisions
- **Notification System**: Automated notifications for approval actions
- **Compliance Monitoring**: Ensure adherence to governance policies

## Event-Driven Architecture Integration

### Event Publishing

```typescript
// Persona Events
interface PersonaCreatedEvent {
    type: 'context_manager.persona.created';
    persona_id: string;
    name: string;
    role: string;
    created_by: string;
    timestamp: Date;
}

interface PersonaApprovedEvent {
    type: 'context_manager.persona.approved';
    persona_id: string;
    name: string;
    approved_by: string;
    timestamp: Date;
}

// Team Events
interface TeamExecutionStartedEvent {
    type: 'context_manager.team.execution.started';
    team_id: string;
    execution_id: string;
    prompt_id: string;
    persona_count: number;
    timestamp: Date;
}

interface TeamExecutionCompletedEvent {
    type: 'context_manager.team.execution.completed';
    team_id: string;
    execution_id: string;
    decision: string;
    decision_method: DecisionType;
    execution_time: number;
    timestamp: Date;
}

// Prompt Events
interface PromptTestCompletedEvent {
    type: 'context_manager.prompt.test.completed';
    prompt_id: string;
    test_results: TestResults;
    success_rate: number;
    timestamp: Date;
}

// Tool Events
interface ToolCallExecutedEvent {
    type: 'context_manager.tool.call.executed';
    tool_id: string;
    execution_time: number;
    success: boolean;
    cost?: number;
    timestamp: Date;
}
```

### Event Subscriptions

The service subscribes to relevant events for enhanced functionality:
- **Project Events**: Initialize default contexts for new projects
- **User Events**: Set up user-specific personas and preferences
- **LLM Events**: Track model performance and update recommendations
- **Error Events**: Monitor and respond to context-related failures

## API Specification

### Core Endpoints Overview

```typescript
// Persona Management
GET    /api/personas                     // List personas
POST   /api/personas                     // Create persona
GET    /api/personas/{personaId}         // Get persona details
PUT    /api/personas/{personaId}         // Update persona
DELETE /api/personas/{personaId}         // Delete persona
POST   /api/personas/{personaId}/approve // Approve persona

// Team Management
GET    /api/teams                        // List teams
POST   /api/teams                        // Create team
GET    /api/teams/{teamId}               // Get team details
PUT    /api/teams/{teamId}               // Update team
DELETE /api/teams/{teamId}               // Delete team
POST   /api/teams/{teamId}/execute       // Execute team prompt

// Tool Management
GET    /api/tools                        // List tools
POST   /api/tools                        // Register tool
GET    /api/tools/{toolId}               // Get tool details
PUT    /api/tools/{toolId}               // Update tool
DELETE /api/tools/{toolId}               // Delete tool
POST   /api/tools/{toolId}/test          // Test tool

// Prompt Management
GET    /api/prompts                      // List prompt templates
POST   /api/prompts                      // Create prompt template
GET    /api/prompts/{promptId}           // Get prompt details
PUT    /api/prompts/{promptId}           // Update prompt
DELETE /api/prompts/{promptId}           // Delete prompt
POST   /api/prompts/{promptId}/test      // Test prompt
POST   /api/prompts/{promptId}/approve   // Approve prompt

// Context Assembly
POST   /api/contexts/assemble            // Assemble execution context
GET    /api/contexts/{contextId}         // Get assembled context
POST   /api/contexts/{contextId}/execute // Execute assembled context
```

## Technical Implementation

### Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware for auth, validation, caching
- **Database**: PostgreSQL for persistent data, Redis for caching
- **Storage**: MinIO for large artifacts and test results
- **Testing**: Jest for unit tests, custom framework for prompt testing
- **Authentication**: JWT integration with DADMS auth system

### Database Schema

```sql
-- Personas
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    expertise TEXT[],
    guidelines TEXT,
    system_prompt TEXT,
    tags TEXT[],
    tool_ids TEXT[],
    model_preferences JSONB,
    parameters JSONB,
    approval_status VARCHAR(50) DEFAULT 'draft',
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    persona_ids TEXT[],
    uses_moderator BOOLEAN DEFAULT false,
    moderator_id UUID,
    decision_type VARCHAR(50) NOT NULL,
    collaboration_rules JSONB,
    approval_status VARCHAR(50) DEFAULT 'draft',
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tools
CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    api_spec TEXT,
    endpoint VARCHAR(500),
    authentication JSONB,
    parameters JSONB,
    tags TEXT[],
    availability_status VARCHAR(50) DEFAULT 'active',
    rate_limits JSONB,
    cost_per_call DECIMAL(10,6),
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompt Templates
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    variables JSONB,
    persona_id UUID REFERENCES personas(id),
    team_id UUID REFERENCES teams(id),
    tool_ids TEXT[],
    tags TEXT[],
    test_cases JSONB,
    approval_status VARCHAR(50) DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    parent_id UUID REFERENCES prompt_templates(id),
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_tested TIMESTAMP,
    test_results JSONB
);

-- Team Executions
CREATE TABLE team_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id),
    prompt_id UUID REFERENCES prompt_templates(id),
    context JSONB,
    persona_responses JSONB,
    final_decision TEXT,
    decision_method VARCHAR(50),
    execution_time DECIMAL(8,3),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tool Executions
CREATE TABLE tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID REFERENCES tools(id),
    context_id VARCHAR(255),
    input_parameters JSONB,
    output_result JSONB,
    execution_time DECIMAL(8,3),
    success BOOLEAN,
    error_message TEXT,
    cost DECIMAL(10,6),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Service Configuration

```typescript
interface ContextManagerConfig {
    // Server Configuration
    port: number;
    host: string;
    cors_origins: string[];
    
    // Database Configuration
    database: DatabaseConfig;
    redis: RedisConfig;
    minio: MinIOConfig;
    
    // Testing Configuration
    testing: {
        max_concurrent_tests: number;
        default_test_runs: number;
        test_timeout: number;
        supported_models: string[];
    };
    
    // Approval Configuration
    approval: {
        require_approval_for: string[];
        default_reviewers: string[];
        auto_approve_threshold: number;
    };
    
    // Tool Configuration
    tools: {
        discovery_enabled: boolean;
        health_check_interval: number;
        rate_limit_enforcement: boolean;
    };
    
    // Cache Configuration
    cache: {
        persona_ttl: number;
        team_ttl: number;
        tool_ttl: number;
        context_ttl: number;
    };
}
```

## Security & Compliance

### Authentication & Authorization
- **JWT Integration**: Seamless integration with DADMS authentication
- **Role-Based Access**: Different permissions for creators, reviewers, and administrators
- **Resource Ownership**: Users can only modify their own contexts (unless admin)
- **Approval Permissions**: Specific roles required for approval actions

### Data Protection
- **Sensitive Data Handling**: Secure storage of API keys and authentication tokens
- **Prompt Privacy**: User prompts and contexts are encrypted at rest
- **Audit Logging**: Comprehensive logging of all context management actions
- **Data Retention**: Configurable retention policies for historical data

### Governance & Compliance
- **Approval Workflows**: Mandatory approval for production context deployment
- **Version Control**: Complete audit trail of all context changes
- **Testing Requirements**: Mandatory testing before approval
- **Compliance Monitoring**: Ensure adherence to organizational AI policies

## Performance & Scalability

### Performance Targets
- **Response Time**: < 200ms for context retrieval
- **Assembly Time**: < 500ms for context assembly
- **Testing Throughput**: 100+ prompt tests per minute
- **Concurrent Users**: Support for 200+ simultaneous users

### Scalability Design
- **Horizontal Scaling**: Stateless service design for easy scaling
- **Caching Strategy**: Multi-layer caching for frequently accessed contexts
- **Database Optimization**: Proper indexing and query optimization
- **Resource Management**: Efficient memory and connection pool management

### Monitoring & Observability
- **Health Checks**: Comprehensive health monitoring with dependency checks
- **Metrics Collection**: Detailed metrics on context usage and performance
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Monitoring**: Real-time performance dashboards

## Integration Points

### DADMS Service Integration
- **LLM Service**: Primary consumer of context assembly services
- **Agent Assistance Service**: Leverages personas and prompts for intelligent assistance
- **Project Service**: Project-specific context management and inheritance
- **Knowledge Service**: Integration with knowledge bases for context enhancement

### External Integrations
- **LLM Providers**: Support for multiple LLM providers and models
- **API Integrations**: Comprehensive tool registry with various API types
- **Authentication Systems**: Support for various authentication mechanisms
- **Monitoring Systems**: Integration with observability platforms

## Deployment & Operations

### Container Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3020
CMD ["node", "dist/index.js"]
```

### Environment Variables
```bash
# Server Configuration
PORT=3020
NODE_ENV=production
CORS_ORIGINS=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://dadms_user:password@postgres:5432/dadms
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Testing Configuration
MAX_CONCURRENT_TESTS=50
DEFAULT_TEST_RUNS=10
TEST_TIMEOUT=30000

# LLM Provider Configuration
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Security Configuration
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### Health Check Endpoint
```typescript
app.get('/health', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version,
        dependencies: {
            database: await checkDatabase(),
            redis: await checkRedis(),
            minio: await checkMinIO(),
            llm_providers: await checkLLMProviders()
        }
    };
    
    const isHealthy = Object.values(health.dependencies)
        .every(status => status === 'healthy');
    
    res.status(isHealthy ? 200 : 503).json(health);
});
```

## Development Roadmap

### Phase 1: Core Implementation (Week 2)
- [ ] Basic persona CRUD operations
- [ ] Tool registry with basic integration
- [ ] Simple prompt template management
- [ ] Database schema and API foundation

### Phase 2: Advanced Features (Week 3)
- [ ] Team management and collaboration
- [ ] Testing framework implementation
- [ ] Approval workflow system
- [ ] Context assembly engine

### Phase 3: Enhancement & Integration (Week 4)
- [ ] LLM Service integration
- [ ] Agent Assistance Service integration
- [ ] Advanced testing capabilities
- [ ] Performance optimization

### Phase 4: Production Features (Week 5+)
- [ ] Advanced governance features
- [ ] Comprehensive monitoring
- [ ] Multi-tenancy support
- [ ] Enterprise integrations

## Success Metrics

### Technical Metrics
- **Uptime**: 99.9% service availability
- **Performance**: < 200ms average response time
- **Reliability**: < 0.1% error rate
- **Scalability**: Support for 200+ concurrent users

### Business Metrics
- **Context Adoption**: 90% of AI interactions use managed contexts
- **Quality Improvement**: 40% reduction in AI interaction failures
- **Efficiency Gains**: 60% faster prompt development cycles
- **Governance Compliance**: 100% approval compliance for production contexts

## Conclusion

The Context Manager Service provides the foundational infrastructure for managing AI interaction contexts across the DADMS 2.0 ecosystem. By centralizing persona, team, tool, and prompt management with comprehensive testing and approval workflows, it ensures consistent, reliable, and governed AI interactions throughout the platform.

The service's event-driven architecture enables real-time collaboration and monitoring, while its comprehensive API supports seamless integration with other DADMS services. With robust security, performance, and scalability features, the Context Manager Service is designed to scale with organizational needs while maintaining the highest standards of quality and compliance. 
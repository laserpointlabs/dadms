# DADMS 2.0 - LLM Playground Service Specification

## Executive Summary

The LLM Playground Service is an interactive testing and experimentation platform within DADMS 2.0's Event-Driven System (EDS). It provides a comprehensive environment for users to test, validate, and refine LLM prompts, experiment with different models and parameters, evaluate response quality, and develop prompt templates before deploying them in production workflows.

**Current Status**: 📋 **SPECIFICATION** - Ready for implementation  
**Port**: 3006  
**Version**: 1.0.0

## Purpose & Responsibilities

### Interactive Testing Environment
- **Multi-Provider Support**: Test prompts across OpenAI, Anthropic, Ollama, and other LLM providers
- **Real-time Experimentation**: Execute prompts with immediate feedback and streaming responses
- **Parameter Tuning**: Adjust temperature, max tokens, top-p, and other model parameters
- **Tool Integration**: Test prompts with various tools and function calling capabilities

### Prompt Development & Management
- **Template Library**: Create, manage, and share reusable prompt templates
- **Version Control**: Track prompt iterations and performance over time
- **Collaborative Development**: Share templates and sessions across teams
- **Best Practices**: Built-in guidance for effective prompt engineering

### Evaluation & Analytics
- **Probabilistic Testing**: Run multiple iterations to evaluate prompt consistency
- **Performance Metrics**: Track response quality, execution time, and cost
- **A/B Testing**: Compare different prompts, models, and parameter combinations
- **Usage Analytics**: Comprehensive insights into model usage and costs

### Production Integration
- **Context Awareness**: Test prompts with real project data and contexts
- **Session Management**: Organize testing sessions by project and purpose
- **Export Capabilities**: Export validated prompts for production use
- **Cost Estimation**: Predict production costs before deployment

## Core Concepts & Data Models

### Service Architecture

```mermaid
%%{init: { 'flowchart': { 'curve': 'orthogonal' }}}%%
flowchart TD
    subgraph UI["User Interface"]
        PlaygroundUI["Playground Interface"]
        TemplateEditor["Template Editor"]
        SessionManager["Session Manager"]
        Analytics["Analytics Dashboard"]
    end
    
    subgraph Core["Core Services"]
        ExecutionEngine["Execution Engine"]
        TemplateManager["Template Manager"]
        SessionHandler["Session Handler"]
        EvaluationEngine["Evaluation Engine"]
    end
    
    subgraph Providers["LLM Providers"]
        OpenAI["OpenAI GPT"]
        Anthropic["Anthropic Claude"]
        Ollama["Ollama Local"]
        CustomProviders["Custom Providers"]
    end
    
    subgraph Storage["Data Layer"]
        PostgreSQL["PostgreSQL<br/>Sessions & Templates"]
        Redis["Redis<br/>Execution Cache"]
        MinIO["MinIO<br/>Results & Artifacts"]
    end
    
    subgraph Integration["DADMS Integration"]
        LLMService["LLM Service"]
        ProjectService["Project Service"]
        KnowledgeService["Knowledge Service"]
        EventManager["EventManager"]
    end
    
    UI --> Core
    Core --> Providers
    Core --> Storage
    Core --> Integration
    
    classDef ui fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef core fill:#e8f5e8,stroke:#388e3c,stroke-width:2px;
    classDef provider fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef storage fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef integration fill:#ffebee,stroke:#d32f2f,stroke-width:2px;
    
    class PlaygroundUI,TemplateEditor,SessionManager,Analytics ui;
    class ExecutionEngine,TemplateManager,SessionHandler,EvaluationEngine core;
    class OpenAI,Anthropic,Ollama,CustomProviders provider;
    class PostgreSQL,Redis,MinIO storage;
    class LLMService,ProjectService,KnowledgeService,EventManager integration;
```

### Data Models

#### Core Execution Models
```typescript
interface PromptExecution {
    id: string;
    session_id: string;
    user_id: string;
    model_id: string;
    prompt: string;
    system_prompt?: string;
    parameters: ExecutionParameters;
    context?: Record<string, any>;
    tools?: Tool[];
    response: string;
    usage: TokenUsage;
    tool_executions?: ToolExecution[];
    execution_time: number;
    timestamp: Date;
    status: 'completed' | 'failed' | 'cancelled';
    metadata: Record<string, any>;
}

interface ExecutionParameters {
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop_sequences?: string[];
}

interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost: number;
}
```

#### Template Management Models
```typescript
interface PromptTemplate {
    id: string;
    name: string;
    category: string;
    description: string;
    prompt: string;
    system_prompt?: string;
    variables: string[];
    tags: string[];
    default_parameters?: ExecutionParameters;
    is_public: boolean;
    usage_count: number;
    rating: number;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

interface TemplateVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default_value?: any;
    validation_rules?: ValidationRule[];
}
```

#### Session & Evaluation Models
```typescript
interface PlaygroundSession {
    id: string;
    name: string;
    description: string;
    project_id?: string;
    user_id: string;
    tags: string[];
    execution_count: number;
    total_cost: number;
    created_at: Date;
    last_executed?: Date;
    metadata: Record<string, any>;
}

interface EvaluationTest {
    id: string;
    name: string;
    prompt: string;
    model_id: string;
    test_cases: TestCase[];
    parameters: TestParameters;
    results: TestResults;
    status: 'running' | 'completed' | 'failed';
    created_at: Date;
    completed_at?: Date;
}

interface TestCase {
    input: Record<string, any>;
    expected_output: ExpectedOutput;
}

interface ExpectedOutput {
    type: 'contains' | 'exact' | 'regex' | 'semantic';
    keywords?: string[];
    pattern?: string;
    semantic_threshold?: number;
}
```

## Service Components

### 1. Execution Engine

**Purpose**: Core prompt execution orchestration with multi-provider support

**Responsibilities**:
- Route execution requests to appropriate LLM providers
- Handle streaming and non-streaming responses
- Manage execution context and tool integration
- Cache results for performance optimization
- Track usage and costs across all providers

**Key Features**:
- **Provider Abstraction**: Unified interface for all LLM providers
- **Streaming Support**: Real-time response streaming with SSE
- **Tool Integration**: Seamless integration with DADMS tools
- **Error Handling**: Comprehensive error recovery and fallback
- **Rate Limiting**: Provider-specific rate limit management

### 2. Template Manager

**Purpose**: Comprehensive prompt template lifecycle management

**Responsibilities**:
- Create, update, delete prompt templates
- Manage template variables and validation
- Provide template search and categorization
- Handle template sharing and collaboration
- Track template usage analytics

**Key Features**:
- **Variable Substitution**: Dynamic variable replacement in templates
- **Validation Engine**: Template and variable validation
- **Categorization**: Organized template library with tagging
- **Sharing Controls**: Public/private template management
- **Version History**: Track template evolution over time

### 3. Session Handler

**Purpose**: Testing session management and organization

**Responsibilities**:
- Create and manage testing sessions
- Track execution history within sessions
- Provide session analytics and summaries
- Organize sessions by project and purpose
- Export session data and results

**Key Features**:
- **Project Integration**: Link sessions to DADMS projects
- **Execution Tracking**: Complete audit trail of all executions
- **Session Analytics**: Performance metrics and cost tracking
- **Data Export**: Export capabilities for external analysis
- **Collaboration**: Team access to shared sessions

### 4. Evaluation Engine

**Purpose**: Advanced prompt evaluation and testing capabilities

**Responsibilities**:
- Execute probabilistic testing scenarios
- Evaluate prompt consistency and reliability
- Provide scoring and feedback mechanisms
- Generate improvement recommendations
- Compare different prompt variations

**Key Features**:
- **Probabilistic Testing**: Multiple execution runs for consistency analysis
- **Scoring Algorithms**: Automated quality assessment
- **A/B Testing**: Compare prompt variations systematically
- **Recommendation Engine**: AI-powered improvement suggestions
- **Benchmarking**: Performance comparison against baseline prompts

## Event-Driven Architecture Integration

### Event Publishing

```typescript
// Execution Events
interface ExecutionStartedEvent {
    type: 'llm_playground.execution.started';
    execution_id: string;
    user_id: string;
    session_id: string;
    model_id: string;
    timestamp: Date;
}

interface ExecutionCompletedEvent {
    type: 'llm_playground.execution.completed';
    execution_id: string;
    user_id: string;
    session_id: string;
    model_id: string;
    token_usage: TokenUsage;
    execution_time: number;
    timestamp: Date;
}

// Template Events
interface TemplateCreatedEvent {
    type: 'llm_playground.template.created';
    template_id: string;
    user_id: string;
    template_name: string;
    category: string;
    timestamp: Date;
}

// Evaluation Events
interface EvaluationCompletedEvent {
    type: 'llm_playground.evaluation.completed';
    test_id: string;
    user_id: string;
    success_rate: number;
    average_score: number;
    recommendations: string[];
    timestamp: Date;
}
```

### Event Subscriptions

The service subscribes to relevant events for enhanced functionality:
- **Project Events**: Automatically create sessions for new projects
- **User Events**: Initialize user preferences and settings
- **System Events**: Monitor provider health and availability
- **Cost Events**: Track and alert on usage thresholds

## API Specification

### Core Endpoints Overview

```typescript
// Model & Provider Management
GET    /api/models                    // List available models
GET    /api/models/{modelId}          // Get model details
GET    /api/providers/status          // Provider health status

// Prompt Execution
POST   /api/prompts/execute           // Execute prompt
POST   /api/prompts/execute/stream    // Stream execution

// Template Management
GET    /api/templates                 // List templates
POST   /api/templates                 // Create template
PUT    /api/templates/{templateId}    // Update template
DELETE /api/templates/{templateId}    // Delete template

// Session Management
GET    /api/sessions                  // List user sessions
POST   /api/sessions                  // Create session
GET    /api/sessions/{sessionId}/history // Session history

// Evaluation & Testing
POST   /api/evaluation/probabilistic  // Run probabilistic test
GET    /api/evaluation/{testId}       // Get test results

// Tools & Integration
GET    /api/tools                     // List available tools
POST   /api/tools/{toolName}/test     // Test tool

// Analytics
GET    /api/analytics/usage           // Usage analytics
POST   /api/analytics/cost-estimation // Cost estimation
```

## Technical Implementation

### Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware for auth, validation, rate limiting
- **Database**: PostgreSQL for persistent data, Redis for caching
- **Storage**: MinIO for large artifacts and execution results
- **Streaming**: Server-Sent Events (SSE) for real-time responses
- **Authentication**: JWT integration with DADMS auth system

### Database Schema

```sql
-- Playground Sessions
CREATE TABLE playground_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id),
    user_id UUID NOT NULL,
    tags TEXT[],
    execution_count INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_executed TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Prompt Templates
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    prompt TEXT NOT NULL,
    system_prompt TEXT,
    variables TEXT[],
    tags TEXT[],
    default_parameters JSONB,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompt Executions
CREATE TABLE prompt_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES playground_sessions(id),
    user_id UUID NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    system_prompt TEXT,
    parameters JSONB NOT NULL,
    context JSONB,
    response TEXT,
    token_usage JSONB,
    tool_executions JSONB,
    execution_time DECIMAL(8,3),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Evaluation Tests
CREATE TABLE evaluation_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    test_cases JSONB NOT NULL,
    parameters JSONB NOT NULL,
    results JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

### Service Configuration

```typescript
interface LLMPlaygroundConfig {
    // Server Configuration
    port: number;
    host: string;
    cors_origins: string[];
    
    // Database Configuration
    database: DatabaseConfig;
    redis: RedisConfig;
    minio: MinIOConfig;
    
    // LLM Provider Configuration
    providers: {
        openai: OpenAIConfig;
        anthropic: AnthropicConfig;
        ollama: OllamaConfig;
    };
    
    // Rate Limiting
    rate_limits: {
        standard_endpoints: number;
        streaming_endpoints: number;
        evaluation_endpoints: number;
    };
    
    // Evaluation Configuration
    evaluation: {
        max_concurrent_tests: number;
        max_test_runs: number;
        default_timeout: number;
    };
    
    // Caching Configuration
    cache: {
        execution_ttl: number;
        template_ttl: number;
        analytics_ttl: number;
    };
}
```

## Security & Compliance

### Authentication & Authorization
- **JWT Integration**: Seamless integration with DADMS authentication
- **Role-Based Access**: Different access levels for users and administrators
- **Template Permissions**: Fine-grained control over template sharing
- **Session Isolation**: Users can only access their own sessions

### Data Protection
- **Prompt Privacy**: User prompts and responses are encrypted at rest
- **Provider Key Management**: Secure handling of API keys for external providers
- **Audit Logging**: Comprehensive logging of all user actions
- **Data Retention**: Configurable retention policies for executions and results

### Rate Limiting & Abuse Prevention
- **Provider Rate Limits**: Respect external provider limitations
- **User Quotas**: Configurable usage limits per user/organization
- **Cost Controls**: Automatic alerts and limits for high-cost operations
- **Anomaly Detection**: Monitor for unusual usage patterns

## Performance & Scalability

### Performance Targets
- **Response Time**: < 500ms for non-streaming executions
- **Streaming Latency**: < 100ms time-to-first-token
- **Throughput**: 1000+ executions per minute
- **Concurrent Users**: Support for 100+ simultaneous users

### Scalability Design
- **Horizontal Scaling**: Stateless service design for easy scaling
- **Caching Strategy**: Multi-layer caching for frequently accessed data
- **Queue Management**: Background processing for evaluation tests
- **Resource Optimization**: Efficient connection pooling and resource usage

### Monitoring & Observability
- **Health Checks**: Comprehensive health monitoring with dependency checks
- **Metrics Collection**: Detailed metrics on execution performance and costs
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Monitoring**: Real-time performance dashboards

## Integration Points

### DADMS Service Integration
- **Project Service**: Project context for session organization
- **LLM Service**: Unified LLM provider access and management
- **Knowledge Service**: Tool integration for knowledge base search
- **EventManager**: Event-driven communication and monitoring

### External Integrations
- **OpenAI API**: GPT models and function calling
- **Anthropic API**: Claude models and tool usage
- **Ollama**: Local model execution and management
- **Custom Providers**: Extensible provider architecture

## Deployment & Operations

### Container Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3006
CMD ["node", "dist/index.js"]
```

### Environment Variables
```bash
# Server Configuration
PORT=3006
NODE_ENV=production
CORS_ORIGINS=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://dadms_user:password@postgres:5432/dadms
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio:9000

# LLM Provider Configuration
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_ENDPOINT=http://ollama:11434

# Rate Limiting
RATE_LIMIT_STANDARD=100
RATE_LIMIT_STREAMING=50
RATE_LIMIT_EVALUATION=20
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
            providers: await checkProviders()
        }
    };
    
    const isHealthy = Object.values(health.dependencies)
        .every(status => status === 'healthy');
    
    res.status(isHealthy ? 200 : 503).json(health);
});
```

## Development Roadmap

### Phase 1: Core Implementation (Week 2)
- [ ] Basic execution engine with OpenAI integration
- [ ] Template CRUD operations
- [ ] Session management
- [ ] Basic UI integration

### Phase 2: Enhanced Features (Week 3)
- [ ] Multi-provider support (Anthropic, Ollama)
- [ ] Streaming execution capabilities
- [ ] Tool integration
- [ ] Basic evaluation engine

### Phase 3: Advanced Features (Week 4)
- [ ] Probabilistic testing
- [ ] Advanced analytics
- [ ] Collaboration features
- [ ] Export capabilities

### Phase 4: Production Features (Week 5+)
- [ ] Advanced security features
- [ ] Performance optimizations
- [ ] Comprehensive monitoring
- [ ] Full documentation

## Success Metrics

### Technical Metrics
- **Uptime**: 99.9% service availability
- **Performance**: < 500ms average response time
- **Reliability**: < 0.1% error rate
- **Scalability**: Support for 100+ concurrent users

### Business Metrics
- **User Adoption**: 80% of users utilize playground for prompt development
- **Template Usage**: 50+ community templates created and shared
- **Cost Efficiency**: 30% reduction in production LLM costs through better prompt optimization
- **Productivity**: 50% faster prompt development and validation cycles

## Conclusion

The LLM Playground Service provides a comprehensive, user-friendly environment for LLM experimentation and prompt development within the DADMS 2.0 ecosystem. By offering powerful testing capabilities, template management, and advanced evaluation features, it empowers users to develop more effective prompts and make better decisions about LLM usage in production workflows.

The service's integration with the broader DADMS architecture ensures seamless workflow transitions from experimentation to production deployment, while its event-driven design enables proactive assistance and optimization suggestions from other system components. 
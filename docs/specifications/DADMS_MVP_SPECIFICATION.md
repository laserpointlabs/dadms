# DADMS MVP - Rapid Development Specification

## MVP Vision

**Goal**: Demonstrate the complete DADMS workflow from data input to decision documentation in 4-6 weeks

**User Journey**: Create Project → Load Knowledge → Design BPMN Process → Execute with AI → Review Task Results → Generate Decision Document

## MVP Service Architecture (10 Core Services)

### **Priority 1: Foundation Services** (Week 1-2)

#### **1. User/Project Service** - Port 3001
**Status**: 🔄 Enhance existing user management
**Purpose**: Project lifecycle and user management

**Leverage Existing**:
- Current PostgreSQL user tables
- Basic project structure from analysis_metadata

**MVP Enhancements**:
```typescript
interface Project {
    id: string;
    name: string;
    description: string;
    owner_id: string;
    status: 'active' | 'completed';
    knowledge_domain: string;
    created_at: timestamp;
    settings: {
        default_llm: string;
        personas: string[];
        tools_enabled: string[];
    };
}

// API Endpoints
POST /projects          // Create project
GET /projects           // List user projects  
GET /projects/:id       // Get project details
PUT /projects/:id       // Update project
DELETE /projects/:id    // Delete project
```

#### **2. LLM Service** - Port 3002
**Status**: ✅ Mostly complete - enhance current implementation
**Purpose**: Unified LLM access (local + remote)

**Leverage Existing**:
- Current llm-service with OpenAI, Anthropic, Ollama
- Provider routing and configuration

**MVP Focus**:
- Ensure robust local LLM integration
- Add simple tool calling interface
- Cost tracking per project

#### **3. Knowledge + RAG Service** - Port 3003  
**Status**: 🔄 Build on current vector store work
**Purpose**: Project-scoped knowledge management

**Leverage Existing**:
- Current Qdrant integration
- Document processing scripts

**MVP Implementation**:
```typescript
// Project-scoped collections
POST /knowledge/projects/:projectId/upload
POST /knowledge/projects/:projectId/search
GET /knowledge/projects/:projectId/status

// Simple document types: PDF, TXT, MD
// Basic chunking with overlap
// Project-isolated vector collections
```

### **Priority 2: Workflow Core** (Week 2-3)

#### **4. BPMN Workspace** - Port 3004
**Status**: ✅ Excellent foundation - comprehensive_bpmn_modeler.html
**Purpose**: Process design with AI assistance

**Leverage Existing**:
- Current comprehensive BPMN modeler
- BPMN.js integration
- Process deployment to Camunda

**MVP Enhancements**:
- Service task configuration for prompts + personas + tools
- Simple AI suggestions for next nodes
- Direct integration with Context Manager

#### **5. Context Manager** - Port 3005
**Status**: 🔄 Enhance current prompt service
**Purpose**: Prompt + Persona + Tool context assembly

**Leverage Existing**:
- Current prompt service PostgreSQL schema
- Test case management
- LLM integration patterns

**MVP Focus**:
```typescript
interface ContextTemplate {
    id: string;
    project_id: string;
    name: string;
    prompt_template: string;
    persona: {
        role: string;
        expertise: string[];
        guidelines: string;
    };
    tools_available: string[];
    knowledge_domains: string[];
}

// Service task context assembly
POST /context/assemble
{
    template_id: string,
    project_id: string,
    task_variables: object,
    thread_id: string
}
```

#### **6. Tool Manager** - Port 3006
**Status**: 🔄 Enhance current tool service
**Purpose**: Tool registration and schema validation

**Leverage Existing**:
- Current tool service structure
- Basic tool registration

**MVP Tools**:
- RAG Search tool (integrate with Knowledge Service)
- Web Search tool (simple API integration)
- Calculator/Analysis tool (basic math/stats)
- Document Generator tool (basic templates)

### **Priority 3: Execution Engine** (Week 3-4)

#### **7. Process Management** - Port 3007
**Status**: ✅ Excellent - reuse current implementation
**Purpose**: BPMN process lifecycle management

**Leverage Existing**:
- Current process management UI
- Camunda integration
- Process deployment and monitoring

**MVP Enhancements**:
- Integration with project scope
- Enhanced process instance tracking
- Link to Task Execution Manager

#### **8. Task Execution Manager** - Port 3008
**Status**: 🔄 Enhance current analysis data management
**Purpose**: Task I/O capture and efficacy tracking

**Leverage Existing**:
- Current analysis_metadata and analysis_data tables
- Task monitoring scripts
- PostgreSQL storage patterns

**MVP Schema Enhancement**:
```sql
-- Enhance existing analysis_metadata
ALTER TABLE analysis_metadata ADD COLUMN project_id UUID;
ALTER TABLE analysis_metadata ADD COLUMN task_name VARCHAR(255);
ALTER TABLE analysis_metadata ADD COLUMN efficacy_score INTEGER;

-- Task I/O storage
CREATE TABLE task_executions (
    id UUID PRIMARY KEY,
    project_id UUID,
    process_instance_id VARCHAR(255),
    task_id VARCHAR(255),
    task_name VARCHAR(255),
    thread_id VARCHAR(255),
    input_context JSONB,
    output_context JSONB,
    execution_time_ms INTEGER,
    efficacy_score INTEGER,
    user_rating INTEGER,
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Priority 4: Documentation & Review** (Week 4)

#### **9. Thread Manager** - Port 3009
**Status**: 🔄 Enhance current thread persistence
**Purpose**: Decision conversation management

**Leverage Existing**:
- Current thread_id patterns in analysis data
- OpenAI thread management

**MVP Implementation**:
- Store thread context in vector store
- Thread history and replay
- Thread similarity for related decisions

#### **10. Agent Assistant & Documentation Service (AADS)** - Port 3010
**Status**: 🆕 New but simple implementation
**Purpose**: AI-assisted document generation

**MVP Features**:
- Template-based document generation
- Simple artifact embedding
- Export to PDF/MD formats
- Integration with thread context

```typescript
// Simple document generation
POST /documents/generate
{
    template: "decision_summary",
    project_id: string,
    thread_id: string,
    process_instance_id: string,
    include_artifacts: string[]
}
```

## MVP Database Schema

### **Enhanced PostgreSQL** (Build on existing)
```sql
-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    knowledge_domain VARCHAR(100),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Context templates (enhance prompts table)
ALTER TABLE prompts ADD COLUMN project_id UUID;
ALTER TABLE prompts ADD COLUMN persona JSONB;
ALTER TABLE prompts ADD COLUMN tools_available JSONB;

-- Task executions (enhance analysis_metadata)
-- [Schema from above]
```

### **Qdrant Collections** (Project-scoped)
```javascript
// Collection per project
collection_name: `project_${project_id}_knowledge`
collection_name: `project_${project_id}_threads`
```

## MVP UI Architecture

### **Enhanced Current UI**
**Leverage**: Existing React components, Material-UI, microservices integration

**New Components**:
1. **Project Dashboard** - Project CRUD with knowledge upload
2. **BPMN Designer** - Enhanced comprehensive modeler
3. **Context Designer** - Prompt + Persona + Tool configuration
4. **Process Monitor** - Enhanced current process management
5. **Task Review** - Task I/O review and efficacy rating
6. **Document Generator** - AI-assisted report creation

## MVP Development Timeline

### **Week 1: Foundation**
- Project Service implementation
- Knowledge Service project-scoping
- Enhanced LLM Service tool integration

### **Week 2: Workflow Core**
- Context Manager persona integration
- Tool Manager basic tools
- BPMN Workspace service task configuration

### **Week 3: Execution**
- Process orchestration integration
- Task Execution Manager enhancement
- Thread management implementation

### **Week 4: Documentation**
- AADS basic implementation
- End-to-end testing
- Documentation and demos

## MVP Success Criteria

### **Functional Demo**
1. ✅ Create project and upload domain knowledge (5 min)
2. ✅ Design BPMN process with AI-configured service tasks (10 min)
3. ✅ Execute process with real LLM interactions (5 min)
4. ✅ Review task results and rate efficacy (5 min)
5. ✅ Generate decision document with AI assistance (10 min)

### **Technical Benchmarks**
- 📊 Support 3-5 concurrent users
- 📊 Process 10MB knowledge documents
- 📊 Execute 5-node BPMN workflows
- 📊 Generate 10-page decision documents
- 📊 Complete audit trail for all operations

## Rapid Development Strategy

### **Reuse Current Assets**
- ✅ comprehensive_bpmn_modeler.html (90% ready)
- ✅ Process management UI (80% ready)  
- ✅ LLM service architecture (85% ready)
- ✅ PostgreSQL schemas (70% ready)
- ✅ Microservices patterns (80% ready)

### **Focus Areas for New Development**
- 🔧 Project-scoped knowledge management
- 🔧 Context assembly with personas
- 🔧 Task I/O comprehensive capture
- 🔧 Simple document generation
- 🔧 UI integration and polish

### **Risk Mitigation**
- Build on proven components first
- Simple implementations for new features
- Incremental integration and testing
- Focus on end-to-end flow over feature completeness

This MVP specification leverages ~80% of existing work while adding the key missing pieces for a complete demonstrator. Ready to start implementation?

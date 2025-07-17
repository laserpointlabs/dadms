# DADMS MVP - Rapid Development Specification

## MVP Vision

**Goal**: Demonstrate the complete DADMS workflow from data input to decision documentation in 4-6 weeks

**User Journey**: Create Project → Load Knowledge → Design BPMN Process → Execute with AI → Review Task Results → Generate Decision Document

**Key Innovation**: **Intelligent, proactive assistance** via Event Bus + AAS that makes DADMS feel like having an expert colleague

## MVP Service Architecture (7 Core Services)

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

### **Priority 2: Intelligence Layer** (Week 1-2)

#### **4. Event Bus Service** - Port 3004
**Status**: 🆕 New - Core MVP component
**Purpose**: Central nervous system for all system events

**MVP Features**:
```typescript
interface Event {
    id: string;
    event_type: string;
    source_service: string;
    data: object;
    timestamp: string;
    user_id?: string;
    project_id?: string;
}

// Event Publishing
POST /events/publish
{
    "event_type": "project.created",
    "data": { "project_id": "uuid", "name": "UAV Design" },
    "user_id": "user123"
}

// Event Subscription
GET /events/stream?filter=project.created,process.started
// Server-Sent Events stream

// Event History
GET /events/history?event_type=project.created&limit=50
```

**Event Types**:
- `project.created`, `project.updated`, `project.deleted`
- `knowledge.uploaded`, `knowledge.processed`, `knowledge.indexed`
- `process.started`, `process.completed`, `process.stuck`, `process.failed`
- `task.started`, `task.completed`, `task.failed`
- `user.page_view`, `user.action`, `user.stuck`

#### **5. Agent Assistance Service (AAS)** - Port 3005
**Status**: 🆕 New - Core MVP component
**Purpose**: Intelligent, proactive assistant that monitors and helps users

**MVP Features**:
```typescript
interface AASContext {
    current_page: string;
    current_project?: string;
    user_id: string;
    recent_events: Event[];
    system_state: object;
}

// Proactive Assistance
POST /aas/observe-context
{
    "current_page": "process-manager",
    "current_project": "uav-design-2024",
    "user_id": "user123"
}

// Natural Language Interaction
POST /aas/ask
{
    "question": "What's happening with my UAV project?",
    "context": AASContext
}

// Proactive Suggestions
GET /aas/suggestions?context=current_page,current_project

// Action Execution
POST /aas/execute-action
{
    "action": "create_process_template",
    "parameters": { "template_type": "uav_design" },
    "context": AASContext
}
```

**AAS Capabilities**:
- **Page Context Awareness**: Knows what page user is on
- **Proactive Monitoring**: Watches for issues and opportunities
- **Natural Language**: Conversational interaction
- **Action Execution**: Can perform tasks on user's behalf
- **Learning**: Remembers user preferences and patterns

### **Priority 3: Workflow Core** (Week 2-3)

#### **6. BPMN Workspace** - Port 3006
**Status**: ✅ Excellent foundation - comprehensive_bpmn_modeler.html
**Purpose**: Process design with AI assistance

**Leverage Existing**:
- Current comprehensive BPMN modeler
- BPMN.js integration
- Process deployment to Camunda

**MVP Enhancements**:
- Service task configuration for prompts + personas + tools
- **AAS integration for intelligent suggestions**
- Direct integration with Context Manager

#### **7. Process Management** - Port 3007
**Status**: ✅ Excellent - reuse current implementation
**Purpose**: BPMN process lifecycle management

**Leverage Existing**:
- Current process management UI
- Camunda integration
- Process deployment and monitoring

**MVP Enhancements**:
- Integration with project scope
- **Event Bus integration for real-time updates**
- **AAS monitoring and assistance**

## MVP User Experience Flow

### **Intelligent, Proactive Experience**:

1. **User creates project** → Event published → AAS welcomes user with personalized guidance
2. **User uploads documents** → Event published → AAS suggests next steps and templates
3. **User designs process** → Event published → AAS offers intelligent workflow suggestions
4. **Process runs** → Events published → AAS monitors and proactively assists
5. **Issues occur** → Events published → AAS detects and fixes problems automatically

### **Example AAS Interactions**:

**Scenario 1: User on Process Designer**
```
AAS: "I see you're designing a UAV workflow. Based on your project context, 
     I recommend adding these service tasks: cost analysis, risk assessment, 
     and design validation. Want me to create this template for you?"

User: "Yes, please"

AAS: *automatically creates the workflow template with proper service tasks*
```

**Scenario 2: Process Stuck**
```
AAS: "Your cost analysis process has been waiting for 30 minutes. 
     I checked the logs and found the issue - the LLM service is down. 
     I've restarted it for you. The process should resume in 2 minutes."
```

**Scenario 3: User Asks for Help**
```
User: "What should I do next?"

AAS: "Looking at your UAV project, you've completed the design phase. 
     The next logical step is to run the cost analysis. I can start that 
     process for you right now. Would you like me to?"
```

## Implementation Priority

### **Week 1: Foundation + Intelligence**
- Day 1: Project Service foundation
- Day 2: Knowledge Service with Qdrant
- Day 3: **Event Bus Service** (simple but functional)
- Day 4: **AAS Service** (basic but intelligent)
- Day 5: LLM Service integration and testing

### **Week 2: Workflow Integration**
- Day 1-2: BPMN Workspace with AAS integration
- Day 3-4: Process Management with Event Bus
- Day 5: End-to-end testing and refinement

## Success Criteria

### **Functional Goals**
1. **User can create decision project in <30 seconds**
2. **Knowledge upload and processing completes in <5 minutes**
3. **BPMN workflow creation with AI assistance in <15 minutes**
4. **End-to-end decision workflow execution in <10 minutes**
5. **AAS provides proactive assistance within 5 seconds of user actions**

### **User Experience Goals**
1. **AAS feels like having an expert colleague**
2. **Users receive proactive help without asking**
3. **System automatically detects and fixes common issues**
4. **Natural language interaction feels intuitive**
5. **Context-aware suggestions are relevant and helpful**

### **Technical Goals**
1. **System handles 50+ concurrent users**
2. **99.9% uptime for critical decision processes**
3. **Sub-second response times for AAS interactions**
4. **Event Bus processes 1000+ events per minute**
5. **Complete audit trail for regulatory compliance**

## Why This MVP is Special

### **Without Event Bus + AAS:**
- Static workflow execution
- Manual monitoring and debugging
- No proactive assistance
- Just another BPMN tool

### **With Event Bus + AAS:**
- **Live, intelligent system** that responds to user needs
- **Proactive problem detection** and resolution
- **Context-aware assistance** that feels magical
- **Differentiated product** that stands out in the market

This MVP will demonstrate the true potential of DADMS as an intelligent decision assistant, not just a workflow tool.

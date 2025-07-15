# DADMS Week 1 Implementation Plan

## Branch Strategy & Context Preservation

### **Create Development Branch**
```bash
# Preserve current work
git add . && git commit -m "Pre-DADMS context checkpoint"
git push origin fix/postgres_fix_after_llm_integration

# Create new development branch
git checkout -b feature/dadms-mvp-week1
git push -u origin feature/dadms-mvp-week1

# Create parallel workspace (optional)
mkdir ../dadms-mvp
cp -r . ../dadms-mvp/
cd ../dadms-mvp
```

### **Context Export for Cursor**
```bash
# Export complete context package
./scripts/export-context.sh  # Will create below
```

## Week 1 Detailed Breakdown (5 working days)

### **Day 1: Foundation & Project Service**

#### **Morning: Environment Setup**
- [ ] Create new branch: `feature/dadms-mvp-week1`
- [ ] Update docker-compose.yml for MVP services
- [ ] Verify all existing services health
- [ ] Create project service template

#### **Afternoon: User/Project Service (Port 3001)**
**Goal**: Project CRUD with knowledge domain support

**Tasks**:
```bash
# Enhance existing user management
services/user-project-service/
├── src/
│   ├── models/
│   │   ├── User.ts
│   │   └── Project.ts         # NEW
│   ├── routes/
│   │   ├── users.ts          # EXISTING - enhance
│   │   └── projects.ts       # NEW
│   ├── database/
│   │   └── project-schema.sql # NEW
│   └── index.ts              # ENHANCE
```

**Database Schema**:
```sql
-- Extend existing PostgreSQL
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL, -- Reference to existing users
    status VARCHAR(50) DEFAULT 'active',
    knowledge_domain VARCHAR(100),
    settings JSONB DEFAULT '{
        "default_llm": "openai/gpt-4",
        "personas": [],
        "tools_enabled": ["rag_search", "web_search"]
    }'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints**:
```typescript
// services/user-project-service/src/routes/projects.ts
router.post('/projects', createProject);        // Create new project
router.get('/projects', getUserProjects);       // List user's projects
router.get('/projects/:id', getProject);        // Get project details
router.put('/projects/:id', updateProject);     // Update project
router.delete('/projects/:id', deleteProject);  // Delete project
```

### **Day 2: Knowledge Service Foundation**

#### **Goal**: Project-scoped RAG with document upload

**Tasks**:
```bash
# Build on existing Qdrant integration
services/knowledge-service/
├── src/
│   ├── processors/
│   │   ├── pdf-processor.ts    # NEW
│   │   ├── text-processor.ts   # NEW
│   │   └── chunker.ts          # NEW
│   ├── qdrant/
│   │   ├── collection-manager.ts # ENHANCE existing
│   │   └── project-scoped.ts   # NEW
│   ├── routes/
│   │   ├── upload.ts           # NEW
│   │   ├── search.ts           # NEW
│   │   └── collections.ts      # NEW
│   └── index.ts
```

**Key Features**:
- Project-isolated Qdrant collections: `project_${projectId}_knowledge`
- Document upload with chunking
- Basic search within project scope
- Integration with existing vector store

**API Implementation**:
```typescript
// Document upload and processing
POST /knowledge/projects/:projectId/upload
POST /knowledge/projects/:projectId/search
GET /knowledge/projects/:projectId/status
DELETE /knowledge/projects/:projectId/documents/:docId
```

### **Day 3: LLM Service Enhancement**

#### **Goal**: Tool calling and project context integration

**Tasks**:
```bash
# Enhance existing LLM service
services/llm-service/src/
├── tools/
│   ├── rag-tool.ts           # NEW - integrates with Knowledge Service
│   ├── web-search-tool.ts    # NEW - simple web search
│   └── tool-registry.ts      # NEW
├── providers/
│   ├── openai-provider.ts    # ENHANCE - add tool calling
│   ├── anthropic-provider.ts # ENHANCE - add tool calling  
│   └── local-provider.ts     # ENHANCE - add tool calling
└── routes/
    ├── complete.ts           # ENHANCE existing
    └── complete-with-tools.ts # NEW
```

**Enhanced API**:
```typescript
// Add tool calling to existing LLM service
POST /llm/complete-with-tools
{
    "context": "Analyze the uploaded engineering docs...",
    "project_id": "uuid",
    "tools": ["rag_search", "web_search"],
    "provider": "openai",
    "model": "gpt-4"
}
```

### **Day 4: UI Integration & Project Dashboard**

#### **Goal**: Project management interface and navigation

**Tasks**:
```bash
# Enhance existing React UI
ui/src/components/
├── ProjectDashboard/
│   ├── ProjectList.tsx       # NEW
│   ├── ProjectCard.tsx       # NEW
│   ├── CreateProject.tsx     # NEW
│   └── ProjectSettings.tsx   # NEW
├── KnowledgeManager/
│   ├── DocumentUpload.tsx    # NEW
│   ├── DocumentList.tsx      # NEW
│   └── SearchInterface.tsx   # NEW
└── Navigation/
    └── ProjectNavigation.tsx  # ENHANCE existing
```

**New UI Components**:
- Project creation and management dashboard
- Knowledge document upload interface  
- Project-scoped navigation
- Integration with existing microservices API

### **Day 5: Integration Testing & Week 2 Prep**

#### **Morning: End-to-End Testing**
- [ ] Create project → Upload documents → Search knowledge
- [ ] Test all API endpoints with Postman/curl
- [ ] Verify PostgreSQL and Qdrant integration
- [ ] UI navigation and project workflows

#### **Afternoon: Week 2 Preparation**
- [ ] Document Week 1 achievements
- [ ] Create Context Manager service template
- [ ] Plan BPMN Workspace enhancements
- [ ] Set up Tool Manager foundation

## Success Criteria for Week 1

### **Functional Requirements**
- ✅ Create new decision project (< 30 seconds)
- ✅ Upload PDF/text documents to project (< 2 minutes)
- ✅ Search project knowledge base (< 5 seconds)
- ✅ Navigate between projects seamlessly
- ✅ All APIs documented and tested

### **Technical Requirements**
- 📊 PostgreSQL schema extensions deployed
- 📊 Qdrant project-scoped collections working
- 📊 Enhanced LLM service with basic tool calling
- 📊 React UI with project management
- 📊 All services health monitoring operational

## Risk Mitigation

### **Preserve Current Work**
- Keep existing services running on original ports
- Branch-based development with regular commits
- Current system remains functional for reference

### **Incremental Integration**
- Build one service enhancement at a time
- Test integration after each component
- Roll back capability if issues arise

### **Documentation**
- API documentation for each enhanced service
- Database schema migration scripts
- UI component integration guides

## Week 2 Preview

**Context Manager (CMS)**: Enhance prompt service with personas
**BPMN Workspace**: Add service task configuration to comprehensive modeler
**Tool Manager**: Register RAG, web search, basic analysis tools
**Process Integration**: Connect projects to workflow execution

Ready to start Day 1 implementation?

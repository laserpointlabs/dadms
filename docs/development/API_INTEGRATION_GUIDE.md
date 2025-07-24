# DADMS 2.0 API Integration Guide

## Overview

This guide provides a comprehensive mapping between UI components and required backend API endpoints, along with implementation patterns for connecting the frontend to the backend services.

## API Architecture

### Base URL Structure
```
Development: http://localhost:3001-3021/api
Production: https://api.dadms.com/v1
```

### Authentication
All API requests require authentication via JWT tokens:
```typescript
// Request headers
{
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json',
  'user-id': '<user_uuid>' // For user context
}
```

## Service API Mappings

### 1. Authentication Service (Port 3001)

#### Endpoints
```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// GET /api/auth/me
interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  avatar_url?: string;
  preferences: Record<string, any>;
  last_login: string;
}

// POST /api/auth/logout
interface LogoutRequest {
  refreshToken: string;
}
```

#### UI Integration
```typescript
// src/services/authApi.ts
export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  }

  async getProfile(): Promise<UserProfile> {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }
}
```

### 2. Project Service (Port 3001)

#### Endpoints
```typescript
// GET /api/projects
interface ProjectListRequest {
  page?: number;
  limit?: number;
  status?: string[];
  search?: string;
  tags?: string[];
}

interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// POST /api/projects
interface CreateProjectRequest {
  name: string;
  description: string;
  knowledge_domain: string;
  decision_context?: string;
  tags?: string[];
  settings?: Partial<ProjectSettings>;
}

// GET /api/projects/:id
interface ProjectDetailResponse {
  project: Project;
  statistics: ProjectStatistics;
  team_members: TeamMember[];
  recent_activity: Activity[];
}

// PUT /api/projects/:id
interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: string;
  knowledge_domain?: string;
  decision_context?: string;
  tags?: string[];
  settings?: Partial<ProjectSettings>;
}

// DELETE /api/projects/:id
// GET /api/projects/:id/statistics
// GET /api/projects/:id/team
// POST /api/projects/:id/team
// DELETE /api/projects/:id/team/:userId
```

#### UI Integration
```typescript
// src/services/projectApi.ts (Enhanced)
export class ProjectService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

  async getProjects(params: ProjectListRequest): Promise<ProjectListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) params.status.forEach(s => queryParams.append('status', s));
    if (params.search) queryParams.append('search', params.search);
    if (params.tags) params.tags.forEach(t => queryParams.append('tags', t));

    const response = await fetch(`${this.baseUrl}/projects?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getProject(id: string): Promise<ProjectDetailResponse> {
    const response = await fetch(`${this.baseUrl}/projects/${id}`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }
}
```

### 3. Knowledge Service (Port 3003)

#### Endpoints
```typescript
// POST /api/documents/upload
interface UploadDocumentRequest {
  file: File;
  project_id?: string;
  domain_ids?: string[];
  tag_ids?: string[];
  description?: string;
}

interface UploadDocumentResponse {
  document: Document;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  estimated_completion?: string;
}

// GET /api/documents
interface DocumentListRequest {
  project_id?: string;
  domain_ids?: string[];
  tag_ids?: string[];
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// GET /api/documents/:id
interface DocumentDetailResponse {
  document: Document;
  content?: string;
  embeddings_status: string;
  related_documents: Document[];
}

// POST /api/documents/search
interface SearchRequest {
  query: string;
  project_id?: string;
  domain_ids?: string[];
  tag_ids?: string[];
  limit?: number;
  offset?: number;
  include_content?: boolean;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  processing_time: number;
}

// GET /api/domains
interface DomainListResponse {
  domains: Domain[];
  total: number;
}

// POST /api/domains
interface CreateDomainRequest {
  name: string;
  description: string;
  parent_id?: string;
  color?: string;
}

// GET /api/tags
interface TagListResponse {
  tags: Tag[];
  total: number;
}
```

#### UI Integration
```typescript
// src/services/knowledgeApi.ts
export class KnowledgeService {
  private baseUrl = process.env.NEXT_PUBLIC_KNOWLEDGE_API || 'http://localhost:3003/api';

  async uploadDocument(data: UploadDocumentRequest): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.project_id) formData.append('project_id', data.project_id);
    if (data.domain_ids) data.domain_ids.forEach(id => formData.append('domain_ids', id));
    if (data.tag_ids) data.tag_ids.forEach(id => formData.append('tag_ids', id));
    if (data.description) formData.append('description', data.description);

    const response = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.getToken()}` },
      body: formData
    });
    return response.json();
  }

  async searchDocuments(query: SearchRequest): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/documents/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });
    return response.json();
  }

  async getDomains(): Promise<DomainListResponse> {
    const response = await fetch(`${this.baseUrl}/domains`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }
}
```

### 4. LLM Service (Port 3002)

#### Endpoints
```typescript
// POST /api/llm/chat
interface ChatRequest {
  project_id: string;
  messages: ChatMessage[];
  model?: string;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  tools?: Tool[];
}

interface ChatResponse {
  response: string;
  model: string;
  provider: string;
  tokens_used: number;
  cost: number;
  duration_ms: number;
  interaction_id: string;
}

// POST /api/llm/generate
interface GenerateRequest {
  project_id: string;
  prompt: string;
  model?: string;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
}

// GET /api/llm/providers
interface ProviderListResponse {
  providers: LLMProvider[];
}

// GET /api/llm/models
interface ModelListResponse {
  models: Model[];
}

// POST /api/llm/embeddings
interface EmbeddingRequest {
  text: string;
  model?: string;
  provider?: string;
}

interface EmbeddingResponse {
  embeddings: number[];
  model: string;
  provider: string;
  tokens_used: number;
}

// GET /api/llm/interactions
interface InteractionListRequest {
  project_id?: string;
  provider?: string;
  model?: string;
  page?: number;
  limit?: number;
}

// GET /api/llm/templates
interface TemplateListResponse {
  templates: LLMTemplate[];
}
```

#### UI Integration
```typescript
// src/services/llmApi.ts
export class LLMService {
  private baseUrl = process.env.NEXT_PUBLIC_LLM_API || 'http://localhost:3002/api';

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/llm/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    return response.json();
  }

  async generate(request: GenerateRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/llm/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    return response.json();
  }

  async getProviders(): Promise<ProviderListResponse> {
    const response = await fetch(`${this.baseUrl}/llm/providers`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }

  async getModels(): Promise<ModelListResponse> {
    const response = await fetch(`${this.baseUrl}/llm/models`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }
}
```

### 5. Process Manager Service (Port 3007)

#### Endpoints
```typescript
// GET /api/processes
interface ProcessListRequest {
  project_id?: string;
  status?: string[];
  category?: string;
  page?: number;
  limit?: number;
}

// POST /api/processes
interface CreateProcessRequest {
  project_id: string;
  name: string;
  description?: string;
  bpmn_xml: string;
  category?: string;
  tags?: string[];
}

// GET /api/processes/:id
interface ProcessDetailResponse {
  process: ProcessDefinition;
  instances: ProcessInstance[];
  statistics: ProcessStatistics;
}

// POST /api/processes/:id/start
interface StartProcessRequest {
  variables?: Record<string, any>;
  business_key?: string;
}

// GET /api/processes/:id/instances
interface InstanceListResponse {
  instances: ProcessInstance[];
  total: number;
}

// GET /api/tasks
interface TaskListRequest {
  assignee_id?: string;
  status?: string[];
  priority?: number[];
  process_instance_id?: string;
  page?: number;
  limit?: number;
}

// POST /api/tasks/:id/complete
interface CompleteTaskRequest {
  variables?: Record<string, any>;
  comments?: string;
}

// POST /api/tasks/:id/claim
interface ClaimTaskRequest {
  user_id: string;
}

// POST /api/tasks/:id/unclaim
```

#### UI Integration
```typescript
// src/services/processApi.ts
export class ProcessService {
  private baseUrl = process.env.NEXT_PUBLIC_PROCESS_API || 'http://localhost:3007/api';

  async getProcesses(params: ProcessListRequest): Promise<ProcessListResponse> {
    const queryParams = new URLSearchParams();
    if (params.project_id) queryParams.append('project_id', params.project_id);
    if (params.status) params.status.forEach(s => queryParams.append('status', s));
    if (params.category) queryParams.append('category', params.category);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/processes?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }

  async createProcess(data: CreateProcessRequest): Promise<ProcessDefinition> {
    const response = await fetch(`${this.baseUrl}/processes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async startProcess(id: string, data: StartProcessRequest): Promise<ProcessInstance> {
    const response = await fetch(`${this.baseUrl}/processes/${id}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getTasks(params: TaskListRequest): Promise<TaskListResponse> {
    const queryParams = new URLSearchParams();
    if (params.assignee_id) queryParams.append('assignee_id', params.assignee_id);
    if (params.status) params.status.forEach(s => queryParams.append('status', s));
    if (params.priority) params.priority.forEach(p => queryParams.append('priority', p.toString()));
    if (params.process_instance_id) queryParams.append('process_instance_id', params.process_instance_id);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/tasks?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }

  async completeTask(id: string, data: CompleteTaskRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tasks/${id}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
```

### 6. Ontology Workspace Service (Port 3016)

#### Endpoints
```typescript
// GET /api/ontology/entities
interface EntityListRequest {
  project_id: string;
  type?: string;
  search?: string;
}

// POST /api/ontology/entities
interface CreateEntityRequest {
  project_id: string;
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, any>;
  position_x?: number;
  position_y?: number;
  color?: string;
}

// PUT /api/ontology/entities/:id
interface UpdateEntityRequest {
  name?: string;
  description?: string;
  properties?: Record<string, any>;
  position_x?: number;
  position_y?: number;
  color?: string;
}

// DELETE /api/ontology/entities/:id

// GET /api/ontology/relationships
interface RelationshipListRequest {
  project_id: string;
  source_entity_id?: string;
  target_entity_id?: string;
  relationship_type?: string;
}

// POST /api/ontology/relationships
interface CreateRelationshipRequest {
  project_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  label?: string;
  properties?: Record<string, any>;
}

// DELETE /api/ontology/relationships/:id
```

#### UI Integration
```typescript
// src/services/ontologyApi.ts
export class OntologyService {
  private baseUrl = process.env.NEXT_PUBLIC_ONTOLOGY_API || 'http://localhost:3016/api';

  async getEntities(params: EntityListRequest): Promise<EntityListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('project_id', params.project_id);
    if (params.type) queryParams.append('type', params.type);
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${this.baseUrl}/ontology/entities?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }

  async createEntity(data: CreateEntityRequest): Promise<OntologyEntity> {
    const response = await fetch(`${this.baseUrl}/ontology/entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async updateEntity(id: string, data: UpdateEntityRequest): Promise<OntologyEntity> {
    const response = await fetch(`${this.baseUrl}/ontology/entities/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getRelationships(params: RelationshipListRequest): Promise<RelationshipListResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('project_id', params.project_id);
    if (params.source_entity_id) queryParams.append('source_entity_id', params.source_entity_id);
    if (params.target_entity_id) queryParams.append('target_entity_id', params.target_entity_id);
    if (params.relationship_type) queryParams.append('relationship_type', params.relationship_type);

    const response = await fetch(`${this.baseUrl}/ontology/relationships?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return response.json();
  }

  async createRelationship(data: CreateRelationshipRequest): Promise<OntologyRelationship> {
    const response = await fetch(`${this.baseUrl}/ontology/relationships`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
```

## Real-time Communication

### WebSocket Integration
```typescript
// src/services/websocketService.ts
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3004';
    this.ws = new WebSocket(`${wsUrl}?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'project:updated':
        this.emit('project:updated', data.payload);
        break;
      case 'document:processed':
        this.emit('document:processed', data.payload);
        break;
      case 'task:assigned':
        this.emit('task:assigned', data.payload);
        break;
      case 'process:completed':
        this.emit('process:completed', data.payload);
        break;
      case 'llm:response':
        this.emit('llm:response', data.payload);
        break;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect(this.getToken());
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }

  private emit(event: string, data: any) {
    // Dispatch custom event for React components to listen to
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}
```

## Error Handling

### Global Error Handler
```typescript
// src/utils/apiErrorHandler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.code || 'UNKNOWN_ERROR',
      errorData.message || `HTTP ${response.status}`,
      errorData.details
    );
  }
  return response.json();
}

// Enhanced service with error handling
export class EnhancedApiService {
  protected async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return handleApiResponse<T>(response);
  }
}
```

## Authentication Context

### React Context for Auth
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const response = await authService.refresh({ refreshToken });
        setToken(response.token);
        localStorage.setItem('token', response.token);
      } catch (error) {
        logout();
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userProfile = await authService.getProfile();
          setToken(storedToken);
          setUser(userProfile);
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      refreshToken,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Implementation Checklist

### Phase 1: Core Services (Week 1-2)
- [ ] Implement Authentication Service
- [ ] Implement Project Service
- [ ] Implement Knowledge Service
- [ ] Implement LLM Service
- [ ] Create API client services
- [ ] Set up authentication context
- [ ] Connect UI components to real APIs

### Phase 2: Process Services (Week 3-4)
- [ ] Implement Process Manager Service
- [ ] Implement Thread Manager Service
- [ ] Implement User Task Management
- [ ] Connect BPMN workspace
- [ ] Implement task assignment flows

### Phase 3: Advanced Services (Week 5-6)
- [ ] Implement Ontology Workspace Service
- [ ] Implement Model Manager Service
- [ ] Implement Simulation Manager Service
- [ ] Connect graph visualizations
- [ ] Implement model execution flows

### Phase 4: Integration (Week 7-8)
- [ ] Implement WebSocket connections
- [ ] Add real-time updates
- [ ] Implement caching strategies
- [ ] Add error recovery mechanisms
- [ ] Performance optimization

## Testing Strategy

### API Testing
```typescript
// src/tests/api.test.ts
describe('Project API', () => {
  it('should create a new project', async () => {
    const projectData = {
      name: 'Test Project',
      description: 'Test Description',
      knowledge_domain: 'test'
    };

    const response = await projectService.createProject(projectData);
    expect(response.name).toBe(projectData.name);
    expect(response.id).toBeDefined();
  });

  it('should handle authentication errors', async () => {
    // Test with invalid token
    expect(async () => {
      await projectService.getProjects({});
    }).rejects.toThrow('Unauthorized');
  });
});
```

### Integration Testing
```typescript
// src/tests/integration.test.ts
describe('Project Workflow', () => {
  it('should complete full project lifecycle', async () => {
    // 1. Create project
    const project = await projectService.createProject(projectData);
    
    // 2. Upload document
    const document = await knowledgeService.uploadDocument({
      file: testFile,
      project_id: project.id
    });
    
    // 3. Search documents
    const searchResults = await knowledgeService.searchDocuments({
      query: 'test query',
      project_id: project.id
    });
    
    // 4. LLM interaction
    const llmResponse = await llmService.chat({
      project_id: project.id,
      messages: [{ role: 'user', content: 'Hello' }]
    });
    
    expect(project).toBeDefined();
    expect(document).toBeDefined();
    expect(searchResults.results).toHaveLength(1);
    expect(llmResponse.response).toBeDefined();
  });
});
```

This API integration guide provides a comprehensive roadmap for connecting the UI to the backend services. The next step is to implement these services and gradually replace mock data with real API calls. 
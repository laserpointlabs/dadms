import { PaginatedResponse } from '../types/api';
import { CreateProjectRequest, Project, ProjectStatus, UpdateProjectRequest } from '../types/services/project';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';
const USER_ID = process.env.NEXT_PUBLIC_USER_ID || '0d6838ad-ae0e-4637-96cd-3c3271854da4';

// API response types (snake_case from backend)
interface ApiProject {
    id: string;
    name: string;
    description: string;
    status: string;
    knowledge_domain: string;
    decision_context?: string;
    owner_id: string;
    tags?: string[];
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// Transform API response to match TypeScript interface (snake_case to camelCase)
function transformProject(apiProject: ApiProject): Project {
    return {
        id: apiProject.id,
        name: apiProject.name,
        description: apiProject.description,
        status: apiProject.status as ProjectStatus,
        knowledgeDomain: apiProject.knowledge_domain,
        decisionContext: apiProject.decision_context || '',
        ownerId: apiProject.owner_id,
        tags: apiProject.tags || [],
        metadata: apiProject.metadata || {},
        createdAt: apiProject.created_at,
        updatedAt: apiProject.updated_at,
    };
}

// Transform TypeScript request to API format (camelCase to snake_case)
function transformCreateRequest(request: CreateProjectRequest): Record<string, any> {
    return {
        name: request.name,
        description: request.description,
        knowledge_domain: request.knowledgeDomain,
        decision_context: request.decisionContext,
        tags: request.tags,
        metadata: request.metadata,
    };
}

function transformUpdateRequest(request: UpdateProjectRequest): Record<string, any> {
    const transformed: Record<string, any> = {};
    if (request.name !== undefined) transformed.name = request.name;
    if (request.description !== undefined) transformed.description = request.description;
    if (request.status !== undefined) transformed.status = request.status;
    if (request.knowledgeDomain !== undefined) transformed.knowledge_domain = request.knowledgeDomain;
    if (request.decisionContext !== undefined) transformed.decision_context = request.decisionContext;
    if (request.tags !== undefined) transformed.tags = request.tags;
    if (request.metadata !== undefined) transformed.metadata = request.metadata;
    return transformed;
}

export async function fetchProjects(): Promise<PaginatedResponse<Project>> {
    const res = await fetch(`${API_BASE}/projects`, {
        headers: { 'user-id': USER_ID }
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    const result = await res.json();

    // Transform the response to match our types
    return {
        items: result.data.projects.map(transformProject),
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.limit,
        hasNext: result.data.page * result.data.limit < result.data.total,
        hasPrevious: result.data.page > 1,
    };
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-id': USER_ID
        },
        body: JSON.stringify(transformCreateRequest(data))
    });
    if (!res.ok) throw new Error('Failed to create project');
    const result = await res.json();
    return transformProject(result.data);
}

export async function updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'user-id': USER_ID
        },
        body: JSON.stringify(transformUpdateRequest(data))
    });
    if (!res.ok) throw new Error('Failed to update project');
    const result = await res.json();
    return transformProject(result.data);
}

export async function deleteProject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
        headers: {
            'user-id': USER_ID
        }
    });
    if (!res.ok) throw new Error('Failed to delete project');
} 
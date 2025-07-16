export interface Project {
    id: string;
    name: string;
    description: string;
    owner_id: string;
    status: 'active' | 'completed';
    knowledge_domain: string;
    settings: ProjectSettings;
    created_at: string;
    updated_at: string;
    decision_context?: string;
}

export interface ProjectSettings {
    default_llm: string;
    personas: string[];
    tools_enabled: string[];
}

export interface CreateProjectRequest {
    name: string;
    description: string;
    knowledge_domain: string;
    settings?: Partial<ProjectSettings>;
    decision_context?: string;
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    knowledge_domain?: string;
    status?: 'active' | 'completed';
    settings?: Partial<ProjectSettings>;
    decision_context?: string;
}

export interface ProjectListResponse {
    projects: Project[];
    total: number;
    page: number;
    limit: number;
} 
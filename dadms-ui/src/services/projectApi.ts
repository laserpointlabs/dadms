import { CreateProjectRequest, Project, ProjectListResponse, UpdateProjectRequest } from '../types/project';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';
const USER_ID = process.env.NEXT_PUBLIC_USER_ID || '0d6838ad-ae0e-4637-96cd-3c3271854da4';

export async function fetchProjects(): Promise<ProjectListResponse> {
    const res = await fetch(`${API_BASE}/projects`, {
        headers: { 'user-id': USER_ID }
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    const result = await res.json();
    return result.data; // Return the 'data' property which matches ProjectListResponse
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-id': USER_ID
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create project');
    const result = await res.json();
    return result.data;
}

export async function updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'user-id': USER_ID
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update project');
    const result = await res.json();
    return result.data;
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
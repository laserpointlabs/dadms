export interface Team {
    id: string;
    name: string;
    description?: string;
    persona_ids: string[]; // references to Persona IDs
}

export interface Persona {
    id: string;
    name: string;
    // Add more fields as needed (e.g., role, expertise, etc.)
}

export interface ContextTemplate {
    id: string;
    project_id: string;
    name: string;
    prompt_template: string;
    persona?: Persona; // existing single persona
    team_id?: string; // new: reference to a team
    tools_available: string[];
    knowledge_domains: string[];
} 
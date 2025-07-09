export interface Workflow {
    id: string;
    name: string;
    description: string;
    bpmn_xml: string;
    version: number;
    linked_prompts: string[];
    linked_tools: string[];
    annotations: Record<string, any>;
    created_by: string;
    created_at: string;
    updated_at: string;
    status: 'draft' | 'active' | 'archived';
}

export interface CreateWorkflowRequest {
    name: string;
    description: string;
    bpmn_xml: string;
    linked_prompts?: string[];
    linked_tools?: string[];
    annotations?: Record<string, any>;
}

export interface UpdateWorkflowRequest {
    name?: string;
    description?: string;
    bpmn_xml?: string;
    linked_prompts?: string[];
    linked_tools?: string[];
    annotations?: Record<string, any>;
    status?: 'draft' | 'active' | 'archived';
}

export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    started_at: string;
    completed_at?: string;
    input_data: Record<string, any>;
    output_data?: Record<string, any>;
    error?: string;
    execution_log: ExecutionStep[];
    created_by: string;
}

export interface ExecutionStep {
    step_id: string;
    step_name: string;
    step_type: 'prompt' | 'tool' | 'decision' | 'task';
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at?: string;
    completed_at?: string;
    input?: any;
    output?: any;
    error?: string;
    execution_time_ms?: number;
}

export interface ExecuteWorkflowRequest {
    workflow_id: string;
    input_data: Record<string, any>;
    timeout_ms?: number;
}

export interface ExecuteWorkflowResponse {
    execution_id: string;
    workflow_id: string;
    status: 'running' | 'completed' | 'failed';
    started_at: string;
    estimated_completion?: string;
} 
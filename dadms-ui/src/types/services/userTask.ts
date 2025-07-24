export interface UserTask {
    id: string;
    name: string;
    description?: string;
    processInstanceId: string;
    processDefinitionKey: string;
    processDefinitionName?: string;
    businessKey?: string;
    assignee?: string;
    created: string;
    due?: string;
    priority: number;
    formKey?: string;
    variables?: Record<string, any>;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

export interface TaskFilter {
    status: string;
    priority: string;
    assignee: string;
    processDefinition: string;
}

export interface TaskCounts {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    total: number;
}

export interface CompleteTaskRequest {
    taskId: string;
    variables?: Record<string, any>;
    comments?: string;
}

export interface ClaimTaskRequest {
    taskId: string;
    userId: string;
}

export interface UnclaimTaskRequest {
    taskId: string;
}

export interface UserTaskResponse {
    items: UserTask[];
    total: number;
    page: number;
    size: number;
}

export interface TaskCountsResponse {
    counts: TaskCounts;
}

export interface UserTaskApiError {
    message: string;
    code: string;
    details?: any;
} 
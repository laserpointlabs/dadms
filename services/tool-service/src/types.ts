export interface Tool {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    capabilities: string[];
    status: 'healthy' | 'unhealthy' | 'unknown';
    version: string;
    metadata: Record<string, any>;
    created_by: string;
    created_at: string;
    updated_at: string;
    last_health_check?: string;
}

export interface CreateToolRequest {
    name: string;
    description: string;
    endpoint: string;
    capabilities: string[];
    version: string;
    metadata?: Record<string, any>;
}

export interface UpdateToolRequest {
    name?: string;
    description?: string;
    endpoint?: string;
    capabilities?: string[];
    version?: string;
    metadata?: Record<string, any>;
}

export interface ToolInvocationRequest {
    action: string;
    parameters: Record<string, any>;
    timeout_ms?: number;
}

export interface ToolInvocationResponse {
    success: boolean;
    result?: any;
    error?: string;
    execution_time_ms: number;
    metadata?: Record<string, any>;
}

export interface HealthCheckResult {
    tool_id: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    response_time_ms: number;
    error?: string;
    timestamp: string;
} 
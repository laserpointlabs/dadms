export interface Agent {
    id: string;
    name: string;
    description: string;
    event_types: string[];
    enabled: boolean;
    config: Record<string, any>;
}

export interface AgentFinding {
    finding_id: string;
    event_id: string;
    entity_type: string;
    entity_id: string;
    agent_name: string;
    level: 'info' | 'suggestion' | 'warning' | 'error';
    message: string;
    suggested_action?: string;
    details?: any;
    timestamp: string;
    resolved: boolean;
    resolved_by?: string;
    resolved_at?: string;
}

export interface CreateFindingRequest {
    event_id: string;
    entity_type: string;
    entity_id: string;
    agent_name: string;
    level: 'info' | 'suggestion' | 'warning' | 'error';
    message: string;
    suggested_action?: string;
    details?: any;
}

export interface ResolveFindingRequest {
    resolved_by: string;
    resolution_notes?: string;
}

export interface AgentReviewRequest {
    event: any;
    agent_config?: Record<string, any>;
}

export interface AgentReviewResponse {
    findings: Omit<AgentFinding, 'finding_id' | 'timestamp' | 'resolved'>[];
    review_time_ms: number;
} 
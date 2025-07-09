export interface Event {
    event_id: string;
    event_type: string;
    timestamp: string;
    actor: string;
    entity: {
        type: string;
        id: string;
        version?: number;
        data: any;
    };
    context?: {
        workflow_id?: string;
        test_id?: string;
        session_id?: string;
        [key: string]: any;
    };
    source_service: string;
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

export interface EventBusConfig {
    host: string;
    port: number;
    timeout?: number;
    retries?: number;
}

export interface EventSubscriber {
    service_name: string;
    event_types: string[];
    endpoint: string;
    enabled: boolean;
}

export interface EventBusResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
} 
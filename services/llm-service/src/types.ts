// Core LLM Request and Response Types
export interface LLMRequest {
    // Basic request parameters
    prompt: string;
    system_prompt?: string;
    max_tokens?: number;
    temperature?: number;

    // Advanced context management
    persona_config?: PersonaConfig;
    context_bundle?: ContextBundle;
    conversation_id?: string;

    // Model selection and routing
    model_preference: ModelPreference;
    fallback_strategy?: string[];
    cost_budget?: number;

    // Response requirements
    response_format?: 'text' | 'json' | 'structured';
    quality_requirements?: QualityMetrics;
}

export interface ModelPreference {
    primary: 'local' | 'openai' | 'anthropic' | 'auto';
    models?: string[]; // Specific model names
    cost_priority?: 'lowest' | 'balanced' | 'quality';
    latency_requirement?: 'realtime' | 'standard' | 'batch';
}

export interface LLMResponse {
    content: string;
    model_used: string;
    provider: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        cost_estimate: number;
    };
    performance: {
        response_time_ms: number;
        quality_score?: number;
    };
    metadata: {
        conversation_id?: string;
        fallback_used: boolean;
        cache_hit: boolean;
        request_id: string;
    };
}

// Persona and Context Types
export interface PersonaConfig {
    persona_id: string;
    expertise_areas: string[];
    communication_style: string;
    behavior_guidelines: string[];
}

export interface ContextBundle {
    prompt_context?: any;
    persona_context?: any;
    tool_context?: any;
    workflow_context?: any;
    conversation_history?: ConversationMessage[];
}

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export interface QualityMetrics {
    min_quality_score?: number;
    consistency_required?: boolean;
    factual_accuracy?: boolean;
}

// Provider Interfaces
export interface LLMProvider {
    name: string;
    isAvailable(): Promise<boolean>;
    getSupportedModels(): Promise<Model[]>;
    complete(request: ProviderRequest): Promise<ProviderResponse>;
    estimateCost(request: ProviderRequest): number;
}

export interface Model {
    id: string;
    name: string;
    provider: string;
    max_tokens: number;
    cost_per_token: number;
    capabilities: string[];
}

export interface ProviderRequest {
    prompt: string;
    system_prompt?: string;
    model: string;
    temperature?: number;
    max_tokens?: number;
    conversation_id?: string;
}

export interface ProviderResponse {
    content: string;
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    finish_reason: string;
    response_time_ms: number;
}

// Service Configuration
export interface LLMServiceConfig {
    port: number;
    redis_url?: string;
    enable_caching: boolean;
    cache_ttl_seconds: number;
    providers: ProviderConfig[];
    rate_limits: RateLimitConfig;
}

export interface ProviderConfig {
    name: string;
    enabled: boolean;
    api_key?: string;
    base_url?: string;
    timeout_ms: number;
    max_retries: number;
}

export interface RateLimitConfig {
    requests_per_minute: number;
    requests_per_hour: number;
    cost_limit_per_hour: number;
}

// Error Types
export class LLMServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public provider?: string,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'LLMServiceError';
    }
}

export class ProviderError extends LLMServiceError {
    constructor(message: string, provider: string, retryable: boolean = true) {
        super(message, 'PROVIDER_ERROR', provider, retryable);
    }
}

export class RateLimitError extends LLMServiceError {
    constructor(provider: string) {
        super(`Rate limit exceeded for provider: ${provider}`, 'RATE_LIMIT', provider, true);
    }
}

export class ModelNotFoundError extends LLMServiceError {
    constructor(model: string, provider: string) {
        super(`Model ${model} not found in provider ${provider}`, 'MODEL_NOT_FOUND', provider, false);
    }
}

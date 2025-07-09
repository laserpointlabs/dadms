export interface Prompt {
    id: string;
    version: number;
    text: string;
    type: 'simple' | 'tool-aware' | 'workflow-aware';
    test_cases: TestCase[];
    tool_dependencies?: string[];
    workflow_dependencies?: string[];
    tags: string[];
    created_by: string;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, any>;
}

export interface TestCase {
    id: string;
    name: string;
    input: any;
    expected_output: any;
    scoring_logic?: string;
    enabled: boolean;
}

export interface CreatePromptRequest {
    text: string;
    type: 'simple' | 'tool-aware' | 'workflow-aware';
    test_cases?: Omit<TestCase, 'id'>[];
    tool_dependencies?: string[];
    workflow_dependencies?: string[];
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface UpdatePromptRequest {
    text?: string;
    type?: 'simple' | 'tool-aware' | 'workflow-aware';
    test_cases?: Omit<TestCase, 'id'>[];
    tool_dependencies?: string[];
    workflow_dependencies?: string[];
    tags?: string[];
    metadata?: Record<string, any>;
}

// LLM Provider Types
export type LLMProvider = 'openai' | 'anthropic' | 'local' | 'mock';

export interface LLMConfig {
    provider: LLMProvider;
    model: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}

export interface LLMResponse {
    provider: LLMProvider;
    model: string;
    content: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    finish_reason?: string;
    response_time_ms: number;
}

export interface PromptTestResult {
    test_case_id: string;
    test_case_name: string;
    passed: boolean;
    actual_output?: any;
    llm_response?: LLMResponse;
    expected_output?: any;
    comparison_score?: number;
    error?: string;
    execution_time_ms: number;
}

export interface TestPromptRequest {
    prompt_id?: string;
    test_case_ids?: string[];
    input_override?: Record<string, any>;
    llm_configs?: LLMConfig[];
    enable_comparison?: boolean;
    custom_prompt_text?: string;
}

export interface TestPromptResponse {
    prompt_id: string;
    prompt_text: string;
    results: PromptTestResult[];
    llm_comparisons?: {
        [provider_model: string]: LLMResponse[];
    };
    summary: {
        total: number;
        passed: number;
        failed: number;
        execution_time_ms: number;
        avg_comparison_score?: number;
    };
}

// Available LLM Models
export const AVAILABLE_LLMS: Record<LLMProvider, string[]> = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    local: ['ollama/llama2', 'ollama/mistral', 'ollama/codellama'],
    mock: ['mock-gpt', 'mock-claude']
}; 
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

export interface PromptTestResult {
    test_case_id: string;
    passed: boolean;
    actual_output?: any;
    error?: string;
    execution_time_ms: number;
}

export interface TestPromptRequest {
    prompt_id: string;
    test_case_ids?: string[];
    input_override?: Record<string, any>;
}

export interface TestPromptResponse {
    prompt_id: string;
    results: PromptTestResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        execution_time_ms: number;
    };
} 
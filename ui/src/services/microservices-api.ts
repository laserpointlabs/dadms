import axios, { AxiosResponse } from 'axios';

// Microservices API configuration
const MICROSERVICES_BASE_URL = process.env.REACT_APP_MICROSERVICES_BASE_URL || 'http://localhost';
const PROMPT_SERVICE_PORT = process.env.REACT_APP_PROMPT_SERVICE_PORT || '3001';
const TOOL_SERVICE_PORT = process.env.REACT_APP_TOOL_SERVICE_PORT || '3002';
const WORKFLOW_SERVICE_PORT = process.env.REACT_APP_WORKFLOW_SERVICE_PORT || '3003';
const AI_OVERSIGHT_SERVICE_PORT = process.env.REACT_APP_AI_OVERSIGHT_SERVICE_PORT || '3004';

// Create service-specific axios instances
const createServiceApi = (port: string) => {
    const api = axios.create({
        baseURL: `${MICROSERVICES_BASE_URL}:${port}`,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor to add user ID
    api.interceptors.request.use(
        (config) => {
            const userId = localStorage.getItem('user_id') || 'default-user';
            config.headers['x-user-id'] = userId;
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            console.error(`API Error (${port}):`, error);
            return Promise.reject(error);
        }
    );

    return api;
};

const promptApi = createServiceApi(PROMPT_SERVICE_PORT);
const toolApi = createServiceApi(TOOL_SERVICE_PORT);
const workflowApi = createServiceApi(WORKFLOW_SERVICE_PORT);
const aiOversightApi = createServiceApi(AI_OVERSIGHT_SERVICE_PORT);

// Types
export interface Prompt {
    id: string;
    name: string;
    version: number;
    text: string;
    type: 'simple' | 'tool-aware' | 'workflow-aware';
    test_cases: TestCase[];
    tool_dependencies: string[];
    workflow_dependencies: string[];
    tags: string[];
    created_by: string;
    created_at: string;
    updated_at: string;
    metadata: any;
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
    name: string;
    text: string;
    type: 'simple' | 'tool-aware' | 'workflow-aware';
    test_cases?: Omit<TestCase, 'id'>[];
    tool_dependencies?: string[];
    workflow_dependencies?: string[];
    tags?: string[];
    metadata?: any;
}

// LLM Types
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

export interface TestResult {
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

export interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    execution_time_ms: number;
    avg_comparison_score?: number;
}

export interface TestPromptRequest {
    test_case_ids?: string[];
    input_override?: any;
    llm_configs?: LLMConfig[];
    enable_comparison?: boolean;
}

export interface TestPromptResponse {
    prompt_id: string;
    prompt_text: string;
    results: TestResult[];
    llm_comparisons?: { [provider_model: string]: LLMResponse[] };
    summary: TestSummary;
}

export interface AvailableLLMs {
    [provider: string]: string[];
}

export interface LLMConfigStatus {
    [provider: string]: {
        configured: boolean;
        source: string;
        models: string[];
    };
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    capabilities: string[];
    status: 'healthy' | 'unhealthy' | 'unknown';
    version: string;
    metadata: any;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreateToolRequest {
    name: string;
    description: string;
    endpoint: string;
    capabilities: string[];
    version: string;
    metadata?: any;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    bpmn_xml: string;
    version: number;
    linked_prompts: string[];
    linked_tools: string[];
    annotations: any;
    created_by: string;
    created_at: string;
    updated_at: string;
    status: 'draft' | 'active' | 'inactive';
}

export interface CreateWorkflowRequest {
    name: string;
    description: string;
    bpmn_xml: string;
    linked_prompts?: string[];
    linked_tools?: string[];
    annotations?: any;
}

export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    execution_id: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    input_data: any;
    output_data?: any;
    error_message?: string;
    started_at: string;
    completed_at?: string;
    steps: ExecutionStep[];
}

export interface ExecutionStep {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    input_data: any;
    output_data?: any;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    event_types: string[];
    enabled: boolean;
    config: any;
}

export interface Finding {
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
}

// Prompt Service
export const promptService = {
    // Get all prompts
    getPrompts: async (): Promise<AxiosResponse<{ success: boolean; data: Prompt[] }>> => {
        return promptApi.get('/prompts');
    },

    // Get prompt by ID
    getPrompt: async (id: string): Promise<AxiosResponse<{ success: boolean; data: Prompt }>> => {
        return promptApi.get(`/prompts/${id}`);
    },

    // Create new prompt
    createPrompt: async (prompt: CreatePromptRequest): Promise<AxiosResponse<{ success: boolean; data: Prompt }>> => {
        return promptApi.post('/prompts', prompt);
    },

    // Update prompt
    updatePrompt: async (id: string, prompt: Partial<CreatePromptRequest>): Promise<AxiosResponse<{ success: boolean; data: Prompt }>> => {
        return promptApi.put(`/prompts/${id}`, prompt);
    },

    // Delete prompt
    deletePrompt: async (id: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return promptApi.delete(`/prompts/${id}`);
    },

    // Delete specific version of a prompt
    deletePromptVersion: async (id: string, version: number): Promise<AxiosResponse<void>> => {
        return promptApi.delete(`/prompts/${id}/version/${version}`);
    },

    // Delete all versions of a prompt
    deleteAllPromptVersions: async (id: string): Promise<AxiosResponse<void>> => {
        return promptApi.delete(`/prompts/${id}/all-versions`);
    },

    // Test prompt with LLM
    testPrompt: async (id: string, testData?: TestPromptRequest): Promise<AxiosResponse<{ success: boolean; data: TestPromptResponse }>> => {
        return promptApi.post(`/prompts/${id}/test`, testData || {});
    },

    // Get saved test results for a prompt
    getTestResults: async (id: string, version?: number): Promise<AxiosResponse<{ success: boolean; data: TestPromptResponse }>> => {
        const params = version ? { version } : {};
        return promptApi.get(`/prompts/${id}/test-results`, { params });
    },

    // Get test execution history for a prompt
    getTestHistory: async (id: string): Promise<AxiosResponse<{
        success: boolean; data: Array<{
            execution_id: string;
            prompt_version: number;
            created_at: string;
            total_tests: number;
            passed_tests: number;
            failed_tests: number;
            avg_comparison_score?: number;
        }>
    }>> => {
        return promptApi.get(`/prompts/${id}/test-history`);
    },

    // Delete test results for a prompt
    deleteTestResults: async (id: string, version?: number): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        const params = version ? { version } : {};
        return promptApi.delete(`/prompts/${id}/test-results`, { params });
    },

    // Get all versions of a prompt
    getPromptVersions: async (id: string): Promise<AxiosResponse<{
        success: boolean; data: Array<{
            version: number;
            created_at: string;
            updated_at: string;
            text: string;
            type: string;
            tags: string[];
        }>
    }>> => {
        return promptApi.get(`/prompts/${id}/versions`);
    },

    // Get a specific version of a prompt
    getPromptByVersion: async (id: string, version: number): Promise<AxiosResponse<{ success: boolean; data: Prompt }>> => {
        return promptApi.get(`/prompts/${id}/version/${version}`);
    },

    // Update a specific version of a prompt
    updatePromptVersion: async (id: string, version: number, prompt: Partial<Prompt>): Promise<AxiosResponse<{ success: boolean; data: Prompt }>> => {
        return promptApi.put(`/prompts/${id}/version/${version}`, prompt);
    },

    // Get available LLMs
    getAvailableLLMs: async (): Promise<AxiosResponse<{ success: boolean; data: AvailableLLMs }>> => {
        return promptApi.get('/llms/available');
    },

    // Get LLM configuration status
    getLLMConfigStatus: async (): Promise<AxiosResponse<{ success: boolean; data: LLMConfigStatus }>> => {
        return promptApi.get('/llms/config-status');
    },

    // Save test configuration (LLM configs and test case selections)
    saveTestConfig: async (promptId: string, version: number, llmConfigs: LLMConfig[], testCaseIds: string[]): Promise<AxiosResponse<{ status: string; message: string }>> => {
        return promptApi.post(`/prompts/${promptId}/test-config`, {
            version,
            llm_configs: llmConfigs,
            test_case_ids: testCaseIds
        });
    },

    // Get test configuration (LLM configs and test case selections)
    getTestConfig: async (promptId: string, version: number): Promise<AxiosResponse<{ status: string; data: { llm_configs: LLMConfig[]; test_case_ids: string[] } }>> => {
        return promptApi.get(`/prompts/${promptId}/test-config`, { params: { version } });
    },
};

// Tool Service
export const toolService = {
    // Get all tools
    getTools: async (): Promise<AxiosResponse<{ success: boolean; data: Tool[] }>> => {
        return toolApi.get('/tools');
    },

    // Get tool by ID
    getTool: async (id: string): Promise<AxiosResponse<{ success: boolean; data: Tool }>> => {
        return toolApi.get(`/tools/${id}`);
    },

    // Register new tool
    registerTool: async (tool: CreateToolRequest): Promise<AxiosResponse<{ success: boolean; data: Tool }>> => {
        return toolApi.post('/tools', tool);
    },

    // Update tool
    updateTool: async (id: string, tool: Partial<CreateToolRequest>): Promise<AxiosResponse<{ success: boolean; data: Tool }>> => {
        return toolApi.put(`/tools/${id}`, tool);
    },

    // Delete tool
    deleteTool: async (id: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return toolApi.delete(`/tools/${id}`);
    },

    // Invoke tool
    invokeTool: async (id: string, input: any): Promise<AxiosResponse<{ success: boolean; data: any }>> => {
        return toolApi.post(`/tools/${id}/invoke`, { input });
    },

    // Health check tool
    healthCheckTool: async (id: string): Promise<AxiosResponse<{ success: boolean; data: any }>> => {
        return toolApi.post(`/tools/${id}/health-check`);
    },
};

// Workflow Service
export const workflowService = {
    // Get all workflows
    getWorkflows: async (): Promise<AxiosResponse<{ success: boolean; data: Workflow[] }>> => {
        return workflowApi.get('/workflows');
    },

    // Get workflow by ID
    getWorkflow: async (id: string): Promise<AxiosResponse<{ success: boolean; data: Workflow }>> => {
        return workflowApi.get(`/workflows/${id}`);
    },

    // Create new workflow
    createWorkflow: async (workflow: CreateWorkflowRequest): Promise<AxiosResponse<{ success: boolean; data: Workflow }>> => {
        return workflowApi.post('/workflows', workflow);
    },

    // Update workflow
    updateWorkflow: async (id: string, workflow: Partial<CreateWorkflowRequest>): Promise<AxiosResponse<{ success: boolean; data: Workflow }>> => {
        return workflowApi.put(`/workflows/${id}`, workflow);
    },

    // Delete workflow
    deleteWorkflow: async (id: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return workflowApi.delete(`/workflows/${id}`);
    },

    // Execute workflow
    executeWorkflow: async (id: string, input: any): Promise<AxiosResponse<{ success: boolean; data: WorkflowExecution }>> => {
        return workflowApi.post(`/workflows/${id}/execute`, input);
    },

    // Get execution status
    getExecution: async (id: string): Promise<AxiosResponse<{ success: boolean; data: WorkflowExecution }>> => {
        return workflowApi.get(`/executions/${id}`);
    },

    // Get workflow executions
    getWorkflowExecutions: async (workflowId: string): Promise<AxiosResponse<{ success: boolean; data: WorkflowExecution[] }>> => {
        return workflowApi.get(`/workflows/${workflowId}/executions`);
    },
};

// AI Oversight Service
export const aiOversightService = {
    // Get all agents
    getAgents: async (): Promise<AxiosResponse<{ success: boolean; data: Agent[] }>> => {
        return aiOversightApi.get('/ai-review/agents');
    },

    // Enable/disable agent
    enableAgent: async (id: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return aiOversightApi.post(`/ai-review/agents/${id}/enable`);
    },

    disableAgent: async (id: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return aiOversightApi.post(`/ai-review/agents/${id}/disable`);
    },

    // Get findings
    getFindings: async (filters?: {
        entity_type?: string;
        entity_id?: string;
        level?: string;
        resolved?: boolean;
        agent_name?: string;
        since?: string;
        limit?: number;
    }): Promise<AxiosResponse<{ success: boolean; data: Finding[] }>> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, value.toString());
                }
            });
        }
        return aiOversightApi.get(`/ai-review/findings${params.toString() ? `?${params.toString()}` : ''}`);
    },

    // Resolve finding
    resolveFinding: async (id: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return aiOversightApi.post(`/ai-review/findings/${id}/resolve`);
    },

    // Submit event for review (internal use)
    submitEvent: async (event: any): Promise<AxiosResponse<{ success: boolean; data: Finding[] }>> => {
        return aiOversightApi.post('/ai-review/events', event);
    },
};

// Health check service for all microservices
export const healthService = {
    checkAllServices: async (): Promise<{ [key: string]: { healthy: boolean; response?: any; error?: string } }> => {
        const services = {
            prompt: promptApi,
            tool: toolApi,
            workflow: workflowApi,
            aiOversight: aiOversightApi,
        };

        const results: { [key: string]: { healthy: boolean; response?: any; error?: string } } = {};

        await Promise.all(
            Object.entries(services).map(async ([name, api]) => {
                try {
                    const response = await api.get('/health');
                    results[name] = {
                        healthy: response.data.status === 'healthy',
                        response: response.data,
                    };
                } catch (error) {
                    results[name] = {
                        healthy: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            })
        );

        return results;
    },
};

const microservicesApi = {
    promptService,
    toolService,
    workflowService,
    aiOversightService,
    healthService,
};

export default microservicesApi; 
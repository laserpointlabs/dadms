import axios, { AxiosInstance } from 'axios';

export interface LLMClientRequest {
    prompt: string;
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
    model_preference?: {
        primary?: 'local' | 'openai' | 'anthropic' | 'auto';
        models?: string[];
        cost_priority?: 'lowest' | 'balanced' | 'quality';
    };
    conversation_id?: string;
    persona_config?: {
        persona_id: string;
        expertise_areas: string[];
        communication_style: string;
    };
}

export interface LLMClientResponse {
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

export class LLMClient {
    private client: AxiosInstance;
    private baseURL: string;

    constructor(baseURL: string = 'http://localhost:3006') {
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL,
            timeout: 60000, // 60 second timeout for LLM requests
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async complete(request: LLMClientRequest): Promise<LLMClientResponse> {
        try {
            const response = await this.client.post('/v1/complete', request);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new Error(`LLM Service error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
            } else if (error.request) {
                throw new Error('LLM Service unavailable - no response received');
            } else {
                throw new Error(`LLM Client error: ${error.message}`);
            }
        }
    }

    async getProviderStatus(): Promise<any> {
        try {
            const response = await this.client.get('/providers/status');
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get provider status: ${error.message}`);
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    // OpenAI compatibility method for gradual migration
    async createChatCompletion(messages: any[], options: any = {}): Promise<any> {
        try {
            const response = await this.client.post('/v1/chat/completions', {
                messages,
                model: options.model || 'gpt-3.5-turbo',
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 1000
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`OpenAI compatibility error: ${error.response?.data?.error?.message || error.message}`);
        }
    }
}

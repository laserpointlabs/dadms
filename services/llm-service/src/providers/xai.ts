import axios, { AxiosInstance } from 'axios';
import { ProviderConfig } from '../config/providers';
import { LLMProvider, LLMServiceError, Model, ProviderRequest, ProviderResponse } from '../types';

export class XAIProvider implements LLMProvider {
    public readonly name = 'xai';
    private client: AxiosInstance;
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;

        if (!config.apiKey) {
            throw new Error('xAI API key is required');
        }

        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            }
        });
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Test with a minimal request to validate API key
            const response = await this.client.post('/chat/completions', {
                model: 'grok-beta',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'Hi' }]
            });
            return response.status === 200;
        } catch (error: any) {
            console.warn('xAI provider unavailable:', error.response?.status || error.message);
            return false;
        }
    }

    async getSupportedModels(): Promise<Model[]> {
        return this.config.defaultModels.map(modelId => ({
            id: modelId,
            name: modelId,
            provider: 'xai',
            max_tokens: 131072, // Grok's context window
            cost_per_token: 0.000002, // Estimated cost
            capabilities: ['text', 'reasoning', 'realtime']
        }));
    }

    async complete(request: ProviderRequest): Promise<ProviderResponse> {
        try {
            const messages: any[] = [];

            if (request.system_prompt) {
                messages.push({
                    role: 'system',
                    content: request.system_prompt
                });
            }

            messages.push({
                role: 'user',
                content: request.prompt
            });

            const xaiRequest = {
                model: request.model,
                max_tokens: request.max_tokens || 1000,
                temperature: request.temperature || 0.7,
                messages
            };

            const startTime = Date.now();
            const response = await this.client.post('/chat/completions', xaiRequest);
            const responseTime = Date.now() - startTime;

            if (!response.data.choices || response.data.choices.length === 0) {
                throw new Error('Empty response from xAI');
            }

            const choice = response.data.choices[0];
            const usage = response.data.usage || {};

            return {
                content: choice.message.content,
                model: request.model,
                usage: {
                    prompt_tokens: usage.prompt_tokens || 0,
                    completion_tokens: usage.completion_tokens || 0,
                    total_tokens: usage.total_tokens || 0
                },
                finish_reason: choice.finish_reason || 'stop',
                response_time_ms: responseTime
            };
        } catch (error: any) {
            if (error.response) {
                throw new LLMServiceError(
                    `xAI API error: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`,
                    'XAI_API_ERROR',
                    error.response.status
                );
            } else if (error.request) {
                throw new LLMServiceError(
                    'xAI API unavailable - no response received',
                    'XAI_UNAVAILABLE'
                );
            } else {
                throw new LLMServiceError(
                    `xAI client error: ${error.message}`,
                    'XAI_CLIENT_ERROR'
                );
            }
        }
    }

    estimateCost(request: ProviderRequest): number {
        // Rough estimation: ~4 characters per token
        const estimatedInputTokens = Math.ceil((request.prompt.length + (request.system_prompt?.length || 0)) / 4);
        const estimatedOutputTokens = request.max_tokens || 1000;

        // xAI pricing (estimated, adjust as needed)
        const pricePerInputToken = 0.000002; // $2 per 1M tokens
        const pricePerOutputToken = 0.000002; // Same for output

        return (estimatedInputTokens * pricePerInputToken) + (estimatedOutputTokens * pricePerOutputToken);
    }
}

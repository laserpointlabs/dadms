import axios, { AxiosInstance } from 'axios';
import { ProviderConfig } from '../config/providers';
import { LLMProvider, LLMServiceError, Model, ProviderRequest, ProviderResponse } from '../types';

export class AnthropicProvider implements LLMProvider {
    public readonly name = 'anthropic';
    private client: AxiosInstance;
    private config: ProviderConfig;

    constructor(config: ProviderConfig) {
        this.config = config;

        if (!config.apiKey) {
            throw new Error('Anthropic API key is required');
        }

        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            }
        });
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Test with a minimal request to validate API key
            const response = await this.client.post('/v1/messages', {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'Hi' }]
            });
            return response.status === 200;
        } catch (error: any) {
            console.warn('Anthropic provider unavailable:', error.response?.status || error.message);
            return false;
        }
    }

    async getSupportedModels(): Promise<Model[]> {
        return this.config.defaultModels.map(modelId => ({
            id: modelId,
            name: modelId,
            provider: 'anthropic',
            max_tokens: 200000, // Claude's context window
            cost_per_token: 0.000003, // Average cost
            capabilities: ['text', 'reasoning', 'analysis']
        }));
    }

    async complete(request: ProviderRequest): Promise<ProviderResponse> {
        try {
            const anthropicRequest = {
                model: request.model,
                max_tokens: request.max_tokens || 1000,
                temperature: request.temperature || 0.7,
                messages: [
                    {
                        role: 'user',
                        content: request.prompt
                    }
                ]
            };

            if (request.system_prompt) {
                anthropicRequest.messages.unshift({
                    role: 'system',
                    content: request.system_prompt
                } as any);
            }

            const startTime = Date.now();
            const response = await this.client.post('/v1/messages', anthropicRequest);
            const responseTime = Date.now() - startTime;

            if (!response.data.content || response.data.content.length === 0) {
                throw new Error('Empty response from Anthropic');
            }

            const content = response.data.content[0].text;
            const usage = response.data.usage || {};

            return {
                content,
                model: request.model,
                usage: {
                    prompt_tokens: usage.input_tokens || 0,
                    completion_tokens: usage.output_tokens || 0,
                    total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0)
                },
                finish_reason: response.data.stop_reason || 'stop',
                response_time_ms: responseTime
            };
        } catch (error: any) {
            if (error.response) {
                throw new LLMServiceError(
                    `Anthropic API error: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`,
                    'ANTHROPIC_API_ERROR',
                    error.response.status
                );
            } else if (error.request) {
                throw new LLMServiceError(
                    'Anthropic API unavailable - no response received',
                    'ANTHROPIC_UNAVAILABLE'
                );
            } else {
                throw new LLMServiceError(
                    `Anthropic client error: ${error.message}`,
                    'ANTHROPIC_CLIENT_ERROR'
                );
            }
        }
    }

    estimateCost(request: ProviderRequest): number {
        // Rough estimation: ~4 characters per token
        const estimatedInputTokens = Math.ceil((request.prompt.length + (request.system_prompt?.length || 0)) / 4);
        const estimatedOutputTokens = request.max_tokens || 1000;

        // Anthropic pricing (as of 2024)
        const pricing: Record<string, { input: number; output: number }> = {
            'claude-3-opus-20240229': { input: 0.000015, output: 0.000075 },
            'claude-3-sonnet-20240229': { input: 0.000003, output: 0.000015 },
            'claude-3-haiku-20240307': { input: 0.00000025, output: 0.00000125 },
            'claude-3-5-sonnet-20241022': { input: 0.000003, output: 0.000015 },
            'claude-3-5-haiku-20241022': { input: 0.000001, output: 0.000005 }
        };

        const modelPricing = pricing[request.model] || pricing['claude-3-haiku-20240307']; // fallback to cheapest
        return (estimatedInputTokens * modelPricing.input) + (estimatedOutputTokens * modelPricing.output);
    }
}

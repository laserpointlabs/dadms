import OpenAI from 'openai';
import { ProviderConfig } from '../config/providers';
import { LLMProvider, Model, ProviderError, ProviderRequest, ProviderResponse } from '../types';

export class OpenAIProvider implements LLMProvider {
    public readonly name = 'openai';
    private client: OpenAI;
    private config: ProviderConfig;
    private models: Model[] = [];

    constructor(config: ProviderConfig) {
        this.config = config;

        if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
        }

        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
            organization: config.organization
        });
    }

    async isAvailable(): Promise<boolean> {
        try {
            await this.client.models.list();
            return true;
        } catch (error) {
            console.error('OpenAI provider unavailable:', error);
            return false;
        }
    }

    async getSupportedModels(): Promise<Model[]> {
        if (this.models.length > 0) {
            return this.models;
        }

        try {
            const response = await this.client.models.list();
            this.models = response.data
                .filter(model => model.id.includes('gpt'))
                .map(model => ({
                    id: model.id,
                    name: model.id,
                    provider: 'openai',
                    max_tokens: this.getMaxTokens(model.id),
                    cost_per_token: this.getCostPerToken(model.id),
                    capabilities: ['chat', 'completion']
                }));

            return this.models;
        } catch (error) {
            throw new ProviderError(`Failed to get OpenAI models: ${error}`, 'openai');
        }
    }

    async complete(request: ProviderRequest): Promise<ProviderResponse> {
        const startTime = Date.now();

        try {
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

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

            const response = await this.client.chat.completions.create({
                model: request.model || 'gpt-3.5-turbo',
                messages,
                temperature: request.temperature || 0.7,
                max_tokens: request.max_tokens || 1000
            });

            const responseTime = Date.now() - startTime;
            const choice = response.choices[0];

            if (!choice || !choice.message) {
                throw new ProviderError('No response from OpenAI', 'openai');
            }

            return {
                content: choice.message.content || '',
                model: response.model,
                usage: {
                    prompt_tokens: response.usage?.prompt_tokens || 0,
                    completion_tokens: response.usage?.completion_tokens || 0,
                    total_tokens: response.usage?.total_tokens || 0
                },
                finish_reason: choice.finish_reason || 'unknown',
                response_time_ms: responseTime
            };

        } catch (error: any) {
            if (error instanceof OpenAI.APIError) {
                throw new ProviderError(
                    `OpenAI API error: ${error.message}`,
                    'openai',
                    error.status === 429 || error.status >= 500
                );
            }
            throw new ProviderError(`OpenAI request failed: ${error.message}`, 'openai');
        }
    }

    estimateCost(request: ProviderRequest): number {
        const model = request.model || 'gpt-3.5-turbo';
        const estimatedPromptTokens = Math.ceil(request.prompt.length / 4);
        const estimatedCompletionTokens = request.max_tokens || 1000;

        const costPerToken = this.getCostPerToken(model);
        return (estimatedPromptTokens + estimatedCompletionTokens) * costPerToken;
    }

    private getMaxTokens(modelId: string): number {
        if (modelId.includes('gpt-4')) {
            return modelId.includes('32k') ? 32768 : 8192;
        }
        if (modelId.includes('gpt-3.5-turbo')) {
            return modelId.includes('16k') ? 16384 : 4096;
        }
        return 4096;
    }

    private getCostPerToken(modelId: string): number {
        // Simplified cost estimation (in USD per token)
        if (modelId.includes('gpt-4')) {
            return 0.00003; // ~$0.03 per 1K tokens
        }
        if (modelId.includes('gpt-3.5-turbo')) {
            return 0.000002; // ~$0.002 per 1K tokens
        }
        return 0.000002;
    }
}

import axios from 'axios';
import { ProviderConfig } from '../config/providers';
import { LLMProvider, Model, ProviderError, ProviderRequest, ProviderResponse } from '../types';

export class OllamaProvider implements LLMProvider {
    public readonly name = 'local';
    private config: ProviderConfig;
    private models: Model[] = [];

    constructor(config: ProviderConfig) {
        this.config = config;
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.config.baseUrl}/api/tags`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            console.error('Ollama provider unavailable:', error);
            return false;
        }
    }

    async getSupportedModels(): Promise<Model[]> {
        if (this.models.length > 0) {
            return this.models;
        }

        try {
            const response = await axios.get(`${this.config.baseUrl}/api/tags`);
            this.models = response.data.models.map((model: any) => ({
                id: model.name,
                name: model.name,
                provider: 'ollama',
                max_tokens: 4096, // Default for most Ollama models
                cost_per_token: 0, // Local models are free
                capabilities: ['chat', 'completion']
            }));

            return this.models;
        } catch (error) {
            throw new ProviderError(`Failed to get Ollama models: ${error}`, 'ollama');
        }
    }

    async complete(request: ProviderRequest): Promise<ProviderResponse> {
        const startTime = Date.now();

        try {
            const prompt = request.system_prompt
                ? `${request.system_prompt}\n\nUser: ${request.prompt}\nAssistant:`
                : request.prompt;

            const response = await axios.post(`${this.config.baseUrl}/api/generate`, {
                model: request.model || 'llama2',
                prompt,
                stream: false,
                options: {
                    temperature: request.temperature || 0.7,
                    num_predict: request.max_tokens || 1000
                }
            });

            const responseTime = Date.now() - startTime;

            if (!response.data || !response.data.response) {
                throw new ProviderError('No response from Ollama', 'ollama');
            }

            // Estimate token usage (Ollama doesn't provide exact counts)
            const promptTokens = Math.ceil(prompt.length / 4);
            const completionTokens = Math.ceil(response.data.response.length / 4);

            return {
                content: response.data.response,
                model: request.model || 'llama2',
                usage: {
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens,
                    total_tokens: promptTokens + completionTokens
                },
                finish_reason: response.data.done ? 'stop' : 'length',
                response_time_ms: responseTime
            };

        } catch (error: any) {
            if (error.response) {
                throw new ProviderError(
                    `Ollama API error: ${error.response.status} - ${error.response.data}`,
                    'ollama',
                    error.response.status >= 500
                );
            }
            throw new ProviderError(`Ollama request failed: ${error.message}`, 'ollama');
        }
    }

    estimateCost(request: ProviderRequest): number {
        // Local models are free
        return 0;
    }
}

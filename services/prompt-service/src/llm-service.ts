import axios from 'axios';
import { LLMConfig, LLMProvider, LLMResponse } from './types';

export class LLMService {
    private static instance: LLMService;

    public static getInstance(): LLMService {
        if (!LLMService.instance) {
            LLMService.instance = new LLMService();
        }
        return LLMService.instance;
    }

    async callLLM(prompt: string, variables: Record<string, any>, config: LLMConfig): Promise<LLMResponse> {
        const startTime = Date.now();

        try {
            // Replace variables in prompt
            let processedPrompt = prompt;
            Object.entries(variables).forEach(([key, value]) => {
                const placeholder = `{${key}}`;
                processedPrompt = processedPrompt.replace(new RegExp(placeholder, 'g'), String(value));
            });

            // Get API key from environment variables first, then from config
            const envApiKey = this.getApiKeyFromEnv(config.provider);
            const apiKey = envApiKey || config.apiKey;

            // Create config with environment API key if available
            const effectiveConfig = {
                ...config,
                apiKey: apiKey
            };

            switch (config.provider) {
                case 'openai':
                    return await this.callOpenAI(processedPrompt, effectiveConfig, startTime);
                case 'anthropic':
                    return await this.callAnthropic(processedPrompt, effectiveConfig, startTime);
                case 'local':
                    return await this.callLocal(processedPrompt, effectiveConfig, startTime);
                case 'mock':
                    return await this.callMock(processedPrompt, effectiveConfig, startTime);
                default:
                    throw new Error(`Unsupported LLM provider: ${config.provider}`);
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            throw {
                provider: config.provider,
                model: config.model,
                error: error instanceof Error ? error.message : 'Unknown error',
                response_time_ms: responseTime
            };
        }
    }

    /**
     * Get API key from environment variables based on provider
     * Following the same pattern as the openai-service
     */
    private getApiKeyFromEnv(provider: LLMProvider): string | undefined {
        switch (provider) {
            case 'openai':
                return process.env.OPENAI_API_KEY;
            case 'anthropic':
                return process.env.ANTHROPIC_API_KEY;
            case 'local':
                // For local models like Ollama, no API key typically needed
                return undefined;
            case 'mock':
                // Mock doesn't need real API keys
                return undefined;
            default:
                return undefined;
        }
    }

    /**
     * Check if API key is available for a provider (either from env or config)
     */
    public isProviderConfigured(provider: LLMProvider, config?: LLMConfig): boolean {
        const envApiKey = this.getApiKeyFromEnv(provider);
        const configApiKey = config?.apiKey;

        switch (provider) {
            case 'openai':
            case 'anthropic':
                return !!(envApiKey || configApiKey);
            case 'local':
            case 'mock':
                // These don't require API keys
                return true;
            default:
                return false;
        }
    }

    private async callOpenAI(prompt: string, config: LLMConfig, startTime: number): Promise<LLMResponse> {
        if (!config.apiKey) {
            throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable or provide apiKey in config.');
        }

        const response = await axios.post(
            config.baseUrl || 'https://api.openai.com/v1/chat/completions',
            {
                model: config.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: config.temperature || 0.7,
                max_tokens: config.maxTokens || 1000,
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: config.timeout || 30000
            }
        );

        const responseTime = Date.now() - startTime;
        const choice = response.data.choices[0];

        return {
            provider: 'openai',
            model: config.model,
            content: choice.message.content,
            usage: response.data.usage,
            finish_reason: choice.finish_reason,
            response_time_ms: responseTime
        };
    }

    private async callAnthropic(prompt: string, config: LLMConfig, startTime: number): Promise<LLMResponse> {
        if (!config.apiKey) {
            throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or provide apiKey in config.');
        }

        const response = await axios.post(
            config.baseUrl || 'https://api.anthropic.com/v1/messages',
            {
                model: config.model,
                max_tokens: config.maxTokens || 1000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: config.temperature || 0.7,
            },
            {
                headers: {
                    'x-api-key': config.apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                timeout: config.timeout || 30000
            }
        );

        const responseTime = Date.now() - startTime;

        return {
            provider: 'anthropic',
            model: config.model,
            content: response.data.content[0].text,
            usage: {
                prompt_tokens: response.data.usage?.input_tokens || 0,
                completion_tokens: response.data.usage?.output_tokens || 0,
                total_tokens: (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0)
            },
            finish_reason: response.data.stop_reason,
            response_time_ms: responseTime
        };
    }

    private async callLocal(prompt: string, config: LLMConfig, startTime: number): Promise<LLMResponse> {
        // For local models like Ollama
        const baseUrl = config.baseUrl || 'http://localhost:11434';
        const model = config.model.replace('ollama/', '');

        const response = await axios.post(
            `${baseUrl}/api/generate`,
            {
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: config.temperature || 0.7,
                    num_predict: config.maxTokens || 1000
                }
            },
            {
                timeout: config.timeout || 60000
            }
        );

        const responseTime = Date.now() - startTime;

        return {
            provider: 'local',
            model: config.model,
            content: response.data.response,
            usage: {
                prompt_tokens: response.data.prompt_eval_count || 0,
                completion_tokens: response.data.eval_count || 0,
                total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
            },
            response_time_ms: responseTime
        };
    }

    private async callMock(prompt: string, config: LLMConfig, startTime: number): Promise<LLMResponse> {
        // Mock implementation for testing
        const responseTime = Date.now() - startTime;

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        // Generate a mock response based on the prompt
        let mockContent = '';
        if (prompt.toLowerCase().includes('analyze')) {
            mockContent = 'Mock Analysis: Based on the provided data, I have identified several key trends and patterns. The analysis shows positive indicators in the main metrics.';
        } else if (prompt.toLowerCase().includes('code')) {
            mockContent = 'Mock Code Review: The code appears to follow good practices. Consider adding more error handling and documentation.';
        } else if (prompt.toLowerCase().includes('summary')) {
            mockContent = 'Mock Summary: Key points include important decisions, action items for team members, and next steps for project completion.';
        } else {
            mockContent = `Mock Response: This is a simulated response from ${config.model}. The prompt was processed and a relevant answer has been generated based on the input context.`;
        }

        return {
            provider: 'mock',
            model: config.model,
            content: mockContent,
            usage: {
                prompt_tokens: Math.floor(prompt.length / 4),
                completion_tokens: Math.floor(mockContent.length / 4),
                total_tokens: Math.floor((prompt.length + mockContent.length) / 4)
            },
            finish_reason: 'stop',
            response_time_ms: Date.now() - startTime
        };
    }

    // Helper method to compare LLM responses
    compareResponses(expected: any, actual: string): number {
        if (typeof expected === 'string') {
            // Simple string similarity
            const similarity = this.calculateStringSimilarity(expected.toLowerCase(), actual.toLowerCase());
            return similarity;
        } else if (typeof expected === 'object' && expected !== null) {
            // For structured responses, check if actual contains expected keywords
            const expectedText = JSON.stringify(expected).toLowerCase();
            const actualText = actual.toLowerCase();
            const keywords = expectedText.match(/\w+/g) || [];
            const matches = keywords.filter(keyword => actualText.includes(keyword));
            return matches.length / keywords.length;
        }
        return 0;
    }

    private calculateStringSimilarity(str1: string, str2: string): number {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    private levenshteinDistance(str1: string, str2: string): number {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }
} 
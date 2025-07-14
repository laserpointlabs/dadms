import axios from 'axios';
import { LLMConfig, LLMProvider, LLMResponse } from './types';

// Import the new LLM service client
interface LLMServiceClient {
    complete(request: any): Promise<any>;
    healthCheck(): Promise<boolean>;
    getBaseURL?(): string; // Optional method to get base URL
}

class SimpleLLMServiceClient implements LLMServiceClient {
    private baseURL: string;

    constructor(baseURL: string = 'http://localhost:3006') {
        this.baseURL = baseURL;
    }

    getBaseURL(): string {
        return this.baseURL;
    }

    async complete(request: any): Promise<any> {
        try {
            const response = await axios.post(`${this.baseURL}/v1/complete`, request, {
                timeout: 60000,
                headers: { 'Content-Type': 'application/json' }
            });
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

    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

export class LLMServiceEnhanced {
    private static instance: LLMServiceEnhanced;
    private llmServiceClient: LLMServiceClient;
    private useLLMService: boolean = false;
    private llmServicePreferred: boolean = true; // Prefer LLM service over direct calls

    private constructor() {
        this.llmServiceClient = new SimpleLLMServiceClient();
        // Check if LLM service is available on startup
        this.checkLLMServiceAvailability();
    }

    public static getInstance(): LLMServiceEnhanced {
        if (!LLMServiceEnhanced.instance) {
            LLMServiceEnhanced.instance = new LLMServiceEnhanced();
        }
        return LLMServiceEnhanced.instance;
    }

    private async checkLLMServiceAvailability(): Promise<void> {
        try {
            this.useLLMService = await this.llmServiceClient.healthCheck();
            if (this.useLLMService) {
                console.log('✅ LLM Service is available and will be used as primary provider');
            } else {
                console.log('⚠️  LLM Service unavailable, falling back to direct provider calls');
            }
        } catch (error) {
            console.log('⚠️  LLM Service health check failed, falling back to direct provider calls');
            this.useLLMService = false;
        }
    }

    async callLLM(prompt: string, variables: Record<string, any> | string, config: LLMConfig): Promise<LLMResponse> {
        const startTime = Date.now();

        try {
            // Handle both string and object variables for backwards compatibility
            let processedPrompt = prompt;
            if (typeof variables === 'string') {
                // If variables is a string, use it as the main input
                processedPrompt = prompt.replace(/{input}/g, variables);
            } else {
                // Replace variables in prompt (object format)
                Object.entries(variables).forEach(([key, value]) => {
                    const placeholder = `{${key}}`;
                    processedPrompt = processedPrompt.replace(new RegExp(placeholder, 'g'), String(value));
                });
            }

            // Try LLM service first if available and preferred
            if (this.useLLMService && this.llmServicePreferred && process.env.DISABLE_LLM_SERVICE !== 'true') {
                try {
                    console.log('🚀 Using LLM Service for request');
                    return await this.callViaLLMService(processedPrompt, config, startTime);
                } catch (error) {
                    console.warn('⚠️  LLM Service call failed, falling back to direct provider:', error);
                    // Fall back to direct provider calls
                }
            } else if (!this.useLLMService) {
                console.log('🔄 LLM Service unavailable, using direct provider calls');
            }

            // Fallback to direct provider calls (existing logic)
            return await this.callDirectProvider(processedPrompt, config, startTime);

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

    private async callViaLLMService(prompt: string, config: LLMConfig, startTime: number): Promise<LLMResponse> {
        console.log(`📡 Calling LLM Service with provider: ${config.provider}, model: ${config.model}`);

        // Map prompt service provider names to LLM service provider names
        const providerMapping: Record<string, string> = {
            'local': 'ollama',  // Map 'local' to 'ollama' in LLM service
            'openai': 'openai',
            'anthropic': 'anthropic'
        };

        const llmServiceProvider = providerMapping[config.provider] || config.provider;

        const request = {
            prompt,
            system_prompt: undefined, // Could be added to config later
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 1000,
            model_preference: {
                primary: llmServiceProvider,
                models: config.model ? [config.model] : undefined,
                cost_priority: 'balanced',
                latency_requirement: 'standard'
            },
            response_format: 'text'
        };

        console.log(`📋 LLM Service request:`, {
            provider: llmServiceProvider,
            model: config.model,
            temperature: request.temperature,
            max_tokens: request.max_tokens
        });

        const response = await this.llmServiceClient.complete(request);

        console.log(`✅ LLM Service response received:`, {
            provider: response.provider,
            model: response.model_used,
            tokens: response.usage?.total_tokens || 0,
            response_time: response.performance?.response_time_ms
        });

        return {
            provider: config.provider, // Keep original provider name for compatibility
            model: response.model_used,
            content: response.content,
            usage: {
                prompt_tokens: response.usage?.prompt_tokens || 0,
                completion_tokens: response.usage?.completion_tokens || 0,
                total_tokens: response.usage?.total_tokens || 0
            },
            finish_reason: 'stop',
            response_time_ms: response.performance?.response_time_ms || (Date.now() - startTime)
        };
    }

    private async callDirectProvider(prompt: string, config: LLMConfig, startTime: number): Promise<LLMResponse> {
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
                return await this.callOpenAI(prompt, effectiveConfig, startTime);
            case 'anthropic':
                return await this.callAnthropic(prompt, effectiveConfig, startTime);
            case 'local':
                return await this.callLocal(prompt, effectiveConfig, startTime);
            default:
                throw new Error(`Unsupported LLM provider: ${config.provider}`);
        }
    }

    private getApiKeyFromEnv(provider: LLMProvider): string | undefined {
        switch (provider) {
            case 'openai':
                return process.env.OPENAI_API_KEY;
            case 'anthropic':
                return process.env.ANTHROPIC_API_KEY;
            case 'local':
                return undefined; // Local doesn't need an API key
            default:
                return undefined;
        }
    }

    private async callOpenAI(prompt: string, config: LLMConfig, startTime: number): Promise<LLMResponse> {
        if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
        }

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: config.model || 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: config.temperature || 0.7,
                max_tokens: config.maxTokens || 1000
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
            model: response.data.model,
            content: choice.message.content,
            usage: response.data.usage || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            },
            finish_reason: choice.finish_reason,
            response_time_ms: responseTime
        };
    }

    private async callAnthropic(prompt: string, config: LLMConfig, startTime: number): Promise<LLMResponse> {
        if (!config.apiKey) {
            throw new Error('Anthropic API key is required');
        }

        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: config.model || 'claude-3-sonnet-20240229',
                max_tokens: config.maxTokens || 1000,
                temperature: config.temperature || 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
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
            model: response.data.model,
            content: response.data.content[0].text,
            usage: {
                prompt_tokens: response.data.usage?.input_tokens || 0,
                completion_tokens: response.data.usage?.output_tokens || 0,
                total_tokens: (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0)
            },
            finish_reason: response.data.stop_reason || 'stop',
            response_time_ms: responseTime
        };
    }

    private async callLocal(prompt: string, config: LLMConfig, startTime: number): Promise<LLMResponse> {
        const ollamaUrl = config.baseUrl || 'http://localhost:11434';

        const response = await axios.post(
            `${ollamaUrl}/api/generate`,
            {
                model: config.model || 'llama2',
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

        // Estimate token usage for Ollama (it doesn't provide exact counts)
        const promptTokens = Math.ceil(prompt.length / 4);
        const completionTokens = Math.ceil(response.data.response.length / 4);

        return {
            provider: 'local',
            model: response.data.model || config.model || 'llama2',
            content: response.data.response,
            usage: {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: promptTokens + completionTokens
            },
            finish_reason: response.data.done ? 'stop' : 'length',
            response_time_ms: responseTime
        };
    }

    // Method to force refresh LLM service availability
    async refreshLLMServiceStatus(): Promise<boolean> {
        console.log('🔄 Refreshing LLM Service status...');
        await this.checkLLMServiceAvailability();
        return this.useLLMService;
    }

    // Method to get current status with more details
    getLLMServiceStatus(): { available: boolean; preferred: boolean; endpoint: string } {
        return {
            available: this.useLLMService,
            preferred: this.llmServicePreferred,
            endpoint: 'http://localhost:3006'
        };
    }

    // Method to enable/disable LLM service preference
    setLLMServicePreferred(preferred: boolean): void {
        this.llmServicePreferred = preferred;
        console.log(`🔧 LLM Service preference ${preferred ? 'enabled' : 'disabled'}`);
    }

    // Method to get provider capabilities
    async getProviderCapabilities(): Promise<any> {
        if (this.useLLMService && this.llmServiceClient.getBaseURL) {
            try {
                const baseURL = this.llmServiceClient.getBaseURL();
                const response = await axios.get(`${baseURL}/providers/status`);
                return response.data;
            } catch (error) {
                console.warn('Failed to get provider capabilities from LLM Service:', error);
            }
        }

        // Fallback to static capabilities
        return {
            providers: {
                openai: { available: !!process.env.OPENAI_API_KEY, models: ['gpt-4', 'gpt-3.5-turbo'] },
                anthropic: { available: !!process.env.ANTHROPIC_API_KEY, models: ['claude-3-sonnet'] },
                ollama: { available: false, models: ['llama2', 'mistral'] }
            }
        };
    }

    // Helper method to compare LLM responses (copied from original LLMService)
    compareResponses(expected: any, actual: string): number {
        if (typeof expected === 'string') {
            // Normalize both strings by trimming whitespace
            const normalizedExpected = expected.trim().toLowerCase();
            const normalizedActual = actual.trim().toLowerCase();

            // Check for exact match first
            if (normalizedExpected === normalizedActual) {
                return 1.0;
            }

            // For numeric answers, extract numbers and compare
            const expectedNumber = this.extractNumber(normalizedExpected);
            const actualNumber = this.extractNumber(normalizedActual);

            if (expectedNumber !== null && actualNumber !== null) {
                // If both are numbers, check if they match
                return expectedNumber === actualNumber ? 1.0 : 0.0;
            }

            // Check if actual contains the expected answer
            if (normalizedActual.includes(normalizedExpected)) {
                return 0.9; // High score for containing the expected answer
            }

            // Fall back to string similarity
            const similarity = this.calculateStringSimilarity(normalizedExpected, normalizedActual);
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

    private extractNumber(text: string): number | null {
        // Extract first number from text
        const match = text.match(/-?\d+\.?\d*/);
        return match ? parseFloat(match[0]) : null;
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

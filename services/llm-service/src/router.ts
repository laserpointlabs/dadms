import { LLMServiceConfig } from './config/providers';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';
import { OpenAIProvider } from './providers/openai';
import { XAIProvider } from './providers/xai';
import { LLMProvider, LLMRequest, LLMServiceError, ModelPreference, ProviderRequest } from './types';

export class ModelRouter {
    private providers: Map<string, LLMProvider> = new Map();
    private config: LLMServiceConfig;

    constructor(config: LLMServiceConfig) {
        this.config = config;
        this.initializeProviders();
    }

    private initializeProviders(): void {
        const enabledProviders = Object.values(this.config.providers).filter(p => p.enabled);

        console.log('🔧 Initializing providers...');

        for (const providerConfig of enabledProviders) {
            try {
                let provider: LLMProvider | null = null;

                switch (providerConfig.name) {
                    case 'openai':
                        provider = new OpenAIProvider(providerConfig);
                        break;

                    case 'anthropic':
                        provider = new AnthropicProvider(providerConfig);
                        break;

                    case 'xai':
                        provider = new XAIProvider(providerConfig);
                        break;

                    case 'local':
                        provider = new OllamaProvider(providerConfig);
                        break;

                    default:
                        console.warn(`Unknown provider type: ${providerConfig.name}`);
                        continue;
                }

                if (provider) {
                    this.providers.set(providerConfig.name, provider);
                    console.log(`✅ Initialized ${providerConfig.displayName} provider`);
                }
            } catch (error) {
                console.warn(`Failed to initialize ${providerConfig.displayName} provider:`, error);
            }
        }

        if (this.providers.size === 0) {
            console.error('❌ No providers were successfully initialized');
        } else {
            console.log(`🎯 Total providers initialized: ${this.providers.size}`);
        }
    }

    async selectProvider(preference: ModelPreference): Promise<{ provider: LLMProvider; model: string }> {
        const { primary, models = [], cost_priority = 'balanced' } = preference;

        // Try primary provider first
        if (primary !== 'auto') {
            const provider = this.providers.get(primary);
            if (provider && await provider.isAvailable()) {
                const model = await this.selectModel(provider, models, cost_priority);
                if (model) {
                    return { provider, model };
                }
            }
        }

        // Fallback strategy - try providers in order of preference
        const fallbackOrder = this.getFallbackOrder(preference);

        for (const providerName of fallbackOrder) {
            const provider = this.providers.get(providerName);
            if (provider && await provider.isAvailable()) {
                const model = await this.selectModel(provider, models, cost_priority);
                if (model) {
                    return { provider, model };
                }
            }
        }

        throw new LLMServiceError('No available providers found', 'NO_PROVIDERS_AVAILABLE');
    }

    private async selectModel(
        provider: LLMProvider,
        preferredModels: string[],
        costPriority: string
    ): Promise<string | null> {
        try {
            const availableModels = await provider.getSupportedModels();

            // If specific models are requested, try to find them
            if (preferredModels.length > 0) {
                for (const preferredModel of preferredModels) {
                    const found = availableModels.find((m: any) => m.id === preferredModel || m.name === preferredModel);
                    if (found) {
                        return found.id;
                    }
                }
            }

            // Otherwise, select based on cost priority
            if (availableModels.length === 0) {
                return null;
            }

            switch (costPriority) {
                case 'lowest':
                    return availableModels.sort((a: any, b: any) => a.cost_per_token - b.cost_per_token)[0].id;
                case 'quality':
                    // Prefer GPT-4 models, then GPT-3.5, then others
                    const qualityOrder = availableModels.sort((a: any, b: any) => {
                        if (a.id.includes('gpt-4') && !b.id.includes('gpt-4')) return -1;
                        if (b.id.includes('gpt-4') && !a.id.includes('gpt-4')) return 1;
                        if (a.id.includes('gpt-3.5') && !b.id.includes('gpt-3.5')) return -1;
                        if (b.id.includes('gpt-3.5') && !a.id.includes('gpt-3.5')) return 1;
                        return 0;
                    });
                    return qualityOrder[0].id;
                case 'balanced':
                default:
                    // For balanced, prefer gpt-3.5-turbo if available, otherwise first available
                    const balanced = availableModels.find((m: any) => m.id.includes('gpt-3.5-turbo'));
                    return balanced ? balanced.id : availableModels[0].id;
            }
        } catch (error) {
            console.error('Error selecting model for provider:', provider.name, error);
            return null;
        }
    }

    private getFallbackOrder(preference: ModelPreference): string[] {
        const { primary, cost_priority = 'balanced' } = preference;

        // Base order depends on cost priority
        let baseOrder: string[];
        if (cost_priority === 'lowest') {
            baseOrder = ['ollama', 'openai']; // Local first
        } else if (cost_priority === 'quality') {
            baseOrder = ['openai', 'ollama']; // Cloud first
        } else {
            baseOrder = ['ollama', 'openai']; // Balanced prefers local
        }

        // Remove primary from fallback order and put it first
        if (primary !== 'auto') {
            baseOrder = baseOrder.filter(p => p !== primary);
            baseOrder.unshift(primary);
        }

        return baseOrder;
    }

    async getAvailableProviders(): Promise<{ name: string; available: boolean; models: number }[]> {
        const results = [];

        for (const [name, provider] of this.providers) {
            try {
                const available = await provider.isAvailable();
                const models = available ? (await provider.getSupportedModels()).length : 0;
                results.push({ name, available, models });
            } catch (error) {
                results.push({ name, available: false, models: 0 });
            }
        }

        return results;
    }

    async getAvailableProvidersWithModels(): Promise<Record<string, { available: boolean; models: string[] }>> {
        const results: Record<string, { available: boolean; models: string[] }> = {};

        for (const [name, provider] of this.providers) {
            try {
                const available = await provider.isAvailable();
                const modelObjects = available ? await provider.getSupportedModels() : [];
                const models = modelObjects.map(model => model.id);
                results[name] = { available, models };
            } catch (error) {
                console.warn(`Error getting models for ${name}:`, error);
                results[name] = { available: false, models: [] };
            }
        }

        return results;
    }

    async routeRequest(request: LLMRequest): Promise<{ provider: LLMProvider; model: string; providerRequest: ProviderRequest }> {
        const { provider, model } = await this.selectProvider(request.model_preference);

        const providerRequest: ProviderRequest = {
            prompt: request.prompt,
            system_prompt: request.system_prompt,
            model,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
            conversation_id: request.conversation_id
        };

        return { provider, model, providerRequest };
    }
}

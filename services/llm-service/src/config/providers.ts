import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface ProviderConfig {
    name: string;
    displayName: string;
    enabled: boolean;
    requiresApiKey: boolean;
    apiKey?: string;
    baseUrl: string;
    organization?: string;
    timeout: number;
    rateLimitRPM: number;
    defaultModels: string[];
    supportedFeatures: {
        streaming: boolean;
        functionCalling: boolean;
        vision: boolean;
        embeddings: boolean;
    };
}

export interface LLMServiceConfig {
    port: number;
    nodeEnv: string;
    providers: Record<string, ProviderConfig>;
    defaults: {
        provider: string;
        fallbackProvider: string;
        timeout: number;
    };
    costManagement: {
        monthlyBudgetUSD: number;
        warningThreshold: number;
    };
    caching: {
        enabled: boolean;
        redisUrl: string;
        ttlSeconds: number;
    };
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
}

/**
 * Get boolean environment variable
 */
function getEnvBool(key: string, defaultValue: boolean = false): boolean {
    const value = process.env[key]?.toLowerCase();
    return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Get numeric environment variable
 */
function getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
}

/**
 * Check if provider is enabled and properly configured
 */
function isProviderConfigured(providerName: string, requiresApiKey: boolean): boolean {
    const enabled = getEnvBool(`ENABLE_${providerName.toUpperCase()}`, false);
    if (!enabled) return false;

    if (requiresApiKey) {
        const apiKey = getEnvVar(`${providerName.toUpperCase()}_API_KEY`);
        return !!apiKey && apiKey !== 'your_' + providerName.toLowerCase() + '_api_key_here';
    }

    return true;
}

/**
 * Comprehensive LLM Service Configuration
 */
export const config: LLMServiceConfig = {
    port: getEnvNumber('LLM_SERVICE_PORT', 3006),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),

    providers: {
        openai: {
            name: 'openai',
            displayName: 'OpenAI',
            enabled: isProviderConfigured('openai', true),
            requiresApiKey: true,
            apiKey: getEnvVar('OPENAI_API_KEY'),
            baseUrl: getEnvVar('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            organization: getEnvVar('OPENAI_ORGANIZATION'),
            timeout: getEnvNumber('OPENAI_TIMEOUT', 60000),
            rateLimitRPM: getEnvNumber('OPENAI_RATE_LIMIT_RPM', 3000),
            defaultModels: [
                'gpt-4o',
                'gpt-4o-mini',
                'gpt-4-turbo',
                'gpt-4',
                'gpt-3.5-turbo'
            ],
            supportedFeatures: {
                streaming: true,
                functionCalling: true,
                vision: true,
                embeddings: true
            }
        },

        anthropic: {
            name: 'anthropic',
            displayName: 'Anthropic Claude',
            enabled: isProviderConfigured('anthropic', true),
            requiresApiKey: true,
            apiKey: getEnvVar('ANTHROPIC_API_KEY'),
            baseUrl: getEnvVar('ANTHROPIC_BASE_URL', 'https://api.anthropic.com'),
            timeout: getEnvNumber('ANTHROPIC_TIMEOUT', 60000),
            rateLimitRPM: getEnvNumber('ANTHROPIC_RATE_LIMIT_RPM', 1000),
            defaultModels: [
                'claude-3-5-sonnet-20241022',
                'claude-3-5-haiku-20241022',
                'claude-3-opus-20240229',
                'claude-3-sonnet-20240229',
                'claude-3-haiku-20240307'
            ],
            supportedFeatures: {
                streaming: true,
                functionCalling: true,
                vision: true,
                embeddings: false
            }
        },

        xai: {
            name: 'xai',
            displayName: 'xAI Grok',
            enabled: isProviderConfigured('xai', true),
            requiresApiKey: true,
            apiKey: getEnvVar('XAI_API_KEY'),
            baseUrl: getEnvVar('XAI_BASE_URL', 'https://api.x.ai/v1'),
            timeout: getEnvNumber('XAI_TIMEOUT', 60000),
            rateLimitRPM: getEnvNumber('XAI_RATE_LIMIT_RPM', 1000),
            defaultModels: [
                'grok-beta',
                'grok-vision-beta'
            ],
            supportedFeatures: {
                streaming: true,
                functionCalling: true,
                vision: true,
                embeddings: false
            }
        },

        local: {
            name: 'local',
            displayName: 'Local Ollama',
            enabled: isProviderConfigured('ollama', false),
            requiresApiKey: false,
            baseUrl: getEnvVar('OLLAMA_BASE_URL', 'http://localhost:11434'),
            timeout: getEnvNumber('OLLAMA_TIMEOUT', 30000),
            rateLimitRPM: getEnvNumber('OLLAMA_RATE_LIMIT_RPM', 10000), // Local has higher limits
            defaultModels: [
                'llama2',
                'llama2:13b',
                'mistral',
                'codellama',
                'neural-chat'
            ],
            supportedFeatures: {
                streaming: true,
                functionCalling: false,
                vision: false,
                embeddings: true
            }
        }
    },

    defaults: {
        provider: getEnvVar('DEFAULT_PROVIDER', 'openai'),
        fallbackProvider: getEnvVar('FALLBACK_PROVIDER', 'local'),
        timeout: getEnvNumber('DEFAULT_TIMEOUT', 60000)
    },

    costManagement: {
        monthlyBudgetUSD: getEnvNumber('MONTHLY_BUDGET_USD', 100),
        warningThreshold: getEnvNumber('COST_WARNING_THRESHOLD', 80) / 100
    },

    caching: {
        enabled: getEnvBool('ENABLE_CACHING', false),
        redisUrl: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
        ttlSeconds: getEnvNumber('CACHE_TTL_SECONDS', 3600)
    }
};

/**
 * Get all enabled providers
 */
export function getEnabledProviders(): ProviderConfig[] {
    return Object.values(config.providers).filter(provider => provider.enabled);
}

/**
 * Get provider configuration by name
 */
export function getProviderConfig(providerName: string): ProviderConfig | null {
    return config.providers[providerName] || null;
}

/**
 * Validate configuration and log warnings
 */
export function validateConfiguration(): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
} {
    const warnings: string[] = [];
    const errors: string[] = [];

    const enabledProviders = getEnabledProviders();

    if (enabledProviders.length === 0) {
        errors.push('No providers are enabled. Please configure at least one provider.');
    }

    // Check if default provider is enabled
    const defaultProvider = getProviderConfig(config.defaults.provider);
    if (!defaultProvider?.enabled) {
        warnings.push(`Default provider '${config.defaults.provider}' is not enabled. Falling back to first available provider.`);
    }

    // Check API keys for providers that require them
    for (const provider of enabledProviders) {
        if (provider.requiresApiKey && (!provider.apiKey || provider.apiKey.includes('your_'))) {
            warnings.push(`Provider '${provider.name}' is enabled but API key appears to be a placeholder.`);
        }
    }

    // Check fallback provider
    const fallbackProvider = getProviderConfig(config.defaults.fallbackProvider);
    if (!fallbackProvider?.enabled) {
        warnings.push(`Fallback provider '${config.defaults.fallbackProvider}' is not enabled.`);
    }

    return {
        isValid: errors.length === 0,
        warnings,
        errors
    };
}

// Log configuration status on startup
if (require.main === module) {
    const validation = validateConfiguration();
    const enabledProviders = getEnabledProviders();

    console.log('🔧 LLM Service Configuration:');
    console.log(`📡 Port: ${config.port}`);
    console.log(`🔌 Enabled Providers: ${enabledProviders.map(p => p.name).join(', ')}`);
    console.log(`🎯 Default Provider: ${config.defaults.provider}`);
    console.log(`🛡️ Fallback Provider: ${config.defaults.fallbackProvider}`);

    if (validation.warnings.length > 0) {
        console.log('\n⚠️ Configuration Warnings:');
        validation.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (validation.errors.length > 0) {
        console.log('\n❌ Configuration Errors:');
        validation.errors.forEach(error => console.log(`  - ${error}`));
    }
}

export default config;

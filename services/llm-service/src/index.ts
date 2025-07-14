import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';

import config, { getEnabledProviders, validateConfiguration } from './config/providers';
import { ModelRouter } from './router';
import { LLMRequest, LLMResponse, LLMServiceError } from './types';

// Load environment variables
dotenv.config();

// Validate configuration on startup
const validation = validateConfiguration();
if (!validation.isValid) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
}

if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
}

const app = express();
const PORT = config.port;

// Log startup configuration
console.log('🚀 Starting LLM Service...');
console.log(`🔌 Enabled Providers: ${getEnabledProviders().map(p => p.displayName).join(', ')}`);
console.log(`🎯 Default Provider: ${config.defaults.provider}`);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Initialize router with configuration
const modelRouter = new ModelRouter(config);

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DADM LLM Service API',
            version: '1.0.0',
            description: 'Unified abstraction layer for all LLM providers in the DADM ecosystem',
            contact: {
                name: 'DADM Team'
            }
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                LLMRequest: {
                    type: 'object',
                    required: ['prompt'],
                    properties: {
                        prompt: { type: 'string', description: 'The main prompt text' },
                        system_prompt: { type: 'string', description: 'System prompt for context' },
                        temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
                        max_tokens: { type: 'integer', minimum: 1, default: 1000 },
                        model_preference: {
                            type: 'object',
                            properties: {
                                primary: { type: 'string', enum: ['auto', 'openai', 'local', 'anthropic'], default: 'auto' },
                                models: { type: 'array', items: { type: 'string' } },
                                cost_priority: { type: 'string', enum: ['lowest', 'balanced', 'quality'], default: 'balanced' }
                            }
                        },
                        conversation_id: { type: 'string' },
                        response_format: { type: 'string', enum: ['text', 'json'], default: 'text' }
                    }
                },
                LLMResponse: {
                    type: 'object',
                    properties: {
                        content: { type: 'string' },
                        model_used: { type: 'string' },
                        provider: { type: 'string' },
                        usage: {
                            type: 'object',
                            properties: {
                                prompt_tokens: { type: 'integer' },
                                completion_tokens: { type: 'integer' },
                                total_tokens: { type: 'integer' },
                                cost_estimate: { type: 'number' }
                            }
                        },
                        performance: {
                            type: 'object',
                            properties: {
                                response_time_ms: { type: 'integer' },
                                quality_score: { type: 'number' }
                            }
                        },
                        metadata: {
                            type: 'object',
                            properties: {
                                conversation_id: { type: 'string' },
                                fallback_used: { type: 'boolean' },
                                cache_hit: { type: 'boolean' },
                                request_id: { type: 'string' }
                            }
                        }
                    }
                },
                HealthResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        service: { type: 'string' },
                        version: { type: 'string' },
                        timestamp: { type: 'string' }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        code: { type: 'string' },
                        request_id: { type: 'string' }
                    }
                }
            }
        }
    },
    apis: ['./src/index.ts']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the LLM service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'llm-service',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /providers/status:
 *   get:
 *     summary: Get provider status
 *     description: Returns the availability status of all LLM providers
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Provider status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 providers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       available:
 *                         type: boolean
 *                       models:
 *                         type: array
 *                         items:
 *                           type: string
 *                 timestamp:
 *                   type: string
 *       500:
 *         description: Error getting provider status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Provider status endpoint
app.get('/providers/status', async (req, res) => {
    try {
        const providers = await modelRouter.getAvailableProviders();
        res.json({
            providers,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting provider status:', error);
        res.status(500).json({
            error: 'Failed to get provider status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * @swagger
 * /v1/complete:
 *   post:
 *     summary: Complete text using LLM
 *     description: Process a text completion request using the best available LLM provider
 *     tags: [Completion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LLMRequest'
 *           examples:
 *             simple:
 *               summary: Simple completion request
 *               value:
 *                 prompt: "What is the capital of France?"
 *                 temperature: 0.7
 *                 max_tokens: 100
 *             with_preferences:
 *               summary: Request with model preferences
 *               value:
 *                 prompt: "Explain quantum computing in simple terms"
 *                 system_prompt: "You are a helpful science teacher"
 *                 temperature: 0.5
 *                 max_tokens: 500
 *                 model_preference:
 *                   primary: "openai"
 *                   models: ["gpt-4", "gpt-3.5-turbo"]
 *                   cost_priority: "quality"
 *     responses:
 *       200:
 *         description: Completion successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LLMResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: No providers available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Main completion endpoint
app.post('/v1/complete', async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
        // Validate request
        const llmRequest: LLMRequest = {
            prompt: req.body.prompt,
            system_prompt: req.body.system_prompt,
            temperature: req.body.temperature || 0.7,
            max_tokens: req.body.max_tokens || 1000,
            model_preference: req.body.model_preference || { primary: 'auto' },
            conversation_id: req.body.conversation_id,
            persona_config: req.body.persona_config,
            context_bundle: req.body.context_bundle,
            response_format: req.body.response_format || 'text'
        };

        // Validate required fields
        if (!llmRequest.prompt) {
            return res.status(400).json({
                error: 'Missing required field: prompt',
                request_id: requestId
            });
        }

        // Route request to appropriate provider
        const { provider, model, providerRequest } = await modelRouter.routeRequest(llmRequest);

        console.log(`[${requestId}] Routing to ${provider.name} with model ${model}`);

        // Execute request
        const providerResponse = await provider.complete(providerRequest);

        // Build response
        const response: LLMResponse = {
            content: providerResponse.content,
            model_used: providerResponse.model,
            provider: provider.name,
            usage: {
                prompt_tokens: providerResponse.usage.prompt_tokens,
                completion_tokens: providerResponse.usage.completion_tokens,
                total_tokens: providerResponse.usage.total_tokens,
                cost_estimate: provider.estimateCost(providerRequest)
            },
            performance: {
                response_time_ms: Date.now() - startTime,
                quality_score: undefined // TODO: Implement quality scoring
            },
            metadata: {
                conversation_id: llmRequest.conversation_id,
                fallback_used: false, // TODO: Track fallback usage
                cache_hit: false, // TODO: Implement caching
                request_id: requestId
            }
        };

        console.log(`[${requestId}] Completed in ${response.performance.response_time_ms}ms`);
        res.json(response);

    } catch (error) {
        console.error(`[${requestId}] Error:`, error);

        if (error instanceof LLMServiceError) {
            res.status(error.code === 'NO_PROVIDERS_AVAILABLE' ? 503 : 400).json({
                error: error.message,
                code: error.code,
                provider: error.provider,
                retryable: error.retryable,
                request_id: requestId
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                request_id: requestId
            });
        }
    }
});

// OpenAI compatibility endpoint
app.post('/v1/chat/completions', async (req, res) => {
    try {
        // Convert OpenAI format to LLM Service format
        const messages = req.body.messages || [];
        const systemMessage = messages.find((m: any) => m.role === 'system');
        const userMessages = messages.filter((m: any) => m.role === 'user');

        const prompt = userMessages.map((m: any) => m.content).join('\n');
        const system_prompt = systemMessage?.content;

        const llmRequest: LLMRequest = {
            prompt,
            system_prompt,
            temperature: req.body.temperature || 0.7,
            max_tokens: req.body.max_tokens || 1000,
            model_preference: {
                primary: 'openai',
                models: [req.body.model || 'gpt-3.5-turbo']
            }
        };

        const { provider, model, providerRequest } = await modelRouter.routeRequest(llmRequest);
        const providerResponse = await provider.complete(providerRequest);

        // Convert back to OpenAI format
        const openaiResponse = {
            id: `chatcmpl-${uuidv4()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: providerResponse.model,
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: providerResponse.content
                },
                finish_reason: providerResponse.finish_reason
            }],
            usage: {
                prompt_tokens: providerResponse.usage.prompt_tokens,
                completion_tokens: providerResponse.usage.completion_tokens,
                total_tokens: providerResponse.usage.total_tokens
            }
        };

        res.json(openaiResponse);

    } catch (error) {
        console.error('OpenAI compatibility error:', error);
        res.status(500).json({
            error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                type: 'internal_error'
            }
        });
    }
});

/**
 * @swagger
 * /models:
 *   get:
 *     summary: Get available models from all providers
 *     description: Returns detailed model information from all available providers
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: Models retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 providers:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       available:
 *                         type: boolean
 *                       models:
 *                         type: array
 *                         items:
 *                           type: string
 *                 timestamp:
 *                   type: string
 *       500:
 *         description: Error getting models
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Models endpoint
app.get('/models', async (req, res) => {
    try {
        const providers = await modelRouter.getAvailableProvidersWithModels();
        res.json({
            providers,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting models:', error);
        res.status(500).json({
            error: 'Failed to get models',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LLM Service running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Provider status: http://localhost:${PORT}/providers/status`);
    console.log(`🤖 Main endpoint: http://localhost:${PORT}/v1/complete`);
    console.log(`🔄 OpenAI compatibility: http://localhost:${PORT}/v1/chat/completions`);
});

export default app;

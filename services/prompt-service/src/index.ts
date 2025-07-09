import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
// TODO: Refactor event-bus to be a node module for proper import. Temporarily disabling event bus integration for build compatibility.
// import { EventBus } from '../../shared/event-bus/src/event-bus';
import { PromptDatabase } from './database';
import { LLMService } from './llm-service';
import { AVAILABLE_LLMS, CreatePromptRequest, LLMConfig, TestPromptRequest, UpdatePromptRequest } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database and LLM service
const db = new PromptDatabase();
const llmService = LLMService.getInstance();

// // Initialize event bus
// const eventBus = new EventBus({
//     host: process.env.EVENT_BUS_HOST || 'localhost',
//     port: parseInt(process.env.EVENT_BUS_PORT || '3005')
// });

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Prompt Service API',
            version: '1.0.0',
            description: 'API for managing prompts in the DADM workflow system',
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
                Prompt: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        version: { type: 'number' },
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['simple', 'tool-aware', 'workflow-aware'] },
                        test_cases: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    input: { type: 'string' },
                                    expected_output: { type: 'string' },
                                    enabled: { type: 'boolean' }
                                }
                            }
                        },
                        tool_dependencies: { type: 'array', items: { type: 'string' } },
                        workflow_dependencies: { type: 'array', items: { type: 'string' } },
                        tags: { type: 'array', items: { type: 'string' } },
                        created_by: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        metadata: { type: 'object' }
                    }
                },
                CreatePromptRequest: {
                    type: 'object',
                    required: ['text', 'type'],
                    properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['simple', 'tool-aware', 'workflow-aware'] },
                        test_cases: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    input: { type: 'string' },
                                    expected_output: { type: 'string' },
                                    enabled: { type: 'boolean', default: true }
                                }
                            }
                        },
                        tool_dependencies: { type: 'array', items: { type: 'string' } },
                        workflow_dependencies: { type: 'array', items: { type: 'string' } },
                        tags: { type: 'array', items: { type: 'string' } },
                        metadata: { type: 'object' }
                    }
                },
                UpdatePromptRequest: {
                    type: 'object',
                    properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['simple', 'tool-aware', 'workflow-aware'] },
                        test_cases: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    input: { type: 'string' },
                                    expected_output: { type: 'string' },
                                    enabled: { type: 'boolean' }
                                }
                            }
                        },
                        tool_dependencies: { type: 'array', items: { type: 'string' } },
                        workflow_dependencies: { type: 'array', items: { type: 'string' } },
                        tags: { type: 'array', items: { type: 'string' } },
                        metadata: { type: 'object' }
                    }
                },
                TestPromptRequest: {
                    type: 'object',
                    properties: {
                        test_case_ids: { type: 'array', items: { type: 'string' } },
                        input_override: { type: 'string' },
                        llm_configs: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    provider: { type: 'string', enum: ['openai', 'anthropic', 'local', 'mock'] },
                                    model: { type: 'string' },
                                    apiKey: { type: 'string' },
                                    temperature: { type: 'number' },
                                    maxTokens: { type: 'number' }
                                }
                            }
                        },
                        enable_comparison: { type: 'boolean' }
                    }
                },
                TestResult: {
                    type: 'object',
                    properties: {
                        test_case_id: { type: 'string' },
                        passed: { type: 'boolean' },
                        actual_output: { type: 'string' },
                        execution_time_ms: { type: 'number' }
                    }
                },
                TestSummary: {
                    type: 'object',
                    properties: {
                        total: { type: 'number' },
                        passed: { type: 'number' },
                        failed: { type: 'number' },
                        execution_time_ms: { type: 'number' }
                    }
                }
            }
        }
    },
    apis: ['./src/index.ts']
};

const specs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'prompt-service', timestamp: new Date().toISOString() });
});

// API Routes

/**
 * @swagger
 * /prompts:
 *   get:
 *     summary: Get all prompts
 *     description: Retrieve a list of all prompts in the system
 *     tags: [Prompts]
 *     responses:
 *       200:
 *         description: List of prompts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prompt'
 *       500:
 *         description: Internal server error
 */
app.get('/prompts', async (req, res) => {
    try {
        const prompts = await db.getAllPrompts();
        res.json({ success: true, data: prompts });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts/{id}:
 *   get:
 *     summary: Get prompt by ID
 *     description: Retrieve a specific prompt by its ID
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The prompt ID
 *     responses:
 *       200:
 *         description: Prompt retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Prompt'
 *       404:
 *         description: Prompt not found
 *       500:
 *         description: Internal server error
 */
app.get('/prompts/:id', async (req, res) => {
    try {
        const prompt = await db.getPromptById(req.params.id);
        if (!prompt) {
            return res.status(404).json({ success: false, error: 'Prompt not found' });
        }
        return res.json({ success: true, data: prompt });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts:
 *   post:
 *     summary: Create a new prompt
 *     description: Create a new prompt with the provided data
 *     tags: [Prompts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePromptRequest'
 *     responses:
 *       201:
 *         description: Prompt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Prompt'
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
app.post('/prompts', async (req, res) => {
    try {
        const request: CreatePromptRequest = req.body;

        // Validate required fields
        if (!request.name || !request.text || !request.type) {
            return res.status(400).json({
                success: false,
                error: 'Name, text, and type are required'
            });
        }

        // Create prompt with test cases
        const testCases = request.test_cases?.map(tc => ({
            ...tc,
            id: uuidv4()
        })) || [];

        const prompt = await db.createPrompt({
            name: request.name,
            version: 1,
            text: request.text,
            type: request.type,
            test_cases: testCases,
            tool_dependencies: request.tool_dependencies || [],
            workflow_dependencies: request.workflow_dependencies || [],
            tags: request.tags || [],
            created_by: req.headers['x-user-id'] as string || 'anonymous',
            metadata: request.metadata || {}
        });

        // TODO: Publish event to event bus after refactor

        return res.status(201).json({ success: true, data: prompt });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts/{id}:
 *   put:
 *     summary: Update a prompt
 *     description: Update an existing prompt with new data
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The prompt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePromptRequest'
 *     responses:
 *       200:
 *         description: Prompt updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Prompt'
 *       404:
 *         description: Prompt not found
 *       500:
 *         description: Internal server error
 */
app.put('/prompts/:id', async (req, res) => {
    try {
        const request: UpdatePromptRequest = req.body;

        let updateData: any = { ...request };
        if (request.test_cases) {
            updateData.test_cases = request.test_cases.map(tc => ({
                ...tc,
                id: (tc as any).id || uuidv4(),
                enabled: typeof tc.enabled === 'boolean' ? tc.enabled : true
            }));
        } else {
            delete updateData.test_cases;
        }

        const updatedPrompt = await db.updatePrompt(req.params.id, updateData);
        if (!updatedPrompt) {
            return res.status(404).json({ success: false, error: 'Prompt not found' });
        }

        // TODO: Publish event to event bus after refactor

        return res.json({ success: true, data: updatedPrompt });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts/{id}:
 *   delete:
 *     summary: Delete a prompt
 *     description: Delete a prompt by its ID
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The prompt ID
 *     responses:
 *       200:
 *         description: Prompt deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Prompt not found
 *       500:
 *         description: Internal server error
 */
app.delete('/prompts/:id', async (req, res) => {
    try {
        const deleted = await db.deletePrompt(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Prompt not found' });
        }

        // TODO: Publish event to event bus after refactor

        return res.json({ success: true, message: 'Prompt deleted successfully' });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts/{id}/test:
 *   post:
 *     summary: Test a prompt with real LLMs
 *     description: Execute test cases for a specific prompt using configured LLM providers
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The prompt ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               test_case_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               input_override:
 *                 type: object
 *               llm_configs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     provider:
 *                       type: string
 *                       enum: ['openai', 'anthropic', 'local', 'mock']
 *                     model:
 *                       type: string
 *                     apiKey:
 *                       type: string
 *                     temperature:
 *                       type: number
 *                     maxTokens:
 *                       type: number
 *               enable_comparison:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Test executed successfully with LLM responses
 *       404:
 *         description: Prompt not found
 *       500:
 *         description: Internal server error
 */
app.post('/prompts/:id/test', async (req, res) => {
    try {
        const request: TestPromptRequest = req.body;
        const prompt = await db.getPromptById(req.params.id);

        if (!prompt) {
            return res.status(404).json({ success: false, error: 'Prompt not found' });
        }

        // Default LLM configs if none provided
        const defaultLLMConfigs: LLMConfig[] = [
            {
                provider: 'mock',
                model: 'mock-gpt',
                temperature: 0.7,
                maxTokens: 1000
            }
        ];

        const llmConfigs = request.llm_configs && request.llm_configs.length > 0
            ? request.llm_configs
            : defaultLLMConfigs;

        // Get test cases to run
        const testCases = request.test_case_ids
            ? prompt.test_cases.filter(tc => request.test_case_ids!.includes(tc.id))
            : prompt.test_cases.filter(tc => tc.enabled);

        if (testCases.length === 0) {
            return res.json({
                success: true,
                data: {
                    prompt_id: req.params.id,
                    prompt_text: prompt.text,
                    results: [],
                    summary: {
                        total: 0,
                        passed: 0,
                        failed: 0,
                        execution_time_ms: 0
                    }
                }
            });
        }

        const results = [];
        const llmComparisons: { [key: string]: any[] } = {};
        let totalExecutionTime = 0;

        // Run tests with each LLM config
        for (const llmConfig of llmConfigs) {
            const providerModel = `${llmConfig.provider}-${llmConfig.model}`;
            llmComparisons[providerModel] = [];

            for (const testCase of testCases) {
                const startTime = Date.now();

                try {
                    // Use input override if provided, otherwise use test case input
                    const testInput = request.input_override || testCase.input;

                    // Call LLM with the prompt and test input
                    const llmResponse = await llmService.callLLM(
                        prompt.text,
                        testInput,
                        llmConfig
                    );

                    const executionTime = Date.now() - startTime;
                    totalExecutionTime += executionTime;

                    // Compare response with expected output
                    const comparisonScore = llmService.compareResponses(
                        testCase.expected_output,
                        llmResponse.content
                    );

                    // Determine if test passed (threshold can be configurable)
                    const passed = comparisonScore >= 0.7;

                    const result = {
                        test_case_id: testCase.id,
                        test_case_name: testCase.name,
                        test_input: testInput,
                        passed,
                        actual_output: llmResponse.content,
                        llm_response: llmResponse,
                        expected_output: testCase.expected_output,
                        comparison_score: comparisonScore,
                        execution_time_ms: executionTime
                    };

                    results.push(result);
                    llmComparisons[providerModel].push(llmResponse);

                } catch (error) {
                    const executionTime = Date.now() - startTime;
                    totalExecutionTime += executionTime;

                    const result = {
                        test_case_id: testCase.id,
                        test_case_name: testCase.name,
                        test_input: request.input_override || testCase.input,
                        passed: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        execution_time_ms: executionTime
                    };

                    results.push(result);
                }
            }
        }

        // Calculate summary
        const passedCount = results.filter(r => r.passed).length;
        const summary = {
            total: results.length,
            passed: passedCount,
            failed: results.length - passedCount,
            execution_time_ms: totalExecutionTime,
            avg_comparison_score: results
                .filter(r => 'comparison_score' in r && r.comparison_score !== undefined)
                .reduce((sum, r) => sum + ((r as any).comparison_score || 0), 0) /
                Math.max(1, results.filter(r => 'comparison_score' in r && r.comparison_score !== undefined).length)
        };

        // Create test response object
        const testResponse = {
            prompt_id: req.params.id,
            prompt_text: prompt.text,
            results,
            llm_comparisons: request.enable_comparison ? llmComparisons : undefined,
            summary
        };

        // Save test results to database
        try {
            await db.saveTestResults(
                testResponse,
                prompt.version,
                llmConfigs,
                req.headers['x-user-id'] as string || 'anonymous'
            );
        } catch (saveError) {
            console.error('Failed to save test results:', saveError);
            // Continue without failing the request - test results are still returned
        }

        // Publish event
        // await eventBus.publishEvent({
        //     event_type: 'prompt_tested',
        //     actor: req.headers['x-user-id'] as string || 'anonymous',
        //     entity: {
        //         type: 'prompt',
        //         id: prompt.id,
        //         version: prompt.version,
        //         data: { prompt, results, summary }
        //     },
        //     source_service: 'prompt-service'
        // });

        return res.json({
            success: true,
            data: testResponse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts/{id}/test-results:
 *   get:
 *     summary: Get saved test results for a prompt
 *     description: Retrieve the most recent test results for a specific prompt, optionally filtered by version
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The prompt ID
 *       - in: query
 *         name: version
 *         required: false
 *         schema:
 *           type: integer
 *         description: Specific prompt version to get results for
 *     responses:
 *       200:
 *         description: Test results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TestPromptResponse'
 *       404:
 *         description: Prompt or test results not found
 *       500:
 *         description: Internal server error
 */
app.get('/prompts/:id/test-results', async (req, res) => {
    try {
        const promptId = req.params.id;
        const version = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

        const testResults = await db.getTestResults(promptId, version);

        if (!testResults) {
            return res.status(404).json({
                success: false,
                error: 'No test results found for this prompt' + (version ? ` version ${version}` : '')
            });
        }

        return res.json({
            success: true,
            data: testResults
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts/{id}/test-history:
 *   get:
 *     summary: Get test execution history for a prompt
 *     description: Retrieve the history of all test executions for a specific prompt across all versions
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The prompt ID
 *     responses:
 *       200:
 *         description: Test history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       execution_id:
 *                         type: string
 *                       prompt_version:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       total_tests:
 *                         type: integer
 *                       passed_tests:
 *                         type: integer
 *                       failed_tests:
 *                         type: integer
 *                       avg_comparison_score:
 *                         type: number
 *       404:
 *         description: Prompt not found
 *       500:
 *         description: Internal server error
 */
app.get('/prompts/:id/test-history', async (req, res) => {
    try {
        const promptId = req.params.id;

        // Check if prompt exists
        const prompt = await db.getPromptById(promptId);
        if (!prompt) {
            return res.status(404).json({ success: false, error: 'Prompt not found' });
        }

        const testHistory = await db.getTestHistory(promptId);

        return res.json({
            success: true,
            data: testHistory
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts/{id}/versions:
 *   get:
 *     summary: Get all versions of a prompt
 *     description: Retrieve all versions of a specific prompt with basic information
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The prompt ID
 *     responses:
 *       200:
 *         description: Prompt versions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       version:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       text:
 *                         type: string
 *                       type:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *       404:
 *         description: Prompt not found
 *       500:
 *         description: Internal server error
 */
app.get('/prompts/:id/versions', async (req, res) => {
    try {
        const promptId = req.params.id;

        // Check if prompt exists
        const prompt = await db.getPromptById(promptId);
        if (!prompt) {
            return res.status(404).json({ success: false, error: 'Prompt not found' });
        }

        const versions = await db.getAllVersions(promptId);

        return res.json({
            success: true,
            data: versions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts/{id}/version/{version}:
 *   get:
 *     summary: Get a specific version of a prompt
 *     description: Retrieve a specific version of a prompt with full details
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The prompt ID
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *         description: The version number
 *     responses:
 *       200:
 *         description: Prompt version retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Prompt'
 *       404:
 *         description: Prompt or version not found
 *       500:
 *         description: Internal server error
 */
app.get('/prompts/:id/version/:version', async (req, res) => {
    try {
        const promptId = req.params.id;
        const version = parseInt(req.params.version, 10);

        if (isNaN(version)) {
            return res.status(400).json({ success: false, error: 'Invalid version number' });
        }

        const prompt = await db.getPromptByVersion(promptId, version);

        if (!prompt) {
            return res.status(404).json({
                success: false,
                error: `Prompt version ${version} not found`
            });
        }

        return res.json({
            success: true,
            data: prompt
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /prompts/{id}/version/{version}:
 *   put:
 *     summary: Update a specific version of a prompt
 *     description: Update a specific version of a prompt with new data
 *     tags: [Prompts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The prompt ID
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *         description: The version number to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePromptRequest'
 *     responses:
 *       200:
 *         description: Prompt version updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Prompt'
 *       404:
 *         description: Prompt version not found
 *       500:
 *         description: Internal server error
 */
app.put('/prompts/:id/version/:version', async (req, res) => {
    try {
        const promptId = req.params.id;
        const version = parseInt(req.params.version, 10);
        const request: UpdatePromptRequest = req.body;

        if (isNaN(version)) {
            return res.status(400).json({ success: false, error: 'Invalid version number' });
        }

        let updateData: any = { ...request };
        if (request.test_cases) {
            updateData.test_cases = request.test_cases.map(tc => ({
                ...tc,
                id: (tc as any).id || uuidv4(),
                enabled: typeof tc.enabled === 'boolean' ? tc.enabled : true
            }));
        } else {
            delete updateData.test_cases;
        }

        const updatedPrompt = await db.updatePromptVersion(promptId, version, updateData);
        if (!updatedPrompt) {
            return res.status(404).json({ success: false, error: 'Prompt version not found' });
        }

        // TODO: Publish event to event bus after refactor

        return res.json({ success: true, data: updatedPrompt });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// New endpoint to get available LLMs
/**
 * @swagger
 * /llms/available:
 *   get:
 *     summary: Get available LLM providers and models
 *     description: Retrieve list of supported LLM providers and their available models
 *     tags: [LLMs]
 *     responses:
 *       200:
 *         description: Available LLMs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
app.get('/llms/available', (req, res) => {
    res.json({
        success: true,
        data: AVAILABLE_LLMS
    });
});

// New endpoint to check API key availability
/**
 * @swagger
 * /llms/config-status:
 *   get:
 *     summary: Check API key configuration status
 *     description: Check which LLM providers have API keys configured via environment variables
 *     tags: [LLMs]
 *     responses:
 *       200:
 *         description: Configuration status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
app.get('/llms/config-status', (req, res) => {
    const configStatus = {
        openai: {
            configured: !!process.env.OPENAI_API_KEY,
            source: process.env.OPENAI_API_KEY ? 'environment' : 'none',
            models: AVAILABLE_LLMS.openai
        },
        anthropic: {
            configured: !!process.env.ANTHROPIC_API_KEY,
            source: process.env.ANTHROPIC_API_KEY ? 'environment' : 'none',
            models: AVAILABLE_LLMS.anthropic
        },
        local: {
            configured: true, // Local models don't need API keys
            source: 'local',
            models: AVAILABLE_LLMS.local
        },
        mock: {
            configured: true, // Mock doesn't need real API keys
            source: 'mock',
            models: AVAILABLE_LLMS.mock
        }
    };

    res.json({
        success: true,
        data: configStatus
    });
});

// Start server
async function startServer() {
    try {
        await db.initialize();
        console.log('Database initialized');

        app.listen(PORT, () => {
            console.log(`Prompt Service running on port ${PORT}`);
            console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await db.close();
    process.exit(0);
}); 
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
import { CreatePromptRequest, TestPromptRequest, UpdatePromptRequest } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new PromptDatabase();

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
                        input_override: { type: 'string' }
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
        if (!request.text || !request.type) {
            return res.status(400).json({
                success: false,
                error: 'Text and type are required'
            });
        }

        // Create prompt with test cases
        const testCases = request.test_cases?.map(tc => ({
            ...tc,
            id: uuidv4()
        })) || [];

        const prompt = await db.createPrompt({
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
 *     summary: Test a prompt
 *     description: Execute test cases for a specific prompt
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
 *             $ref: '#/components/schemas/TestPromptRequest'
 *     responses:
 *       200:
 *         description: Test executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     prompt_id:
 *                       type: string
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TestResult'
 *                     summary:
 *                       $ref: '#/components/schemas/TestSummary'
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

        // Simple test execution (stub implementation)
        const testCases = request.test_case_ids
            ? prompt.test_cases.filter(tc => request.test_case_ids!.includes(tc.id))
            : prompt.test_cases.filter(tc => tc.enabled);

        const results = testCases.map(tc => ({
            test_case_id: tc.id,
            passed: Math.random() > 0.3, // Stub: 70% pass rate
            actual_output: request.input_override || tc.input,
            execution_time_ms: Math.floor(Math.random() * 1000)
        }));

        const summary = {
            total: results.length,
            passed: results.filter(r => r.passed).length,
            failed: results.filter(r => !r.passed).length,
            execution_time_ms: results.reduce((sum, r) => sum + r.execution_time_ms, 0)
        };

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
            data: {
                prompt_id: req.params.id,
                results,
                summary
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
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
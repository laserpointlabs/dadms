import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
// TODO: Refactor event-bus to be a node module for proper import. Temporarily disabling event bus integration for build compatibility.
// import { EventBus } from '../shared/event-bus/src/event-bus';

const app = express();
const PORT = process.env.PORT || 3003;

// In-memory storage for workflows and executions (replace with database in production)
const workflows = new Map<string, any>();
const executions = new Map<string, any>();

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
            title: 'Workflow Service API',
            version: '1.0.0',
            description: 'API for managing workflows in the DADM workflow system',
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
                Workflow: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        bpmn_xml: { type: 'string' },
                        version: { type: 'number' },
                        linked_prompts: { type: 'array', items: { type: 'string' } },
                        linked_tools: { type: 'array', items: { type: 'string' } },
                        annotations: { type: 'object' },
                        created_by: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        status: { type: 'string', enum: ['draft', 'active', 'archived'] }
                    }
                },
                CreateWorkflowRequest: {
                    type: 'object',
                    required: ['name', 'description', 'bpmn_xml'],
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        bpmn_xml: { type: 'string' },
                        linked_prompts: { type: 'array', items: { type: 'string' } },
                        linked_tools: { type: 'array', items: { type: 'string' } },
                        annotations: { type: 'object' }
                    }
                },
                UpdateWorkflowRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        bpmn_xml: { type: 'string' },
                        linked_prompts: { type: 'array', items: { type: 'string' } },
                        linked_tools: { type: 'array', items: { type: 'string' } },
                        annotations: { type: 'object' },
                        status: { type: 'string', enum: ['draft', 'active', 'archived'] }
                    }
                },
                ExecuteWorkflowRequest: {
                    type: 'object',
                    properties: {
                        input_data: { type: 'object' },
                        timeout_ms: { type: 'number', default: 300000 }
                    }
                },
                Execution: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        workflow_id: { type: 'string' },
                        status: { type: 'string', enum: ['running', 'completed', 'failed', 'cancelled'] },
                        started_at: { type: 'string', format: 'date-time' },
                        completed_at: { type: 'string', format: 'date-time' },
                        input_data: { type: 'object' },
                        output_data: { type: 'object' },
                        execution_log: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    step_id: { type: 'string' },
                                    step_name: { type: 'string' },
                                    step_type: { type: 'string', enum: ['task', 'prompt', 'tool', 'gateway'] },
                                    status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
                                    started_at: { type: 'string', format: 'date-time' },
                                    completed_at: { type: 'string', format: 'date-time' },
                                    execution_time_ms: { type: 'number' }
                                }
                            }
                        },
                        created_by: { type: 'string' },
                        error: { type: 'string' }
                    }
                },
                ExecutionStep: {
                    type: 'object',
                    properties: {
                        step_id: { type: 'string' },
                        step_name: { type: 'string' },
                        step_type: { type: 'string', enum: ['task', 'prompt', 'tool', 'gateway'] },
                        status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
                        started_at: { type: 'string', format: 'date-time' },
                        completed_at: { type: 'string', format: 'date-time' },
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
    res.json({ status: 'healthy', service: 'workflow-service', timestamp: new Date().toISOString() });
});

// API Routes

/**
 * @swagger
 * /workflows:
 *   get:
 *     summary: Get all workflows
 *     description: Retrieve a list of all workflows in the system
 *     tags: [Workflows]
 *     responses:
 *       200:
 *         description: List of workflows retrieved successfully
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
 *                     $ref: '#/components/schemas/Workflow'
 *       500:
 *         description: Internal server error
 */
app.get('/workflows', (req, res) => {
    const workflowsList = Array.from(workflows.values());
    res.json({ success: true, data: workflowsList });
});

/**
 * @swagger
 * /workflows/{id}:
 *   get:
 *     summary: Get workflow by ID
 *     description: Retrieve a specific workflow by its ID
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID
 *     responses:
 *       200:
 *         description: Workflow retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Workflow'
 *       404:
 *         description: Workflow not found
 *       500:
 *         description: Internal server error
 */
app.get('/workflows/:id', (req, res) => {
    const workflow = workflows.get(req.params.id);
    if (!workflow) {
        return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    return res.json({ success: true, data: workflow });
});

/**
 * @swagger
 * /workflows:
 *   post:
 *     summary: Create a new workflow
 *     description: Create a new workflow with BPMN definition
 *     tags: [Workflows]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWorkflowRequest'
 *     responses:
 *       201:
 *         description: Workflow created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Workflow'
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
app.post('/workflows', async (req, res) => {
    try {
        const { name, description, bpmn_xml, linked_prompts, linked_tools, annotations } = req.body;

        // Validate required fields
        if (!name || !description || !bpmn_xml) {
            return res.status(400).json({
                success: false,
                error: 'Name, description, and BPMN XML are required'
            });
        }

        const workflow = {
            id: uuidv4(),
            name,
            description,
            bpmn_xml,
            version: 1,
            linked_prompts: linked_prompts || [],
            linked_tools: linked_tools || [],
            annotations: annotations || {},
            created_by: req.headers['x-user-id'] as string || 'anonymous',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'draft' as const
        };

        workflows.set(workflow.id, workflow);

        // TODO: Publish event to event bus after refactor

        return res.status(201).json({ success: true, data: workflow });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /workflows/{id}:
 *   put:
 *     summary: Update a workflow
 *     description: Update an existing workflow with new data
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkflowRequest'
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Workflow'
 *       404:
 *         description: Workflow not found
 *       500:
 *         description: Internal server error
 */
app.put('/workflows/:id', async (req, res) => {
    try {
        const workflow = workflows.get(req.params.id);
        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }

        const updatedWorkflow = {
            ...workflow,
            ...req.body,
            version: workflow.version + 1,
            updated_at: new Date().toISOString()
        };

        workflows.set(req.params.id, updatedWorkflow);

        // TODO: Publish event to event bus after refactor

        return res.json({ success: true, data: updatedWorkflow });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /workflows/{id}:
 *   delete:
 *     summary: Delete a workflow
 *     description: Delete a workflow by its ID
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID
 *     responses:
 *       200:
 *         description: Workflow deleted successfully
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
 *         description: Workflow not found
 *       500:
 *         description: Internal server error
 */
app.delete('/workflows/:id', async (req, res) => {
    try {
        const workflow = workflows.get(req.params.id);
        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }

        workflows.delete(req.params.id);

        // TODO: Publish event to event bus after refactor

        return res.json({ success: true, message: 'Workflow deleted successfully' });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /workflows/{id}/execute:
 *   post:
 *     summary: Execute a workflow
 *     description: Start execution of a specific workflow
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExecuteWorkflowRequest'
 *     responses:
 *       202:
 *         description: Workflow execution started
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
 *                     execution_id:
 *                       type: string
 *                     workflow_id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     started_at:
 *                       type: string
 *                       format: date-time
 *                     estimated_completion:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Workflow not found
 *       500:
 *         description: Internal server error
 */
app.post('/workflows/:id/execute', async (req, res) => {
    try {
        const workflow = workflows.get(req.params.id);
        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }

        const { input_data, timeout_ms } = req.body;
        const executionId = uuidv4();
        const startedAt = new Date().toISOString();

        // Create execution record
        const execution = {
            id: executionId,
            workflow_id: workflow.id,
            status: 'running' as const,
            started_at: startedAt,
            input_data: input_data || {},
            execution_log: [],
            created_by: req.headers['x-user-id'] as string || 'anonymous'
        };

        executions.set(executionId, execution);

        // TODO: Publish event to event bus after refactor

        // Simulate workflow execution (stub implementation)
        setTimeout(async () => {
            try {
                // Simulate execution steps
                const steps = [
                    {
                        step_id: 'step-1',
                        step_name: 'Initialize',
                        step_type: 'task' as const,
                        status: 'completed' as const,
                        started_at: startedAt,
                        completed_at: new Date().toISOString(),
                        execution_time_ms: 100
                    },
                    {
                        step_id: 'step-2',
                        step_name: 'Process Data',
                        step_type: 'prompt' as const,
                        status: 'completed' as const,
                        started_at: new Date(Date.now() - 500).toISOString(),
                        completed_at: new Date().toISOString(),
                        execution_time_ms: 500
                    }
                ];

                const completedExecution = {
                    ...execution,
                    status: 'completed' as const,
                    completed_at: new Date().toISOString(),
                    output_data: { result: 'Workflow completed successfully' },
                    execution_log: steps
                };

                executions.set(executionId, completedExecution);

                // TODO: Publish completion event to event bus after refactor
            } catch (error) {
                const failedExecution = {
                    ...execution,
                    status: 'failed' as const,
                    completed_at: new Date().toISOString(),
                    error: error instanceof Error ? error.message : 'Execution failed'
                };

                executions.set(executionId, failedExecution);

                // TODO: Publish failure event to event bus after refactor
            }
        }, 1000);

        return res.status(202).json({
            success: true,
            data: {
                execution_id: executionId,
                workflow_id: workflow.id,
                status: 'running',
                started_at: startedAt,
                estimated_completion: new Date(Date.now() + 5000).toISOString()
            }
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
 * /executions/{id}:
 *   get:
 *     summary: Get execution status
 *     description: Retrieve the status and details of a workflow execution
 *     tags: [Executions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The execution ID
 *     responses:
 *       200:
 *         description: Execution details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Execution'
 *       404:
 *         description: Execution not found
 *       500:
 *         description: Internal server error
 */
app.get('/executions/:id', (req, res) => {
    const execution = executions.get(req.params.id);
    if (!execution) {
        return res.status(404).json({ success: false, error: 'Execution not found' });
    }
    return res.json({ success: true, data: execution });
});

/**
 * @swagger
 * /workflows/{id}/executions:
 *   get:
 *     summary: Get workflow executions
 *     description: Retrieve all executions for a specific workflow
 *     tags: [Executions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID
 *     responses:
 *       200:
 *         description: List of executions retrieved successfully
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
 *                     $ref: '#/components/schemas/Execution'
 *       500:
 *         description: Internal server error
 */
app.get('/workflows/:id/executions', (req, res) => {
    const workflowExecutions = Array.from(executions.values())
        .filter((exec: any) => exec.workflow_id === req.params.id);
    res.json({ success: true, data: workflowExecutions });
});

// Start server
app.listen(PORT, () => {
    console.log(`Workflow Service running on port ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
}); 
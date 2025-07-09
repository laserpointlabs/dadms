import axios from 'axios';
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
const PORT = process.env.PORT || 3002;

// In-memory storage for tools (replace with database in production)
const tools = new Map<string, any>();

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
            title: 'Tool Service API',
            version: '1.0.0',
            description: 'API for managing tools in the DADM workflow system',
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
                Tool: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        endpoint: { type: 'string' },
                        capabilities: { type: 'array', items: { type: 'string' } },
                        status: { type: 'string', enum: ['healthy', 'unhealthy', 'unknown'] },
                        version: { type: 'string' },
                        metadata: { type: 'object' },
                        created_by: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        last_health_check: { type: 'string', format: 'date-time' }
                    }
                },
                CreateToolRequest: {
                    type: 'object',
                    required: ['name', 'description', 'endpoint', 'capabilities', 'version'],
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        endpoint: { type: 'string' },
                        capabilities: { type: 'array', items: { type: 'string' } },
                        version: { type: 'string' },
                        metadata: { type: 'object' }
                    }
                },
                UpdateToolRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        endpoint: { type: 'string' },
                        capabilities: { type: 'array', items: { type: 'string' } },
                        version: { type: 'string' },
                        metadata: { type: 'object' }
                    }
                },
                InvokeToolRequest: {
                    type: 'object',
                    required: ['action'],
                    properties: {
                        action: { type: 'string' },
                        parameters: { type: 'object' },
                        timeout_ms: { type: 'number', default: 30000 }
                    }
                },
                ToolInvocationResult: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        result: { type: 'object' },
                        error: { type: 'string' },
                        execution_time_ms: { type: 'number' },
                        metadata: {
                            type: 'object',
                            properties: {
                                tool_id: { type: 'string' },
                                action: { type: 'string' },
                                endpoint: { type: 'string' }
                            }
                        }
                    }
                },
                HealthCheckResult: {
                    type: 'object',
                    properties: {
                        tool_id: { type: 'string' },
                        status: { type: 'string', enum: ['healthy', 'unhealthy', 'unknown'] },
                        response_time_ms: { type: 'number' },
                        error: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
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
    res.json({ status: 'healthy', service: 'tool-service', timestamp: new Date().toISOString() });
});

// API Routes

/**
 * @swagger
 * /tools:
 *   get:
 *     summary: Get all tools
 *     description: Retrieve a list of all registered tools
 *     tags: [Tools]
 *     responses:
 *       200:
 *         description: List of tools retrieved successfully
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
 *                     $ref: '#/components/schemas/Tool'
 *       500:
 *         description: Internal server error
 */
app.get('/tools', (req, res) => {
    const toolsList = Array.from(tools.values());
    res.json({ success: true, data: toolsList });
});

/**
 * @swagger
 * /tools/{id}:
 *   get:
 *     summary: Get tool by ID
 *     description: Retrieve a specific tool by its ID
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tool ID
 *     responses:
 *       200:
 *         description: Tool retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tool'
 *       404:
 *         description: Tool not found
 *       500:
 *         description: Internal server error
 */
app.get('/tools/:id', (req, res) => {
    const tool = tools.get(req.params.id);
    if (!tool) {
        return res.status(404).json({ success: false, error: 'Tool not found' });
    }
    return res.json({ success: true, data: tool });
});

/**
 * @swagger
 * /tools:
 *   post:
 *     summary: Register a new tool
 *     description: Register a new tool with the provided configuration
 *     tags: [Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateToolRequest'
 *     responses:
 *       201:
 *         description: Tool registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tool'
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
app.post('/tools', async (req, res) => {
    try {
        const { name, description, endpoint, capabilities, version, metadata } = req.body;

        // Validate required fields
        if (!name || !description || !endpoint || !capabilities || !version) {
            return res.status(400).json({
                success: false,
                error: 'Name, description, endpoint, capabilities, and version are required'
            });
        }

        const tool = {
            id: uuidv4(),
            name,
            description,
            endpoint,
            capabilities,
            status: 'unknown' as const,
            version,
            metadata: metadata || {},
            created_by: req.headers['x-user-id'] as string || 'anonymous',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        tools.set(tool.id, tool);

        // TODO: Publish event to event bus after refactor

        return res.status(201).json({ success: true, data: tool });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /tools/{id}:
 *   put:
 *     summary: Update a tool
 *     description: Update an existing tool with new configuration
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tool ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateToolRequest'
 *     responses:
 *       200:
 *         description: Tool updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tool'
 *       404:
 *         description: Tool not found
 *       500:
 *         description: Internal server error
 */
app.put('/tools/:id', async (req, res) => {
    try {
        const tool = tools.get(req.params.id);
        if (!tool) {
            return res.status(404).json({ success: false, error: 'Tool not found' });
        }

        const updatedTool = {
            ...tool,
            ...req.body,
            updated_at: new Date().toISOString()
        };

        tools.set(req.params.id, updatedTool);

        // TODO: Publish event to event bus after refactor

        return res.json({ success: true, data: updatedTool });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /tools/{id}:
 *   delete:
 *     summary: Delete a tool
 *     description: Delete a tool by its ID
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tool ID
 *     responses:
 *       200:
 *         description: Tool deleted successfully
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
 *         description: Tool not found
 *       500:
 *         description: Internal server error
 */
app.delete('/tools/:id', async (req, res) => {
    try {
        const tool = tools.get(req.params.id);
        if (!tool) {
            return res.status(404).json({ success: false, error: 'Tool not found' });
        }

        tools.delete(req.params.id);

        // TODO: Publish event to event bus after refactor

        return res.json({ success: true, message: 'Tool deleted successfully' });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /tools/{id}/invoke:
 *   post:
 *     summary: Invoke a tool
 *     description: Execute an action on a specific tool
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tool ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvokeToolRequest'
 *     responses:
 *       200:
 *         description: Tool invoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ToolInvocationResult'
 *       404:
 *         description: Tool not found
 *       500:
 *         description: Internal server error or tool invocation failed
 */
app.post('/tools/:id/invoke', async (req, res) => {
    try {
        const tool = tools.get(req.params.id);
        if (!tool) {
            return res.status(404).json({ success: false, error: 'Tool not found' });
        }

        const { action, parameters, timeout_ms } = req.body;
        const startTime = Date.now();

        try {
            // Stub implementation - in real system, this would call the actual tool
            const response = await axios.post(`${tool.endpoint}/${action}`, parameters, {
                timeout: timeout_ms || 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const executionTime = Date.now() - startTime;

            const result = {
                success: true,
                result: response.data,
                execution_time_ms: executionTime,
                metadata: {
                    tool_id: tool.id,
                    action,
                    endpoint: tool.endpoint
                }
            };

            // TODO: Publish event to event bus after refactor

            return res.json({ success: true, data: result });
        } catch (error) {
            const executionTime = Date.now() - startTime;

            const result = {
                success: false,
                error: error instanceof Error ? error.message : 'Tool invocation failed',
                execution_time_ms: executionTime,
                metadata: {
                    tool_id: tool.id,
                    action,
                    endpoint: tool.endpoint
                }
            };

            // TODO: Publish event to event bus after refactor

            return res.status(500).json({ success: false, data: result });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /tools/{id}/health-check:
 *   post:
 *     summary: Check tool health
 *     description: Perform a health check on a specific tool
 *     tags: [Tools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tool ID
 *     responses:
 *       200:
 *         description: Health check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HealthCheckResult'
 *       404:
 *         description: Tool not found
 *       500:
 *         description: Internal server error
 */
app.post('/tools/:id/health-check', async (req, res) => {
    try {
        const tool = tools.get(req.params.id);
        if (!tool) {
            return res.status(404).json({ success: false, error: 'Tool not found' });
        }

        const startTime = Date.now();
        let status: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
        let error: string | undefined;

        try {
            await axios.get(`${tool.endpoint}/health`, { timeout: 5000 });
            status = 'healthy';
        } catch (err) {
            status = 'unhealthy';
            error = err instanceof Error ? err.message : 'Health check failed';
        }

        const responseTime = Date.now() - startTime;
        const healthResult = {
            tool_id: tool.id,
            status,
            response_time_ms: responseTime,
            error,
            timestamp: new Date().toISOString()
        };

        // Update tool status
        tool.status = status;
        tool.last_health_check = healthResult.timestamp;
        tools.set(tool.id, tool);

        // TODO: Publish event to event bus after refactor

        return res.json({ success: true, data: healthResult });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Tool Service running on port ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
}); 
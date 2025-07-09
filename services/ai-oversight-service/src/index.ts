import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
import { PromptQualityAgent } from './agents/prompt-quality-agent';
import { Agent, AgentFinding } from './types';

const app = express();
const PORT = process.env.PORT || 3004;

// In-memory storage for findings and agents (replace with database in production)
const findings = new Map<string, AgentFinding>();
const agents = new Map<string, Agent>();

// Initialize agents
const promptQualityAgent = new PromptQualityAgent();
agents.set(promptQualityAgent.getName(), {
    id: uuidv4(),
    name: promptQualityAgent.getName(),
    description: promptQualityAgent.getDescription(),
    event_types: ['prompt_created', 'prompt_updated', 'prompt_tested'],
    enabled: true,
    config: {}
});

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AI Oversight Service API',
            version: '1.0.0',
            description: 'API for AI oversight and monitoring in the DADM workflow system',
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
                Event: {
                    type: 'object',
                    required: ['event_type'],
                    properties: {
                        event_id: { type: 'string' },
                        event_type: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                        actor: { type: 'string' },
                        entity: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                id: { type: 'string' },
                                version: { type: 'number' },
                                data: { type: 'object' }
                            }
                        },
                        context: { type: 'object' },
                        source_service: { type: 'string' }
                    }
                },
                AgentFinding: {
                    type: 'object',
                    properties: {
                        finding_id: { type: 'string' },
                        event_id: { type: 'string' },
                        entity_type: { type: 'string' },
                        entity_id: { type: 'string' },
                        agent_name: { type: 'string' },
                        level: { type: 'string', enum: ['info', 'suggestion', 'warning', 'error'] },
                        message: { type: 'string' },
                        suggested_action: { type: 'string' },
                        details: { type: 'object' },
                        timestamp: { type: 'string', format: 'date-time' },
                        resolved: { type: 'boolean' },
                        resolved_by: { type: 'string' },
                        resolved_at: { type: 'string', format: 'date-time' }
                    }
                },
                Agent: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        event_types: { type: 'array', items: { type: 'string' } },
                        enabled: { type: 'boolean' },
                        config: { type: 'object' }
                    }
                },
                ReviewEventRequest: {
                    type: 'object',
                    required: ['event_type'],
                    properties: {
                        event_id: { type: 'string' },
                        event_type: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                        actor: { type: 'string' },
                        entity: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                id: { type: 'string' },
                                version: { type: 'number' },
                                data: { type: 'object' }
                            }
                        },
                        context: { type: 'object' },
                        source_service: { type: 'string' }
                    }
                },
                ResolveFindingRequest: {
                    type: 'object',
                    properties: {
                        resolved_by: { type: 'string' },
                        resolution_notes: { type: 'string' }
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
    res.json({ status: 'healthy', service: 'ai-oversight-service', timestamp: new Date().toISOString() });
});

// API Routes

/**
 * @swagger
 * /ai-review/events:
 *   post:
 *     summary: Review an event
 *     description: Submit an event for AI agent review and analysis
 *     tags: [AI Review]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewEventRequest'
 *     responses:
 *       200:
 *         description: Event reviewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     findings_count:
 *                       type: number
 *                     findings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AgentFinding'
 *       400:
 *         description: Bad request - invalid event format
 *       500:
 *         description: Internal server error
 */
app.post('/ai-review/events', async (req, res) => {
    try {
        const event = req.body;

        if (!event || !event.event_type) {
            return res.status(400).json({
                success: false,
                error: 'Invalid event format'
            });
        }

        const newFindings: AgentFinding[] = [];

        // Route event to appropriate agents
        for (const agent of agents.values()) {
            if (agent.enabled && agent.event_types.includes(event.event_type)) {
                try {
                    let agentResponse;

                    // Call the appropriate agent
                    if (agent.name === 'PromptQualityAgent') {
                        agentResponse = await promptQualityAgent.review({ event });
                    }
                    // Add more agents here as needed

                    if (agentResponse && agentResponse.findings.length > 0) {
                        for (const finding of agentResponse.findings) {
                            const newFinding: AgentFinding = {
                                finding_id: uuidv4(),
                                event_id: event.event_id,
                                entity_type: finding.entity_type,
                                entity_id: finding.entity_id,
                                agent_name: finding.agent_name,
                                level: finding.level,
                                message: finding.message,
                                suggested_action: finding.suggested_action,
                                details: finding.details,
                                timestamp: new Date().toISOString(),
                                resolved: false
                            };

                            findings.set(newFinding.finding_id, newFinding);
                            newFindings.push(newFinding);
                        }
                    }
                } catch (error) {
                    console.error(`Error in agent ${agent.name}:`, error);
                }
            }
        }

        return res.json({
            success: true,
            message: 'Event reviewed successfully',
            data: { findings_count: newFindings.length, findings: newFindings }
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
 * /ai-review/findings:
 *   get:
 *     summary: Get findings
 *     description: Retrieve AI agent findings with optional filtering
 *     tags: [AI Review]
 *     parameters:
 *       - in: query
 *         name: entity_id
 *         schema:
 *           type: string
 *         description: Filter by entity ID
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, suggestion, warning, error]
 *         description: Filter by finding level
 *       - in: query
 *         name: agent_name
 *         schema:
 *           type: string
 *         description: Filter by agent name
 *       - in: query
 *         name: resolved
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by resolution status
 *     responses:
 *       200:
 *         description: Findings retrieved successfully
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
 *                     $ref: '#/components/schemas/AgentFinding'
 *       500:
 *         description: Internal server error
 */
app.get('/ai-review/findings', (req, res) => {
    try {
        const { entity_id, entity_type, level, agent_name, resolved } = req.query;

        let filteredFindings = Array.from(findings.values());

        if (entity_id) {
            filteredFindings = filteredFindings.filter(f => f.entity_id === entity_id);
        }

        if (entity_type) {
            filteredFindings = filteredFindings.filter(f => f.entity_type === entity_type);
        }

        if (level) {
            filteredFindings = filteredFindings.filter(f => f.level === level);
        }

        if (agent_name) {
            filteredFindings = filteredFindings.filter(f => f.agent_name === agent_name);
        }

        if (resolved !== undefined) {
            const isResolved = resolved === 'true';
            filteredFindings = filteredFindings.filter(f => f.resolved === isResolved);
        }

        // Sort by timestamp (newest first)
        filteredFindings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        res.json({
            success: true,
            data: filteredFindings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

/**
 * @swagger
 * /ai-review/findings/{finding_id}/resolve:
 *   post:
 *     summary: Resolve a finding
 *     description: Mark an AI agent finding as resolved
 *     tags: [AI Review]
 *     parameters:
 *       - in: path
 *         name: finding_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The finding ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResolveFindingRequest'
 *     responses:
 *       200:
 *         description: Finding resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AgentFinding'
 *       404:
 *         description: Finding not found
 *       500:
 *         description: Internal server error
 */
app.post('/ai-review/findings/:finding_id/resolve', (req, res) => {
    try {
        const finding = findings.get(req.params.finding_id);
        if (!finding) {
            return res.status(404).json({ success: false, error: 'Finding not found' });
        }

        const { resolved_by, resolution_notes } = req.body;

        finding.resolved = true;
        finding.resolved_by = resolved_by || req.headers['x-user-id'] as string || 'anonymous';
        finding.resolved_at = new Date().toISOString();

        if (resolution_notes) {
            finding.details = { ...finding.details, resolution_notes };
        }

        findings.set(finding.finding_id, finding);

        return res.json({
            success: true,
            message: 'Finding resolved successfully',
            data: finding
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
 * /ai-review/agents:
 *   get:
 *     summary: Get all agents
 *     description: Retrieve a list of all registered AI agents
 *     tags: [AI Review]
 *     responses:
 *       200:
 *         description: List of agents retrieved successfully
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
 *                     $ref: '#/components/schemas/Agent'
 *       500:
 *         description: Internal server error
 */
app.get('/ai-review/agents', (req, res) => {
    const agentsList = Array.from(agents.values());
    res.json({ success: true, data: agentsList });
});

/**
 * @swagger
 * /ai-review/agents/{agent_id}/enable:
 *   post:
 *     summary: Enable an agent
 *     description: Enable a specific AI agent for event review
 *     tags: [AI Review]
 *     parameters:
 *       - in: path
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The agent ID
 *     responses:
 *       200:
 *         description: Agent enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Agent'
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Internal server error
 */
app.post('/ai-review/agents/:agent_id/enable', (req, res) => {
    try {
        const agent = agents.get(req.params.agent_id);
        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' });
        }

        agent.enabled = true;
        agents.set(agent.id, agent);

        return res.json({
            success: true,
            message: 'Agent enabled successfully',
            data: agent
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
 * /ai-review/agents/{agent_id}/disable:
 *   post:
 *     summary: Disable an agent
 *     description: Disable a specific AI agent from event review
 *     tags: [AI Review]
 *     parameters:
 *       - in: path
 *         name: agent_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The agent ID
 *     responses:
 *       200:
 *         description: Agent disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Agent'
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Internal server error
 */
app.post('/ai-review/agents/:agent_id/disable', (req, res) => {
    try {
        const agent = agents.get(req.params.agent_id);
        if (!agent) {
            return res.status(404).json({ success: false, error: 'Agent not found' });
        }

        agent.enabled = false;
        agents.set(agent.id, agent);

        return res.json({
            success: true,
            message: 'Agent disabled successfully',
            data: agent
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`AI Oversight Service running on port ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    console.log(`Registered agents: ${Array.from(agents.keys()).join(', ')}`);
}); 
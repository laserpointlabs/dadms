# MCP Implementation Guide for DADMS

## Overview

This guide provides practical implementation patterns, code examples, and architectural guidance for integrating Model Context Protocol (MCP) with DADMS 2.0. It builds on the MCP Integration Specification with concrete implementation details.

## MCP Client Implementation

### Core MCP Client for DADMS

```typescript
// src/shared/mcp/client.ts
import { MCPClient as BaseMCPClient } from '@modelcontextprotocol/sdk';

export interface DADMSMCPConfig {
  servers: MCPServerConfig[];
  security: MCPSecurityConfig;
  performance: MCPPerformanceConfig;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'http' | 'websocket';
  endpoint: string;
  authentication?: MCPAuthConfig;
  capabilities?: string[];
}

export class DADMSMCPClient {
  private clients: Map<string, BaseMCPClient> = new Map();
  private registry: MCPRegistry;
  private security: MCPSecurityManager;

  constructor(private config: DADMSMCPConfig) {
    this.registry = new MCPRegistry();
    this.security = new MCPSecurityManager(config.security);
  }

  async initialize(): Promise<void> {
    for (const serverConfig of this.config.servers) {
      await this.connectToServer(serverConfig);
    }
  }

  private async connectToServer(config: MCPServerConfig): Promise<void> {
    const client = new BaseMCPClient({
      transport: this.createTransport(config),
      timeout: this.config.performance.timeout
    });

    await client.connect();
    
    // Discover server capabilities
    const capabilities = await client.discoverCapabilities();
    
    // Register with local registry
    await this.registry.registerServer(config.id, {
      config,
      capabilities,
      client,
      status: 'connected'
    });

    this.clients.set(config.id, client);
  }

  async discoverTools(filter?: ToolFilter): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];
    
    for (const [serverId, client] of this.clients) {
      try {
        const tools = await client.listTools();
        const transformedTools = tools.map(tool => ({
          ...tool,
          serverId,
          source: 'mcp'
        }));
        
        allTools.push(...transformedTools);
      } catch (error) {
        console.warn(`Failed to discover tools from server ${serverId}:`, error);
      }
    }

    return filter ? this.filterTools(allTools, filter) : allTools;
  }

  async executeTool(
    toolName: string, 
    parameters: object, 
    context?: MCPExecutionContext
  ): Promise<MCPToolResult> {
    // Find the server that provides this tool
    const serverInfo = await this.registry.findServerForTool(toolName);
    if (!serverInfo) {
      throw new Error(`Tool ${toolName} not found in any registered server`);
    }

    // Security check
    await this.security.authorizeExecution(context?.session, toolName, parameters);

    // Get the client
    const client = this.clients.get(serverInfo.id);
    if (!client) {
      throw new Error(`Client for server ${serverInfo.id} not found`);
    }

    // Execute tool
    const startTime = Date.now();
    try {
      const result = await client.callTool(toolName, parameters);
      
      // Log execution
      await this.logExecution({
        tool: toolName,
        server: serverInfo.id,
        duration: Date.now() - startTime,
        success: true,
        context
      });

      return {
        success: true,
        data: result,
        metadata: {
          server: serverInfo.id,
          duration: Date.now() - startTime
        }
      };
    } catch (error) {
      await this.logExecution({
        tool: toolName,
        server: serverInfo.id,
        duration: Date.now() - startTime,
        success: false,
        error: error.message,
        context
      });
      
      throw error;
    }
  }

  async getResource(uri: string, context?: MCPExecutionContext): Promise<MCPResource> {
    const serverInfo = await this.registry.findServerForResource(uri);
    if (!serverInfo) {
      throw new Error(`Resource ${uri} not found in any registered server`);
    }

    const client = this.clients.get(serverInfo.id);
    if (!client) {
      throw new Error(`Client for server ${serverInfo.id} not found`);
    }

    return await client.getResource(uri);
  }

  async subscribeToEvents(serverId: string, eventTypes: string[]): Promise<void> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`Server ${serverId} not found`);
    }

    for (const eventType of eventTypes) {
      await client.subscribe(eventType, (event) => {
        this.handleMCPEvent(serverId, event);
      });
    }
  }

  private async handleMCPEvent(serverId: string, event: MCPEvent): Promise<void> {
    // Transform MCP event to DADMS event and publish to EventManager
    const dadmsEvent = this.transformMCPEventToDADMS(event, serverId);
    
    // Publish through EventManager
    const eventManager = await this.getEventManager();
    await eventManager.publish(dadmsEvent);
  }

  private transformMCPEventToDADMS(event: MCPEvent, serverId: string): DADMSEvent {
    return {
      type: `mcp.${event.type}`,
      source: `mcp-server.${serverId}`,
      data: event.data,
      timestamp: new Date(),
      metadata: {
        mcp_server: serverId,
        original_event: event
      }
    };
  }
}
```

## MCP Server Implementation

### Base DADMS MCP Server

```typescript
// src/shared/mcp/server.ts
import { MCPServer as BaseMCPServer } from '@modelcontextprotocol/sdk';

export abstract class DADMSMCPServer {
  protected server: BaseMCPServer;
  protected servicePort: number;
  protected serviceName: string;

  constructor(serviceName: string, servicePort: number) {
    this.serviceName = serviceName;
    this.servicePort = servicePort;
    this.server = new BaseMCPServer({
      name: `dadms-${serviceName}`,
      version: '1.0.0'
    });
    
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Tool execution handler
    this.server.setToolHandler(async (tool, params) => {
      return await this.handleToolCall(tool, params);
    });

    // Resource handler
    this.server.setResourceHandler(async (uri) => {
      return await this.handleResourceRequest(uri);
    });

    // Prompt handler
    this.server.setPromptHandler(async (name, args) => {
      return await this.handlePromptRequest(name, args);
    });
  }

  abstract async initialize(): Promise<void>;
  abstract async handleToolCall(tool: string, params: object): Promise<MCPToolResult>;
  abstract async handleResourceRequest(uri: string): Promise<MCPResource>;
  abstract async handlePromptRequest(name: string, args: object): Promise<MCPPrompt>;

  async start(): Promise<void> {
    await this.initialize();
    await this.server.start();
    console.log(`DADMS MCP Server for ${this.serviceName} started on port ${this.servicePort}`);
  }

  async stop(): Promise<void> {
    await this.server.stop();
  }

  protected async validateParameters(tool: string, params: object): Promise<void> {
    const toolDef = await this.getToolDefinition(tool);
    if (!toolDef) {
      throw new Error(`Unknown tool: ${tool}`);
    }

    // Validate required parameters
    for (const requiredParam of toolDef.required || []) {
      if (!(requiredParam in params)) {
        throw new Error(`Missing required parameter: ${requiredParam}`);
      }
    }

    // Validate parameter types
    for (const [paramName, paramValue] of Object.entries(params)) {
      const paramDef = toolDef.parameters[paramName];
      if (paramDef && !this.validateParameterType(paramValue, paramDef)) {
        throw new Error(`Invalid type for parameter ${paramName}`);
      }
    }
  }

  private validateParameterType(value: any, definition: ParameterDefinition): boolean {
    switch (definition.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null;
      default:
        return true;
    }
  }

  protected abstract async getToolDefinition(tool: string): Promise<ToolDefinition | null>;
}
```

### Project Service MCP Server

```typescript
// src/services/project/mcp-server.ts
import { DADMSMCPServer } from '../../shared/mcp/server';
import { ProjectService } from './project-service';

export class ProjectMCPServer extends DADMSMCPServer {
  private projectService: ProjectService;

  constructor() {
    super('project', 3026);
    this.projectService = new ProjectService();
  }

  async initialize(): Promise<void> {
    await this.projectService.initialize();
    
    // Register available tools
    await this.server.addTool({
      name: 'create-project',
      description: 'Create a new DADMS project',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          description: { type: 'string', description: 'Project description' },
          template_id: { type: 'string', description: 'Optional project template ID' }
        },
        required: ['name']
      }
    });

    await this.server.addTool({
      name: 'get-project-status',
      description: 'Get current project status and metrics',
      parameters: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project ID' }
        },
        required: ['project_id']
      }
    });

    await this.server.addTool({
      name: 'list-project-resources',
      description: 'List all resources in a project',
      parameters: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Project ID' },
          resource_type: { 
            type: 'string', 
            enum: ['documents', 'models', 'simulations'],
            description: 'Type of resources to list'
          }
        },
        required: ['project_id']
      }
    });

    // Register resources
    await this.server.addResource({
      uri: 'project://{project_id}',
      name: 'Project Details',
      description: 'Complete project information including metadata, status, and resources'
    });

    // Register prompts
    await this.server.addPrompt({
      name: 'project-summary',
      description: 'Generate a comprehensive project summary',
      parameters: {
        project_id: { type: 'string', description: 'Project ID to summarize' }
      }
    });
  }

  async handleToolCall(tool: string, params: object): Promise<MCPToolResult> {
    await this.validateParameters(tool, params);

    switch (tool) {
      case 'create-project':
        return await this.createProject(params as CreateProjectParams);
      
      case 'get-project-status':
        return await this.getProjectStatus(params as GetProjectStatusParams);
      
      case 'list-project-resources':
        return await this.listProjectResources(params as ListProjectResourcesParams);
      
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
  }

  async handleResourceRequest(uri: string): Promise<MCPResource> {
    const match = uri.match(/^project:\/\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid project resource URI: ${uri}`);
    }

    const projectId = match[1];
    const project = await this.projectService.getProject(projectId);
    
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(project, null, 2)
    };
  }

  async handlePromptRequest(name: string, args: object): Promise<MCPPrompt> {
    switch (name) {
      case 'project-summary':
        return await this.generateProjectSummaryPrompt(args as { project_id: string });
      
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }

  private async createProject(params: CreateProjectParams): Promise<MCPToolResult> {
    try {
      const project = await this.projectService.createProject({
        name: params.name,
        description: params.description,
        template_id: params.template_id
      });

      return {
        content: [{
          type: 'text',
          text: `Project created successfully: ${project.name} (ID: ${project.id})`
        }],
        metadata: {
          project_id: project.id,
          created_at: project.created_at
        }
      };
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  private async getProjectStatus(params: GetProjectStatusParams): Promise<MCPToolResult> {
    const status = await this.projectService.getProjectStatus(params.project_id);
    
    return {
      content: [{
        type: 'text',
        text: `Project Status: ${status.status}`
      }, {
        type: 'text',
        text: JSON.stringify(status.metrics, null, 2)
      }],
      metadata: {
        project_id: params.project_id,
        status: status.status
      }
    };
  }

  private async listProjectResources(params: ListProjectResourcesParams): Promise<MCPToolResult> {
    const resources = await this.projectService.listResources(
      params.project_id, 
      params.resource_type
    );

    return {
      content: [{
        type: 'text',
        text: `Found ${resources.length} ${params.resource_type || 'resources'} in project ${params.project_id}`
      }, {
        type: 'text',
        text: JSON.stringify(resources, null, 2)
      }],
      metadata: {
        project_id: params.project_id,
        resource_type: params.resource_type,
        count: resources.length
      }
    };
  }

  private async generateProjectSummaryPrompt(args: { project_id: string }): Promise<MCPPrompt> {
    const project = await this.projectService.getProject(args.project_id);
    
    return {
      name: 'project-summary',
      description: 'Generate a comprehensive project summary',
      messages: [{
        role: 'system',
        content: `You are a project analysis expert. Generate a comprehensive summary of the following project:`
      }, {
        role: 'user',
        content: `Project Data: ${JSON.stringify(project, null, 2)}`
      }]
    };
  }

  protected async getToolDefinition(tool: string): Promise<ToolDefinition | null> {
    const definitions = {
      'create-project': {
        parameters: {
          name: { type: 'string' },
          description: { type: 'string' },
          template_id: { type: 'string' }
        },
        required: ['name']
      },
      'get-project-status': {
        parameters: {
          project_id: { type: 'string' }
        },
        required: ['project_id']
      },
      'list-project-resources': {
        parameters: {
          project_id: { type: 'string' },
          resource_type: { type: 'string' }
        },
        required: ['project_id']
      }
    };

    return definitions[tool] || null;
  }
}

// Type definitions
interface CreateProjectParams {
  name: string;
  description?: string;
  template_id?: string;
}

interface GetProjectStatusParams {
  project_id: string;
}

interface ListProjectResourcesParams {
  project_id: string;
  resource_type?: 'documents' | 'models' | 'simulations';
}
```

## MCP Gateway Service

### Gateway Implementation

```typescript
// src/services/mcp-gateway/gateway-service.ts
import express from 'express';
import { DADMSMCPClient } from '../../shared/mcp/client';
import { MCPRegistry } from './mcp-registry';
import { MCPSecurityManager } from './mcp-security';

export class MCPGatewayService {
  private app: express.Application;
  private mcpClient: DADMSMCPClient;
  private registry: MCPRegistry;
  private security: MCPSecurityManager;
  private port: number = 3025;

  constructor() {
    this.app = express();
    this.registry = new MCPRegistry();
    this.security = new MCPSecurityManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      next();
    });

    // Authentication middleware
    this.app.use('/mcp', this.authenticateRequest.bind(this));
  }

  private setupRoutes(): void {
    // MCP Protocol Routes
    this.app.post('/mcp/v1/initialize', this.handleInitialize.bind(this));
    this.app.post('/mcp/v1/discover', this.handleDiscover.bind(this));
    this.app.post('/mcp/v1/execute', this.handleExecute.bind(this));
    this.app.get('/mcp/v1/resources', this.handleListResources.bind(this));
    this.app.get('/mcp/v1/resources/*', this.handleGetResource.bind(this));

    // Administrative Routes
    this.app.get('/admin/servers', this.handleListServers.bind(this));
    this.app.post('/admin/register', this.handleRegisterServer.bind(this));
    this.app.get('/admin/health', this.handleHealthCheck.bind(this));
    this.app.get('/admin/metrics', this.handleGetMetrics.bind(this));

    // Health endpoint (unauthenticated)
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  private async authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const session = await this.security.validateToken(token);
      req.mcpSession = session;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid authentication token' });
    }
  }

  private async handleInitialize(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { client_info } = req.body;
      
      // Initialize MCP client if not already done
      if (!this.mcpClient) {
        const config = await this.loadMCPConfig();
        this.mcpClient = new DADMSMCPClient(config);
        await this.mcpClient.initialize();
      }

      // Create session
      const session = await this.security.createSession(req.mcpSession.user_id, client_info);

      res.json({
        protocol_version: '2024-11-05',
        server_info: {
          name: 'DADMS MCP Gateway',
          version: '1.0.0'
        },
        session_id: session.id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async handleDiscover(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { filter } = req.body;
      
      const tools = await this.mcpClient.discoverTools(filter);
      const resources = await this.registry.listResources(filter);
      const prompts = await this.registry.listPrompts(filter);

      res.json({
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          server: tool.serverId
        })),
        resources: resources.map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          server: resource.serverId
        })),
        prompts: prompts.map(prompt => ({
          name: prompt.name,
          description: prompt.description,
          parameters: prompt.parameters,
          server: prompt.serverId
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async handleExecute(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { tool, parameters } = req.body;
      
      // Execute tool through MCP client
      const result = await this.mcpClient.executeTool(tool, parameters, {
        session: req.mcpSession,
        timestamp: new Date()
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: error.message,
        success: false 
      });
    }
  }

  private async handleListResources(req: express.Request, res: express.Response): Promise<void> {
    try {
      const resources = await this.registry.listResources();
      res.json({ resources });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async handleGetResource(req: express.Request, res: express.Response): Promise<void> {
    try {
      const uri = req.path.replace('/mcp/v1/resources/', '');
      const resource = await this.mcpClient.getResource(uri, {
        session: req.mcpSession,
        timestamp: new Date()
      });

      res.json(resource);
    } catch (error) {
      res.status(404).json({ error: `Resource not found: ${error.message}` });
    }
  }

  private async handleListServers(req: express.Request, res: express.Response): Promise<void> {
    try {
      const servers = await this.registry.listServers();
      res.json({ servers });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async handleRegisterServer(req: express.Request, res: express.Response): Promise<void> {
    try {
      const serverConfig = req.body;
      await this.registry.registerServer(serverConfig.id, serverConfig);
      res.json({ message: 'Server registered successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async handleHealthCheck(req: express.Request, res: express.Response): Promise<void> {
    try {
      const health = await this.registry.checkHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  private async handleGetMetrics(req: express.Request, res: express.Response): Promise<void> {
    try {
      const metrics = await this.registry.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async start(): Promise<void> {
    // Load configuration
    const config = await this.loadMCPConfig();
    
    // Initialize MCP client
    this.mcpClient = new DADMSMCPClient(config);
    await this.mcpClient.initialize();

    // Start server
    this.app.listen(this.port, () => {
      console.log(`MCP Gateway Service listening on port ${this.port}`);
    });
  }

  private async loadMCPConfig(): Promise<DADMSMCPConfig> {
    // Load from environment or configuration file
    return {
      servers: [
        {
          id: 'dadms-project',
          name: 'DADMS Project Service',
          transport: 'http',
          endpoint: 'http://localhost:3026',
          capabilities: ['tools', 'resources', 'prompts']
        },
        {
          id: 'dadms-knowledge',
          name: 'DADMS Knowledge Service',
          transport: 'http',
          endpoint: 'http://localhost:3027',
          capabilities: ['tools', 'resources']
        },
        {
          id: 'dadms-simulation',
          name: 'DADMS Simulation Service',
          transport: 'http',
          endpoint: 'http://localhost:3028',
          capabilities: ['tools']
        }
      ],
      security: {
        tokenValidation: 'jwt',
        sessionTimeout: 3600000, // 1 hour
        rateLimiting: {
          windowMs: 60000, // 1 minute
          maxRequests: 100
        }
      },
      performance: {
        timeout: 30000, // 30 seconds
        retries: 3,
        caching: {
          toolMetadata: 300000, // 5 minutes
          results: 60000 // 1 minute
        }
      }
    };
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      mcpSession?: MCPSession;
    }
  }
}
```

## Integration with Context Manager

### Enhanced Context Manager

```typescript
// src/services/context-manager/enhanced-context-manager.ts
import { ContextManager } from './context-manager';
import { DADMSMCPClient } from '../../shared/mcp/client';

export class EnhancedContextManager extends ContextManager {
  private mcpClient: DADMSMCPClient;

  constructor(mcpClient: DADMSMCPClient) {
    super();
    this.mcpClient = mcpClient;
  }

  async assembleContext(request: ContextRequest): Promise<AssembledContext> {
    // Get base context from existing functionality
    const baseContext = await super.assembleContext(request);

    // Enhance with MCP capabilities
    const mcpTools = await this.discoverRelevantMCPTools(request);
    const mcpResources = await this.gatherMCPResources(request);

    return {
      ...baseContext,
      tools: [...baseContext.tools, ...mcpTools],
      resources: [...baseContext.resources, ...mcpResources],
      capabilities: {
        ...baseContext.capabilities,
        mcp_enabled: true,
        dynamic_tool_discovery: true,
        external_data_access: true
      }
    };
  }

  private async discoverRelevantMCPTools(request: ContextRequest): Promise<MCPTool[]> {
    const filter = this.createToolFilter(request);
    return await this.mcpClient.discoverTools(filter);
  }

  private async gatherMCPResources(request: ContextRequest): Promise<MCPResource[]> {
    const resources: MCPResource[] = [];

    // If specific resources are mentioned, fetch them
    if (request.resource_uris) {
      for (const uri of request.resource_uris) {
        try {
          const resource = await this.mcpClient.getResource(uri);
          resources.push(resource);
        } catch (error) {
          console.warn(`Failed to fetch resource ${uri}:`, error);
        }
      }
    }

    return resources;
  }

  private createToolFilter(request: ContextRequest): ToolFilter {
    return {
      categories: request.required_capabilities || [],
      keywords: this.extractKeywords(request.query),
      security_level: request.security_context?.level || 'authenticated'
    };
  }

  private extractKeywords(query: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10); // Limit to top 10 keywords
  }

  async executeContextualWorkflow(workflow: ContextualWorkflow): Promise<WorkflowResult> {
    const results: WorkflowStepResult[] = [];

    for (const step of workflow.steps) {
      if (step.type === 'mcp_tool_call') {
        const result = await this.mcpClient.executeTool(
          step.tool_name,
          step.parameters,
          { session: workflow.session }
        );
        
        results.push({
          step_id: step.id,
          success: result.success,
          data: result.data,
          duration: result.metadata?.duration
        });

        // Update context with results for next steps
        workflow.context = this.mergeContextWithResults(workflow.context, result);
      } else {
        // Handle other step types through existing functionality
        const result = await super.executeWorkflowStep(step, workflow.context);
        results.push(result);
      }
    }

    return {
      workflow_id: workflow.id,
      steps: results,
      overall_success: results.every(r => r.success),
      total_duration: results.reduce((sum, r) => sum + (r.duration || 0), 0)
    };
  }

  private mergeContextWithResults(context: AssembledContext, result: MCPToolResult): AssembledContext {
    return {
      ...context,
      dynamic_data: {
        ...context.dynamic_data,
        last_mcp_result: result.data,
        execution_history: [
          ...(context.dynamic_data?.execution_history || []),
          {
            timestamp: new Date(),
            result: result.data,
            metadata: result.metadata
          }
        ]
      }
    };
  }
}
```

## Agentic AI Patterns with MCP

### MCP-Enabled AI Agent

```typescript
// src/ai/mcp-agent.ts
import { LLMService } from '../services/llm/llm-service';
import { DADMSMCPClient } from '../shared/mcp/client';
import { EnhancedContextManager } from '../services/context-manager/enhanced-context-manager';

export class MCPEnabledAgent {
  private llm: LLMService;
  private mcpClient: DADMSMCPClient;
  private contextManager: EnhancedContextManager;

  constructor(
    llm: LLMService,
    mcpClient: DADMSMCPClient,
    contextManager: EnhancedContextManager
  ) {
    this.llm = llm;
    this.mcpClient = mcpClient;
    this.contextManager = contextManager;
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    // 1. Analyze request and determine required capabilities
    const analysis = await this.analyzeRequest(request);

    // 2. Discover and prepare tools
    const availableTools = await this.mcpClient.discoverTools({
      categories: analysis.required_capabilities,
      keywords: analysis.keywords
    });

    // 3. Assemble context with MCP resources
    const context = await this.contextManager.assembleContext({
      query: request.query,
      required_capabilities: analysis.required_capabilities,
      resource_uris: analysis.resource_references
    });

    // 4. Generate response with tool calling
    const response = await this.llm.generateWithTools({
      messages: [
        {
          role: 'system',
          content: this.createSystemPrompt(context, availableTools)
        },
        {
          role: 'user',
          content: request.query
        }
      ],
      tools: this.formatToolsForLLM(availableTools),
      tool_choice: 'auto'
    });

    // 5. Execute any tool calls
    const executedResponse = await this.executeToolCalls(response, availableTools);

    return {
      response: executedResponse.content,
      tools_used: executedResponse.tools_used,
      context_used: context,
      confidence: executedResponse.confidence
    };
  }

  private async analyzeRequest(request: AgentRequest): Promise<RequestAnalysis> {
    const analysisPrompt = `
    Analyze the following request and identify:
    1. Required capabilities (e.g., 'simulation', 'data_analysis', 'project_management')
    2. Key keywords for tool discovery
    3. Any resource references (URIs, IDs, file names)

    Request: ${request.query}

    Return a JSON object with: required_capabilities, keywords, resource_references
    `;

    const response = await this.llm.generate({
      messages: [{ role: 'user', content: analysisPrompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.content);
  }

  private createSystemPrompt(context: AssembledContext, tools: MCPTool[]): string {
    return `
    You are an intelligent agent with access to the DADMS platform and external tools via MCP.
    
    Available capabilities:
    ${tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}
    
    Context:
    - Project: ${context.project?.name || 'None'}
    - User: ${context.user?.name || 'Anonymous'}
    - Available resources: ${context.resources.length} items
    
    Guidelines:
    1. Use tools when needed to gather information or perform actions
    2. Combine multiple tools for complex workflows
    3. Always validate parameters before tool execution
    4. Provide clear explanations of your reasoning and actions
    `;
  }

  private formatToolsForLLM(tools: MCPTool[]): LLMTool[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  private async executeToolCalls(
    response: LLMResponse, 
    availableTools: MCPTool[]
  ): Promise<ExecutedResponse> {
    if (!response.tool_calls) {
      return {
        content: response.content,
        tools_used: [],
        confidence: response.confidence || 0.8
      };
    }

    const toolResults: ToolExecutionResult[] = [];

    for (const toolCall of response.tool_calls) {
      try {
        const result = await this.mcpClient.executeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );

        toolResults.push({
          tool_name: toolCall.function.name,
          success: result.success,
          result: result.data,
          duration: result.metadata?.duration
        });
      } catch (error) {
        toolResults.push({
          tool_name: toolCall.function.name,
          success: false,
          error: error.message
        });
      }
    }

    // Generate final response incorporating tool results
    const finalResponse = await this.synthesizeResponse(response, toolResults);

    return {
      content: finalResponse.content,
      tools_used: toolResults,
      confidence: finalResponse.confidence || 0.8
    };
  }

  private async synthesizeResponse(
    originalResponse: LLMResponse,
    toolResults: ToolExecutionResult[]
  ): Promise<LLMResponse> {
    const synthesisPrompt = `
    Original response: ${originalResponse.content}
    
    Tool execution results:
    ${toolResults.map(result => 
      `${result.tool_name}: ${result.success ? 'Success' : 'Failed'} - ${JSON.stringify(result.result || result.error)}`
    ).join('\n')}
    
    Synthesize a final response that incorporates the tool results and provides a comprehensive answer.
    `;

    return await this.llm.generate({
      messages: [{ role: 'user', content: synthesisPrompt }]
    });
  }
}
```

## Testing and Validation

### MCP Integration Tests

```typescript
// src/tests/mcp-integration.test.ts
import { DADMSMCPClient } from '../shared/mcp/client';
import { ProjectMCPServer } from '../services/project/mcp-server';
import { MCPGatewayService } from '../services/mcp-gateway/gateway-service';

describe('MCP Integration Tests', () => {
  let mcpClient: DADMSMCPClient;
  let projectServer: ProjectMCPServer;
  let gateway: MCPGatewayService;

  beforeAll(async () => {
    // Start test servers
    projectServer = new ProjectMCPServer();
    await projectServer.start();

    gateway = new MCPGatewayService();
    await gateway.start();

    // Initialize client
    mcpClient = new DADMSMCPClient({
      servers: [{
        id: 'test-project',
        name: 'Test Project Server',
        transport: 'http',
        endpoint: 'http://localhost:3026'
      }],
      security: { /* test config */ },
      performance: { timeout: 5000 }
    });

    await mcpClient.initialize();
  });

  afterAll(async () => {
    await projectServer.stop();
    // gateway.stop() - implement if needed
  });

  describe('Tool Discovery', () => {
    it('should discover available tools', async () => {
      const tools = await mcpClient.discoverTools();
      
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toContain('create-project');
      expect(tools.map(t => t.name)).toContain('get-project-status');
      expect(tools.map(t => t.name)).toContain('list-project-resources');
    });

    it('should filter tools by category', async () => {
      const tools = await mcpClient.discoverTools({
        categories: ['project_management']
      });

      expect(tools.length).toBeGreaterThan(0);
      tools.forEach(tool => {
        expect(tool.categories).toContain('project_management');
      });
    });
  });

  describe('Tool Execution', () => {
    it('should create a project successfully', async () => {
      const result = await mcpClient.executeTool('create-project', {
        name: 'Test Project',
        description: 'A test project for MCP integration'
      });

      expect(result.success).toBe(true);
      expect(result.metadata.project_id).toBeDefined();
    });

    it('should handle tool execution errors gracefully', async () => {
      await expect(
        mcpClient.executeTool('create-project', {
          // Missing required 'name' parameter
          description: 'Invalid project'
        })
      ).rejects.toThrow('Missing required parameter: name');
    });

    it('should get project status', async () => {
      // First create a project
      const createResult = await mcpClient.executeTool('create-project', {
        name: 'Status Test Project'
      });

      const projectId = createResult.metadata.project_id;

      // Then get its status
      const statusResult = await mcpClient.executeTool('get-project-status', {
        project_id: projectId
      });

      expect(statusResult.success).toBe(true);
      expect(statusResult.metadata.project_id).toBe(projectId);
    });
  });

  describe('Resource Access', () => {
    it('should access project resources', async () => {
      // Create a project first
      const createResult = await mcpClient.executeTool('create-project', {
        name: 'Resource Test Project'
      });

      const projectId = createResult.metadata.project_id;

      // Access project resource
      const resource = await mcpClient.getResource(`project://${projectId}`);

      expect(resource.uri).toBe(`project://${projectId}`);
      expect(resource.mimeType).toBe('application/json');
      expect(JSON.parse(resource.text)).toHaveProperty('id', projectId);
    });
  });

  describe('Agent Integration', () => {
    it('should enable agentic workflows with MCP tools', async () => {
      // This would test the MCPEnabledAgent class
      // Implementation depends on specific agent architecture
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent tool executions', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        mcpClient.executeTool('create-project', {
          name: `Concurrent Project ${i}`
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should implement proper timeout handling', async () => {
      // Test timeout behavior
      const startTime = Date.now();
      
      try {
        await mcpClient.executeTool('slow-operation', {});
      } catch (error) {
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(6000); // Should timeout before 6 seconds
        expect(error.message).toContain('timeout');
      }
    });
  });
});
```

This implementation guide provides the foundation for integrating MCP with DADMS, enabling powerful agentic AI capabilities through standardized tool and resource access. The modular architecture allows for incremental implementation and easy extension as the MCP ecosystem evolves.

## Next Steps

1. **Start with a simple MCP server** (Project Service)
2. **Implement the MCP Gateway** for centralized management
3. **Enhance Context Manager** with MCP capabilities
4. **Build the MCPEnabledAgent** for autonomous workflows
5. **Add comprehensive testing** and monitoring
6. **Contribute to the MCP ecosystem** with DADMS-specific servers

The integration positions DADMS as a leader in the AI decision intelligence space, providing seamless connectivity to any MCP-compatible tool or service.
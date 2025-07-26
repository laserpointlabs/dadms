# DADMS 2.0 Technical Implementation Guide

## Table of Contents
1. [Service Templates](#service-templates)
2. [Process Manager Implementation](#process-manager-implementation)
3. [API Gateway Implementation](#api-gateway-implementation)
4. [BPMN Integration Patterns](#bpmn-integration-patterns)
5. [Database Schemas](#database-schemas)
6. [Testing Strategy](#testing-strategy)

---

## Service Templates

### Base Service Template

```typescript
// src/services/base/BaseService.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import { Pool } from 'pg';

export abstract class BaseService {
  protected app: express.Application;
  protected redis: ReturnType<typeof createClient>;
  protected db: Pool;
  protected port: number;
  protected serviceName: string;

  constructor(serviceName: string, port: number) {
    this.serviceName = serviceName;
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  protected abstract setupRoutes(): void;

  protected async connectDatabases(): Promise<void> {
    // Redis connection
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await this.redis.connect();

    // PostgreSQL connection
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://dadms_user:dadms_password@localhost:5432/dadms'
    });
  }

  public async start(): Promise<void> {
    await this.connectDatabases();
    
    this.app.listen(this.port, () => {
      console.log(`${this.serviceName} running on port ${this.port}`);
    });
  }

  protected async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}
```

### Service Configuration Template

```typescript
// src/config/service.config.ts
export interface ServiceConfig {
  port: number;
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
  redis: {
    url: string;
  };
  camunda: {
    url: string;
    username: string;
    password: string;
  };
  eventManager: {
    url: string;
  };
}

export const getServiceConfig = (): ServiceConfig => ({
  port: parseInt(process.env.PORT || '3001'),
  database: {
    url: process.env.DATABASE_URL || 'postgresql://dadms_user:dadms_password@localhost:5432/dadms',
    pool: {
      min: 2,
      max: 10
    }
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  camunda: {
    url: process.env.CAMUNDA_URL || 'http://localhost:8080/engine-rest',
    username: process.env.CAMUNDA_USERNAME || 'admin',
    password: process.env.CAMUNDA_PASSWORD || 'admin'
  },
  eventManager: {
    url: process.env.EVENT_MANAGER_URL || 'http://localhost:3004'
  }
});
```

---

## Process Manager Implementation

### Core Process Manager Service

```typescript
// src/services/process-manager/ProcessManagerService.ts
import { BaseService } from '../base/BaseService';
import { CamundaClient } from './CamundaClient';
import { ProcessRepository } from './ProcessRepository';
import { TaskExecutor } from './TaskExecutor';

export class ProcessManagerService extends BaseService {
  private camundaClient: CamundaClient;
  private processRepository: ProcessRepository;
  private taskExecutor: TaskExecutor;

  constructor() {
    super('Process Manager Service', 3007);
    this.camundaClient = new CamundaClient();
    this.processRepository = new ProcessRepository();
    this.taskExecutor = new TaskExecutor();
  }

  protected setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      const health = await this.healthCheck();
      res.json(health);
    });

    // Process management
    this.app.post('/processes/deploy', this.deployProcess.bind(this));
    this.app.post('/processes/start', this.startProcess.bind(this));
    this.app.get('/processes/:id/status', this.getProcessStatus.bind(this));
    this.app.get('/processes/:id/tasks', this.getProcessTasks.bind(this));
    this.app.post('/tasks/:id/complete', this.completeTask.bind(this));

    // Process control
    this.app.post('/processes/:id/suspend', this.suspendProcess.bind(this));
    this.app.post('/processes/:id/resume', this.resumeProcess.bind(this));
    this.app.post('/processes/:id/terminate', this.terminateProcess.bind(this));
  }

  private async deployProcess(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { bpmnXml, processName } = req.body;
      
      // Validate BPMN XML
      const validationResult = await this.validateBpmnXml(bpmnXml);
      if (!validationResult.valid) {
        res.status(400).json({ error: 'Invalid BPMN XML', details: validationResult.errors });
        return;
      }

      // Deploy to Camunda
      const deploymentId = await this.camundaClient.deployProcess(bpmnXml, processName);
      
      // Store process metadata
      const processId = await this.processRepository.saveProcess({
        name: processName,
        deploymentId,
        bpmnXml,
        createdAt: new Date()
      });

      res.json({ processId, deploymentId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to deploy process', details: error.message });
    }
  }

  private async startProcess(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { processId, variables } = req.body;
      
      // Start process in Camunda
      const instanceId = await this.camundaClient.startProcess(processId, variables);
      
      // Store instance metadata
      await this.processRepository.saveProcessInstance({
        processId,
        instanceId,
        variables,
        status: 'RUNNING',
        startedAt: new Date()
      });

      res.json({ instanceId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start process', details: error.message });
    }
  }

  private async getProcessStatus(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const status = await this.camundaClient.getProcessStatus(id);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get process status', details: error.message });
    }
  }

  private async getProcessTasks(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const tasks = await this.camundaClient.getProcessTasks(id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get process tasks', details: error.message });
    }
  }

  private async completeTask(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { variables } = req.body;
      
      // Execute task if it's a service task
      const task = await this.camundaClient.getTask(id);
      if (task.type === 'service-task') {
        await this.taskExecutor.executeTask(task, variables);
      }
      
      // Complete task in Camunda
      await this.camundaClient.completeTask(id, variables);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete task', details: error.message });
    }
  }

  private async validateBpmnXml(bpmnXml: string): Promise<{ valid: boolean; errors?: string[] }> {
    // Basic BPMN validation
    const errors: string[] = [];
    
    if (!bpmnXml.includes('<bpmn:process')) {
      errors.push('Missing bpmn:process element');
    }
    
    if (!bpmnXml.includes('<bpmn:startEvent')) {
      errors.push('Missing start event');
    }
    
    if (!bpmnXml.includes('<bpmn:endEvent')) {
      errors.push('Missing end event');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}
```

### Camunda Client

```typescript
// src/services/process-manager/CamundaClient.ts
import axios from 'axios';
import { getServiceConfig } from '../../config/service.config';

export class CamundaClient {
  private baseUrl: string;
  private auth: { username: string; password: string };

  constructor() {
    const config = getServiceConfig();
    this.baseUrl = config.camunda.url;
    this.auth = {
      username: config.camunda.username,
      password: config.camunda.password
    };
  }

  async deployProcess(bpmnXml: string, processName: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', new Blob([bpmnXml], { type: 'application/xml' }), `${processName}.bpmn`);
    formData.append('deployment-name', processName);
    formData.append('enable-duplicate-filtering', 'true');

    const response = await axios.post(`${this.baseUrl}/deployment/create`, formData, {
      auth: this.auth,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.id;
  }

  async startProcess(processId: string, variables: any): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/process-definition/key/${processId}/start`, {
      variables: this.formatVariables(variables)
    }, { auth: this.auth });

    return response.data.id;
  }

  async getProcessStatus(instanceId: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/process-instance/${instanceId}`, {
      auth: this.auth
    });
    return response.data;
  }

  async getProcessTasks(instanceId: string): Promise<any[]> {
    const response = await axios.get(`${this.baseUrl}/task`, {
      params: { processInstanceId: instanceId },
      auth: this.auth
    });
    return response.data;
  }

  async getTask(taskId: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/task/${taskId}`, {
      auth: this.auth
    });
    return response.data;
  }

  async completeTask(taskId: string, variables: any): Promise<void> {
    await axios.post(`${this.baseUrl}/task/${taskId}/complete`, {
      variables: this.formatVariables(variables)
    }, { auth: this.auth });
  }

  private formatVariables(variables: any): any {
    const formatted: any = {};
    for (const [key, value] of Object.entries(variables)) {
      formatted[key] = {
        value: value,
        type: typeof value === 'string' ? 'String' : 'Object'
      };
    }
    return formatted;
  }
}
```

---

## API Gateway Implementation

### Gateway Service

```typescript
// src/services/api-gateway/APIGatewayService.ts
import { BaseService } from '../base/BaseService';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import { RateLimitMiddleware } from './middleware/RateLimitMiddleware';
import { RequestRouter } from './RequestRouter';
import { WorkflowOrchestrator } from './WorkflowOrchestrator';

export class APIGatewayService extends BaseService {
  private authMiddleware: AuthMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private requestRouter: RequestRouter;
  private workflowOrchestrator: WorkflowOrchestrator;

  constructor() {
    super('DADMS API Gateway', 3000);
    this.authMiddleware = new AuthMiddleware();
    this.rateLimitMiddleware = new RateLimitMiddleware();
    this.requestRouter = new RequestRouter();
    this.workflowOrchestrator = new WorkflowOrchestrator();
  }

  protected setupRoutes(): void {
    // Apply global middleware
    this.app.use(this.authMiddleware.authenticate.bind(this.authMiddleware));
    this.app.use(this.rateLimitMiddleware.limit.bind(this.rateLimitMiddleware));

    // Health and monitoring
    this.app.get('/health', async (req, res) => {
      const health = await this.healthCheck();
      res.json(health);
    });

    this.app.get('/metrics', this.getMetrics.bind(this));

    // High-level business operations
    this.app.post('/api/v1/rag/query', this.handleRagQuery.bind(this));
    this.app.post('/api/v1/llm/generate', this.handleLlmGenerate.bind(this));
    this.app.post('/api/v1/simulation/run', this.handleSimulationRun.bind(this));

    // Workflow orchestration
    this.app.post('/api/v1/workflows/deploy', this.handleWorkflowDeploy.bind(this));
    this.app.post('/api/v1/workflows/execute', this.handleWorkflowExecute.bind(this));
    this.app.get('/api/v1/workflows/:id', this.handleWorkflowStatus.bind(this));
    this.app.get('/api/v1/workflows/:id/history', this.handleWorkflowHistory.bind(this));

    // Service access (for advanced users)
    this.app.all('/api/v1/services/:service/*', this.handleServiceProxy.bind(this));

    // WebSocket for real-time updates
    this.setupWebSocket();
  }

  private async handleRagQuery(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { query, documents, model } = req.body;
      
      // Execute RAG workflow
      const workflowId = await this.workflowOrchestrator.executeRagWorkflow({
        query,
        documents,
        model
      });

      res.json({ workflowId, status: 'started' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to execute RAG query', details: error.message });
    }
  }

  private async handleLlmGenerate(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { prompt, model, parameters } = req.body;
      
      // Execute LLM workflow
      const workflowId = await this.workflowOrchestrator.executeLlmWorkflow({
        prompt,
        model,
        parameters
      });

      res.json({ workflowId, status: 'started' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to execute LLM generation', details: error.message });
    }
  }

  private async handleWorkflowExecute(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { workflow_id, parameters } = req.body;
      
      const workflowId = await this.workflowOrchestrator.executeWorkflow(workflow_id, parameters);
      res.json({ workflowId, status: 'started' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to execute workflow', details: error.message });
    }
  }

  private async handleServiceProxy(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { service } = req.params;
      const path = req.params[0];
      
      const response = await this.requestRouter.routeRequest(service, req.method, path, req.body);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Service proxy failed', details: error.message });
    }
  }

  private setupWebSocket(): void {
    // WebSocket setup for real-time updates
    // Implementation details...
  }

  private async getMetrics(req: express.Request, res: express.Response): Promise<void> {
    const metrics = await this.collectMetrics();
    res.json(metrics);
  }

  private async collectMetrics(): Promise<any> {
    // Collect system metrics
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      requests: await this.redis.get('gateway:requests') || 0
    };
  }
}
```

---

## BPMN Integration Patterns

### Workflow Templates

```typescript
// src/templates/workflow-templates.ts
export const WorkflowTemplates = {
  RAG_PIPELINE: `
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="rag-pipeline" name="RAG Pipeline">
    <bpmn:startEvent id="start" name="Start">
      <bpmn:outgoing>flow1</bpmn:outgoing>
    </bpmn:startEvent>
    
    <bpmn:userTask id="upload" name="Document Upload">
      <bpmn:incoming>flow1</bpmn:incoming>
      <bpmn:outgoing>flow2</bpmn:outgoing>
    </bpmn:userTask>
    
    <bpmn:serviceTask id="process" name="Process Document" 
                      camunda:class="com.dadms.tasks.DocumentProcessingTask">
      <bpmn:incoming>flow2</bpmn:incoming>
      <bpmn:outgoing>flow3</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="vectorize" name="Vectorize Content"
                      camunda:class="com.dadms.tasks.VectorizationTask">
      <bpmn:incoming>flow3</bpmn:incoming>
      <bpmn:outgoing>flow4</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="store" name="Store in Qdrant"
                      camunda:class="com.dadms.tasks.StorageTask">
      <bpmn:incoming>flow4</bpmn:incoming>
      <bpmn:outgoing>flow5</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="query" name="Query Processing"
                      camunda:class="com.dadms.tasks.QueryTask">
      <bpmn:incoming>flow5</bpmn:incoming>
      <bpmn:outgoing>flow6</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="generate" name="LLM Generation"
                      camunda:class="com.dadms.tasks.LLMGenerationTask">
      <bpmn:incoming>flow6</bpmn:incoming>
      <bpmn:outgoing>flow7</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:endEvent id="end" name="End">
      <bpmn:incoming>flow7</bpmn:incoming>
    </bpmn:endEvent>
    
    <bpmn:sequenceFlow id="flow1" sourceRef="start" targetRef="upload" />
    <bpmn:sequenceFlow id="flow2" sourceRef="upload" targetRef="process" />
    <bpmn:sequenceFlow id="flow3" sourceRef="process" targetRef="vectorize" />
    <bpmn:sequenceFlow id="flow4" sourceRef="vectorize" targetRef="store" />
    <bpmn:sequenceFlow id="flow5" sourceRef="store" targetRef="query" />
    <bpmn:sequenceFlow id="flow6" sourceRef="query" targetRef="generate" />
    <bpmn:sequenceFlow id="flow7" sourceRef="generate" targetRef="end" />
  </bpmn:process>
</bpmn:definitions>
  `,

  LLM_PIPELINE: `
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="llm-pipeline" name="LLM Pipeline">
    <bpmn:startEvent id="start" name="Start">
      <bpmn:outgoing>flow1</bpmn:outgoing>
    </bpmn:startEvent>
    
    <bpmn:serviceTask id="validate" name="Input Validation"
                      camunda:class="com.dadms.tasks.ValidationTask">
      <bpmn:incoming>flow1</bpmn:incoming>
      <bpmn:outgoing>flow2</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="select-model" name="Model Selection"
                      camunda:class="com.dadms.tasks.ModelSelectionTask">
      <bpmn:incoming>flow2</bpmn:incoming>
      <bpmn:outgoing>flow3</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="engineer-prompt" name="Prompt Engineering"
                      camunda:class="com.dadms.tasks.PromptEngineeringTask">
      <bpmn:incoming>flow3</bpmn:incoming>
      <bpmn:outgoing>flow4</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="generate" name="LLM Generation"
                      camunda:class="com.dadms.tasks.LLMGenerationTask">
      <bpmn:incoming>flow4</bpmn:incoming>
      <bpmn:outgoing>flow5</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:serviceTask id="validate-response" name="Response Validation"
                      camunda:class="com.dadms.tasks.ResponseValidationTask">
      <bpmn:incoming>flow5</bpmn:incoming>
      <bpmn:outgoing>flow6</bpmn:outgoing>
    </bpmn:serviceTask>
    
    <bpmn:endEvent id="end" name="End">
      <bpmn:incoming>flow6</bpmn:incoming>
    </bpmn:endEvent>
    
    <bpmn:sequenceFlow id="flow1" sourceRef="start" targetRef="validate" />
    <bpmn:sequenceFlow id="flow2" sourceRef="validate" targetRef="select-model" />
    <bpmn:sequenceFlow id="flow3" sourceRef="select-model" targetRef="engineer-prompt" />
    <bpmn:sequenceFlow id="flow4" sourceRef="engineer-prompt" targetRef="generate" />
    <bpmn:sequenceFlow id="flow5" sourceRef="generate" targetRef="validate-response" />
    <bpmn:sequenceFlow id="flow6" sourceRef="validate-response" targetRef="end" />
  </bpmn:process>
</bpmn:definitions>
  `
};
```

---

## Database Schemas

### Core Tables

```sql
-- Process definitions
CREATE TABLE process_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    bpmn_xml TEXT NOT NULL,
    deployment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, version)
);

-- Process instances
CREATE TABLE process_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_definition_id UUID REFERENCES process_definitions(id),
    camunda_instance_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL,
    variables JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_by UUID,
    metadata JSONB
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_instance_id UUID REFERENCES process_instances(id),
    camunda_task_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    variables JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    assigned_to UUID
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    metadata JSONB
);

-- Webhooks
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url VARCHAR(500) NOT NULL,
    events TEXT[] NOT NULL,
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at TIMESTAMP
);

-- API keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_id UUID,
    permissions JSONB,
    rate_limit INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/tests/unit/ProcessManager.test.ts
import { ProcessManagerService } from '../../services/process-manager/ProcessManagerService';
import { CamundaClient } from '../../services/process-manager/CamundaClient';

describe('ProcessManagerService', () => {
  let service: ProcessManagerService;
  let mockCamundaClient: jest.Mocked<CamundaClient>;

  beforeEach(() => {
    mockCamundaClient = {
      deployProcess: jest.fn(),
      startProcess: jest.fn(),
      getProcessStatus: jest.fn(),
      getProcessTasks: jest.fn(),
      completeTask: jest.fn()
    } as any;

    service = new ProcessManagerService();
    (service as any).camundaClient = mockCamundaClient;
  });

  describe('deployProcess', () => {
    it('should deploy valid BPMN process', async () => {
      const bpmnXml = WorkflowTemplates.RAG_PIPELINE;
      const processName = 'test-process';

      mockCamundaClient.deployProcess.mockResolvedValue('deployment-123');

      const result = await service.deployProcess(bpmnXml, processName);

      expect(result.processId).toBeDefined();
      expect(result.deploymentId).toBe('deployment-123');
      expect(mockCamundaClient.deployProcess).toHaveBeenCalledWith(bpmnXml, processName);
    });

    it('should reject invalid BPMN XML', async () => {
      const invalidBpmn = '<invalid>xml</invalid>';

      await expect(service.deployProcess(invalidBpmn, 'test')).rejects.toThrow();
    });
  });
});
```

### Integration Tests

```typescript
// src/tests/integration/WorkflowExecution.test.ts
import { APIGatewayService } from '../../services/api-gateway/APIGatewayService';
import { ProcessManagerService } from '../../services/process-manager/ProcessManagerService';

describe('Workflow Execution Integration', () => {
  let apiGateway: APIGatewayService;
  let processManager: ProcessManagerService;

  beforeAll(async () => {
    // Start services
    apiGateway = new APIGatewayService();
    processManager = new ProcessManagerService();
    
    await apiGateway.start();
    await processManager.start();
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should execute RAG workflow end-to-end', async () => {
    const response = await fetch('http://localhost:3000/api/v1/rag/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key'
      },
      body: JSON.stringify({
        query: 'What is the stress analysis?',
        documents: ['test-doc.pdf'],
        model: 'gpt-4'
      })
    });

    const result = await response.json();
    expect(result.workflowId).toBeDefined();
    expect(result.status).toBe('started');
  });
});
```

---

## Deployment Configuration

### Docker Compose Service

```yaml
# docker-compose.yml addition
services:
  api-gateway:
    build: 
      context: ./dadms-services/api-gateway
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://dadms_user:dadms_password@postgres:5432/dadms
      - REDIS_URL=redis://redis:6379
      - CAMUNDA_URL=http://camunda:8080/engine-rest
    depends_on:
      - postgres
      - redis
      - camunda

  process-manager:
    build:
      context: ./dadms-services/process-manager
      dockerfile: Dockerfile
    ports:
      - "3007:3007"
    environment:
      - DATABASE_URL=postgresql://dadms_user:dadms_password@postgres:5432/dadms
      - REDIS_URL=redis://redis:6379
      - CAMUNDA_URL=http://camunda:8080/engine-rest
    depends_on:
      - postgres
      - redis
      - camunda
```

This technical implementation guide provides the foundation for building the DADMS backend with BPMN-first orchestration and API Gateway architecture. The next step would be to implement these services following the patterns outlined here. 
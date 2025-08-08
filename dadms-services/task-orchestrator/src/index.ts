import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { handlers } from './services/handlers';
import { ExternalTaskWorker } from './services/worker';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3017;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'task-orchestrator',
        port: PORT,
        timestamp: new Date().toISOString(),
    });
});

app.get('/api', (_req: Request, res: Response) => {
    res.json({
        service: 'Task Orchestrator',
        version: '0.1.0',
        endpoints: {
            health: '/health',
            workflows: '/workflows',
        },
        timestamp: new Date().toISOString(),
    });
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Task Orchestrator listening on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Optional in-process worker (enabled via ORCH_RUN_WORKER=true)
if (process.env.ORCH_RUN_WORKER === 'true') {
    const camundaUrl = process.env.CAMUNDA_URL || 'http://localhost:8080/engine-rest';
    const workerId = process.env.WORKER_ID || 'dadms-orchestrator';

    const topics = [
        'standards_ingestion',
        'ontology_extraction',
        'ontology_alignment',
        'pipeline_generation',
        'visualization_prototype',
        'semantic_testing',
    ];

    const worker = new ExternalTaskWorker({
        camundaUrl,
        workerId,
        topics,
        lockDurationMs: 60000,
        longPollMs: 30000,
        maxTasks: 5,
    });

    // register handlers
    for (const t of topics) {
        const h = (handlers as any)[t];
        if (typeof h === 'function') worker.on(t, h);
    }

    worker.start().catch((e) => console.error('[worker] fatal', e));

    process.on('SIGINT', () => {
        worker.stop();
        server.close(() => process.exit(0));
    });
    process.on('SIGTERM', () => {
        worker.stop();
        server.close(() => process.exit(0));
    });
}

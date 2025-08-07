import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';

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

app.listen(PORT, () => {
    console.log(`🚀 Task Orchestrator listening on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

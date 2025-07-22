import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { closeDatabase, connectDatabase } from './database/connection';
import routes from './routes';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env['PORT'] || 3016;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger documentation placeholder
// TODO: Implement full OpenAPI documentation
app.use('/api-docs', (req, res) => {
    res.json({
        message: 'API documentation will be available here',
        service: 'DADMS Ontology Workspace Service',
        version: '1.0.0',
        openapi_spec: '/api/ontology_workspace_service_openapi.yaml'
    });
});

// Routes
app.use('/', routes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);

    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: err.message
        });
    } else if (err.name === 'MulterError') {
        res.status(400).json({
            success: false,
            error: 'File Upload Error',
            message: err.message
        });
    } else {
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong'
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        available_endpoints: {
            api_info: '/api',
            health: '/health',
            workspaces: '/workspaces',
            cemento_status: '/integrations/cemento/status'
        }
    });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    console.log('📦 SIGTERM received, shutting down gracefully');
    await closeDatabase();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('📦 SIGINT received, shutting down gracefully');
    await closeDatabase();
    process.exit(0);
});

// Start server
async function startServer(): Promise<void> {
    try {
        // Connect to database
        await connectDatabase();

        // Start HTTP server
        const server = app.listen(PORT, () => {
            console.log('🎯 DADMS Ontology Workspace Service Starting...');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`📋 API info: http://localhost:${PORT}/api`);
            console.log(`🔧 Environment: ${process.env['NODE_ENV'] || 'development'}`);
            console.log('✨ Features enabled:');
            console.log('   📝 Workspace Management');
            console.log('   🎨 Visual Ontology Editing');
            console.log('   🖼️  draw.io Integration');
            console.log('   🔧 Cemento Integration');
            console.log('   ✅ Ontology Validation');
            console.log('   💬 Collaboration Features');
        });

        // Server error handling
        server.on('error', (error: any) => {
            if (error.syscall !== 'listen') {
                throw error;
            }

            const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

            switch (error.code) {
                case 'EACCES':
                    console.error(`❌ ${bind} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(`❌ ${bind} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Export app for testing
export default app;

// Start the server if this file is run directly
if (require.main === module) {
    startServer().catch((error) => {
        console.error('❌ Unhandled error during startup:', error);
        process.exit(1);
    });
} 
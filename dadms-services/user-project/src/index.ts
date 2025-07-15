import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { closeDatabase, connectDatabase } from './database/connection';
import { errorHandler, notFoundHandler } from './middleware/validation';
import projectRoutes from './routes/projects';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env['PORT'] || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // HTTP request logging
app.use(express.json({ limit: '10mb' })); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DADMS User & Project Service API'
}));

// Routes
app.use('/api/projects', projectRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'user-project-service',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// API info endpoint
app.get('/api', (_req, res) => {
    res.json({
        service: 'DADMS User & Project Service',
        version: '1.0.0',
        endpoints: {
            projects: '/api/projects',
            health: '/health'
        },
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
    try {
        // Connect to database
        await connectDatabase();

        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`🚀 User/Project Service running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`📋 API endpoints: http://localhost:${PORT}/api`);
            console.log(`🔧 Environment: ${process.env['NODE_ENV'] || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM signal received. Shutting down gracefully...');
    await closeDatabase();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT signal received. Shutting down gracefully...');
    await closeDatabase();
    process.exit(0);
});

// Start the server
startServer().catch((error) => {
    console.error('❌ Unhandled error during startup:', error);
    process.exit(1);
}); 
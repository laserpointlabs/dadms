import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { EventBus } from './event-bus';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

// Initialize event bus
const eventBus = new EventBus({
    host: 'localhost',
    port: PORT
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'event-bus',
        timestamp: new Date().toISOString(),
        subscribers: eventBus.getSubscribers().length
    });
});

// Register subscriber
app.post('/subscribe', (req, res) => {
    try {
        const { service_name, event_types, endpoint, enabled } = req.body;

        if (!service_name || !event_types || !endpoint) {
            return res.status(400).json({
                success: false,
                error: 'service_name, event_types, and endpoint are required'
            });
        }

        eventBus.registerSubscriber({
            service_name,
            event_types,
            endpoint,
            enabled: enabled !== false
        });

        return res.json({
            success: true,
            message: 'Subscriber registered successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// Unregister subscriber
app.post('/unsubscribe', (req, res) => {
    try {
        const { service_name } = req.body;

        if (!service_name) {
            return res.status(400).json({
                success: false,
                error: 'service_name is required'
            });
        }

        eventBus.unregisterSubscriber(service_name);

        return res.json({
            success: true,
            message: 'Subscriber unregistered successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// Get subscribers
app.get('/subscribers', (req, res) => {
    try {
        const subscribers = eventBus.getSubscribers();
        res.json({
            success: true,
            data: subscribers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// Publish event
app.post('/publish', async (req, res) => {
    try {
        const event = req.body;

        if (!event || !event.event_type) {
            return res.status(400).json({
                success: false,
                error: 'Invalid event format'
            });
        }

        const result = await eventBus.publishEvent(event);
        return res.json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Event Bus running on port ${PORT}`);
}); 
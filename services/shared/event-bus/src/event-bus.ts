import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { Event, EventBusConfig, EventBusResponse, EventSubscriber } from './types';

export class EventBus {
    private client: AxiosInstance;
    private logger: winston.Logger;
    private subscribers: Map<string, EventSubscriber> = new Map();

    constructor(config: EventBusConfig) {
        this.client = axios.create({
            baseURL: `http://${config.host}:${config.port}`,
            timeout: config.timeout || 5000,
        });

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'event-bus' },
            transports: [
                new winston.transports.File({ filename: 'logs/event-bus-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/event-bus.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }

    async publishEvent(event: Omit<Event, 'event_id' | 'timestamp'>): Promise<EventBusResponse> {
        const fullEvent: Event = {
            ...event,
            event_id: uuidv4(),
            timestamp: new Date().toISOString()
        };

        try {
            this.logger.info('Publishing event', { event_id: fullEvent.event_id, event_type: fullEvent.event_type });

            // Send to all subscribers that are interested in this event type
            const promises = Array.from(this.subscribers.values())
                .filter(sub => sub.enabled && sub.event_types.includes(fullEvent.event_type))
                .map(sub => this.sendToSubscriber(sub, fullEvent));

            await Promise.allSettled(promises);

            return {
                success: true,
                message: 'Event published successfully',
                data: fullEvent
            };
        } catch (error) {
            this.logger.error('Failed to publish event', { error, event_id: fullEvent.event_id });
            return {
                success: false,
                message: 'Failed to publish event',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async sendToSubscriber(subscriber: EventSubscriber, event: Event): Promise<void> {
        try {
            await this.client.post(subscriber.endpoint, event, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Event-Source': 'event-bus'
                }
            });
            this.logger.debug('Event sent to subscriber', {
                subscriber: subscriber.service_name,
                event_id: event.event_id
            });
        } catch (error) {
            this.logger.error('Failed to send event to subscriber', {
                subscriber: subscriber.service_name,
                event_id: event.event_id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    registerSubscriber(subscriber: EventSubscriber): void {
        this.subscribers.set(subscriber.service_name, subscriber);
        this.logger.info('Subscriber registered', {
            service: subscriber.service_name,
            event_types: subscriber.event_types
        });
    }

    unregisterSubscriber(serviceName: string): void {
        this.subscribers.delete(serviceName);
        this.logger.info('Subscriber unregistered', { service: serviceName });
    }

    getSubscribers(): EventSubscriber[] {
        return Array.from(this.subscribers.values());
    }

    async healthCheck(): Promise<EventBusResponse> {
        try {
            const response = await this.client.get('/health');
            return {
                success: true,
                message: 'Event bus is healthy',
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                message: 'Event bus health check failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
} 
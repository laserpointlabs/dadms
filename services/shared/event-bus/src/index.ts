export { EventBus } from './event-bus';
export * from './types';

// Start the server when this module is run directly
if (require.main === module) {
    require('./server');
}

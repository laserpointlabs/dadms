import io, { Socket } from 'socket.io-client';

class WebSocketService {
    private socket: Socket | null = null;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private listeners: Map<string, Function[]> = new Map();

    constructor() {
        this.connect();
    }

    connect() {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8001';

        this.socket = io(wsUrl, {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: this.maxReconnectAttempts,
            timeout: 5000,
        });

        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connection_status', { connected: true });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from WebSocket server:', reason);
            this.isConnected = false;
            this.emit('connection_status', { connected: false, reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.reconnectAttempts++;
            this.emit('connection_error', { error, attempts: this.reconnectAttempts });
        });

        // System monitoring events
        this.socket.on('system_status_update', (data) => {
            this.emit('system_status_update', data);
        });

        this.socket.on('service_status_change', (data) => {
            this.emit('service_status_change', data);
        });

        this.socket.on('process_update', (data) => {
            this.emit('process_update', data);
        });

        // Analysis events
        this.socket.on('analysis_started', (data) => {
            this.emit('analysis_started', data);
        });

        this.socket.on('analysis_progress', (data) => {
            this.emit('analysis_progress', data);
        });

        this.socket.on('analysis_completed', (data) => {
            this.emit('analysis_completed', data);
        });

        this.socket.on('analysis_failed', (data) => {
            this.emit('analysis_failed', data);
        });

        // Thread events
        this.socket.on('thread_message', (data) => {
            this.emit('thread_message', data);
        });

        this.socket.on('thread_update', (data) => {
            this.emit('thread_update', data);
        });

        // CLI events
        this.socket.on('command_output', (data) => {
            this.emit('command_output', data);
        });

        this.socket.on('command_completed', (data) => {
            this.emit('command_completed', data);
        });

        // AI Chat events
        this.socket.on('ai_response', (data) => {
            this.emit('ai_response', data);
        });

        this.socket.on('ai_thinking', (data) => {
            this.emit('ai_thinking', data);
        });

        // Log events
        this.socket.on('log_entry', (data) => {
            this.emit('log_entry', data);
        });

        // Error events
        this.socket.on('error', (data) => {
            console.error('WebSocket error:', data);
            this.emit('error', data);
        });
    }

    // Subscribe to events
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    // Unsubscribe from events
    off(event: string, callback?: Function) {
        if (!this.listeners.has(event)) return;

        if (callback) {
            const callbacks = this.listeners.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        } else {
            this.listeners.delete(event);
        }
    }

    // Emit events to listeners
    private emit(event: string, data: any) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)!.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in WebSocket event callback:', error);
                }
            });
        }
    }

    // Send data to server
    send(event: string, data: any) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        } else {
            console.warn('WebSocket not connected, cannot send data');
        }
    }

    // Join specific rooms for targeted updates
    joinRoom(room: string) {
        this.send('join_room', { room });
    }

    leaveRoom(room: string) {
        this.send('leave_room', { room });
    }

    // Subscribe to analysis updates
    subscribeToAnalysis(analysisId: string) {
        this.joinRoom(`analysis_${analysisId}`);
    }

    unsubscribeFromAnalysis(analysisId: string) {
        this.leaveRoom(`analysis_${analysisId}`);
    }

    // Subscribe to thread updates
    subscribeToThread(threadId: string) {
        this.joinRoom(`thread_${threadId}`);
    }

    unsubscribeFromThread(threadId: string) {
        this.leaveRoom(`thread_${threadId}`);
    }

    // Subscribe to system monitoring
    subscribeToSystemMonitoring() {
        this.joinRoom('system_monitoring');
    }

    unsubscribeFromSystemMonitoring() {
        this.leaveRoom('system_monitoring');
    }

    // Execute CLI command via WebSocket
    executeCommand(command: string, args: string[] = []) {
        this.send('execute_command', { command, args });
    }

    // Send AI chat message
    sendAIMessage(message: string, threadId?: string, sessionId?: string) {
        this.send('ai_message', { message, thread_id: threadId, session_id: sessionId });
    }

    // Get connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            attempts: this.reconnectAttempts,
        };
    }

    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Reconnect
    reconnect() {
        this.disconnect();
        this.connect();
    }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;

// Hook for React components
export const useWebSocket = () => {
    return webSocketService;
};

import axios, { AxiosResponse } from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Types
export interface CLICommand {
    command: string;
    args?: string[];
    description: string;
    category: 'analysis' | 'process' | 'deploy' | 'monitor' | 'system';
}

export interface SystemStatus {
    service: string;
    status: 'healthy' | 'unhealthy' | 'warning';
    uptime: string;
    cpu_usage: number;
    memory_usage: number;
    last_check: string;
}

export interface AnalysisData {
    id: string;
    name: string;
    status: 'running' | 'completed' | 'failed' | 'pending';
    created_at: string;
    completed_at?: string;
    results?: any;
    thread_id?: string;
}

export interface ThreadData {
    thread_id: string;
    analysis_id: string;
    created_at: string;
    updated_at: string;
    status: string;
    context_data: any;
    messages: any[];
    metadata: any;
}

// CLI Service
export const cliService = {
    executeCommand: async (command: string, args: string[] = []): Promise<AxiosResponse<any>> => {
        return api.post('/api/cli/execute', { command, args });
    },

    getAvailableCommands: async (): Promise<AxiosResponse<CLICommand[]>> => {
        return api.get('/api/cli/commands');
    },

    getCommandHistory: async (): Promise<AxiosResponse<any[]>> => {
        return api.get('/api/cli/history');
    },
};

// System Monitoring Service
export const monitorService = {
    getSystemStatus: async (): Promise<AxiosResponse<SystemStatus[]>> => {
        return api.get('/api/monitor/status');
    },

    getServiceLogs: async (service: string, lines: number = 100): Promise<AxiosResponse<string[]>> => {
        return api.get(`/api/monitor/logs/${service}?lines=${lines}`);
    },

    getMetrics: async (timeRange: string = '1h'): Promise<AxiosResponse<any>> => {
        return api.get(`/api/monitor/metrics?range=${timeRange}`);
    },

    getProcesses: async (): Promise<AxiosResponse<any[]>> => {
        return api.get('/api/monitor/processes');
    },
};

// Analysis Service
export const analysisService = {
    listAnalyses: async (): Promise<AxiosResponse<AnalysisData[]>> => {
        return api.get('/api/analysis/list');
    },

    getAnalysis: async (id: string): Promise<AxiosResponse<AnalysisData>> => {
        return api.get(`/api/analysis/${id}`);
    },

    runAnalysis: async (config: any): Promise<AxiosResponse<any>> => {
        return api.post('/api/analysis/run', config);
    },

    getAnalysisResults: async (id: string): Promise<AxiosResponse<any>> => {
        return api.get(`/api/analysis/${id}/results`);
    },

    exportAnalysis: async (id: string, format: string = 'json'): Promise<AxiosResponse<any>> => {
        return api.get(`/api/analysis/${id}/export?format=${format}`);
    },

    deleteAnalysis: async (id: string): Promise<AxiosResponse<any>> => {
        return api.delete(`/api/analysis/${id}`);
    },
};

// Thread Service
export const threadService = {
    listThreads: async (): Promise<AxiosResponse<ThreadData[]>> => {
        return api.get('/api/threads/list');
    },

    getThread: async (threadId: string): Promise<AxiosResponse<ThreadData>> => {
        return api.get(`/api/threads/${threadId}`);
    },

    getThreadMessages: async (threadId: string): Promise<AxiosResponse<any[]>> => {
        return api.get(`/api/threads/${threadId}/messages`);
    },

    addThreadMessage: async (threadId: string, message: any): Promise<AxiosResponse<any>> => {
        return api.post(`/api/threads/${threadId}/messages`, message);
    },

    searchThreads: async (query: string): Promise<AxiosResponse<ThreadData[]>> => {
        return api.get(`/api/threads/search?q=${encodeURIComponent(query)}`);
    },
};

// AI Chat Service
export const aiChatService = {
    sendMessage: async (message: string, threadId?: string): Promise<AxiosResponse<any>> => {
        return api.post('/api/ai/chat', { message, thread_id: threadId });
    },

    getChatHistory: async (sessionId?: string): Promise<AxiosResponse<any[]>> => {
        return api.get(`/api/ai/history${sessionId ? `?session=${sessionId}` : ''}`);
    },

    createChatSession: async (mode: string, threadId?: string): Promise<AxiosResponse<any>> => {
        return api.post('/api/ai/session', { mode, thread_id: threadId });
    },

    getAvailableModels: async (): Promise<AxiosResponse<any[]>> => {
        return api.get('/api/ai/models');
    },
};

// Dashboard Service
export const dashboardService = {
    getOverview: async (): Promise<AxiosResponse<any>> => {
        return api.get('/api/dashboard/overview');
    },

    getRecentActivity: async (limit: number = 10): Promise<AxiosResponse<any[]>> => {
        return api.get(`/api/dashboard/activity?limit=${limit}`);
    },

    getSystemHealth: async (): Promise<AxiosResponse<any>> => {
        return api.get('/api/dashboard/health');
    },
};

export default api;

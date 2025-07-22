/**
 * API Type Definitions
 * Comprehensive types for DADMS service integration
 */

// Generic API response wrapper
export interface ApiResponse<T> {
    data: T;
    status: 'success' | 'error';
    message?: string;
    timestamp: string;
    requestId?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// Error response
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
}

// Common entity interfaces
export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
}

// Metadata interface
export interface Metadata {
    [key: string]: any;
}

// File upload response
export interface FileUpload {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
}

// Common query parameters
export interface QueryParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}

// Service health check
export interface ServiceHealth {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    lastCheck: string;
    dependencies?: {
        name: string;
        status: 'up' | 'down';
    }[];
} 
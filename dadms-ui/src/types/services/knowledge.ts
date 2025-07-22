/**
 * Knowledge Service Type Definitions
 */

import { BaseEntity, Metadata } from '../api';

// Domain interface
export interface Domain extends BaseEntity {
    name: string;
    description: string;
    parentId?: string;
    projectIds: string[];
    metadata: Metadata;
}

// Tag interface
export interface Tag extends BaseEntity {
    name: string;
    description?: string;
    domainIds: string[];
    color?: string;
    metadata: Metadata;
}

// Document interface
export interface KnowledgeDocument extends BaseEntity {
    name: string;
    description?: string;
    projectId?: string;
    domainIds: string[];
    tagIds: string[];
    content?: string;
    fileInfo: {
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
    };
    processing: {
        status: 'pending' | 'processing' | 'completed' | 'failed';
        extractedText?: string;
        embeddings?: boolean;
        processedAt?: string;
        error?: string;
    };
    metadata: Metadata;
}

// Search result
export interface SearchResult {
    documentId: string;
    documentName: string;
    snippet: string;
    score: number;
    highlights: string[];
    metadata: {
        projectName?: string;
        domainNames: string[];
        tagNames: string[];
    };
}

// API request/response types
export interface CreateDomainRequest {
    name: string;
    description: string;
    parentId?: string;
    projectIds?: string[];
    metadata?: Metadata;
}

export interface CreateTagRequest {
    name: string;
    description?: string;
    domainIds: string[];
    color?: string;
    metadata?: Metadata;
}

export interface UploadDocumentRequest {
    file: File;
    projectId?: string;
    domainIds: string[];
    tagIds?: string[];
    description?: string;
    metadata?: Metadata;
}

export interface SearchRequest {
    query: string;
    projectId?: string;
    domainIds?: string[];
    tagIds?: string[];
    limit?: number;
    offset?: number;
    includeContent?: boolean;
}

export interface SearchResponse {
    results: SearchResult[];
    total: number;
    query: string;
    processingTime: number;
} 
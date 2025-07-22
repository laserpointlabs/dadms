/**
 * Project Service Type Definitions
 */

import { BaseEntity, Metadata } from '../api';

// Project status enum
export enum ProjectStatus {
    Active = 'active',
    Completed = 'completed',
    OnHold = 'on_hold',
    Cancelled = 'cancelled',
}

// Project interface
export interface Project extends BaseEntity {
    name: string;
    description: string;
    status: ProjectStatus;
    knowledgeDomain: string;
    decisionContext: string;
    ownerId: string;
    tags: string[];
    metadata: Metadata;

    // Relationships
    teamMembers?: TeamMember[];
    associatedObjects?: ProjectObject[];
    statistics?: ProjectStatistics;
}

// Team member interface
export interface TeamMember {
    userId: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    joinedAt: string;
    permissions: string[];
}

// Project object types
export enum ProjectObjectType {
    Ontology = 'ontology',
    Knowledge = 'knowledge',
    DataModel = 'data_model',
    Model = 'model',
    Simulation = 'simulation',
    Process = 'process',
    Thread = 'thread',
    Analysis = 'analysis',
}

// Project object interface
export interface ProjectObject extends BaseEntity {
    projectId: string;
    type: ProjectObjectType;
    name: string;
    description?: string;
    status: 'draft' | 'active' | 'archived';
    version: string;
    tags: string[];
    metadata: Metadata;
}

// Project statistics
export interface ProjectStatistics {
    totalDocuments: number;
    totalModels: number;
    totalSimulations: number;
    totalProcesses: number;
    activeThreads: number;
    completedAnalyses: number;
    lastActivity: string;
}

// API request/response types
export interface CreateProjectRequest {
    name: string;
    description: string;
    knowledgeDomain: string;
    decisionContext: string;
    tags?: string[];
    metadata?: Metadata;
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    knowledgeDomain?: string;
    decisionContext?: string;
    tags?: string[];
    metadata?: Metadata;
}

export interface ProjectFilters {
    status?: ProjectStatus[];
    ownerId?: string;
    tags?: string[];
    createdAfter?: string;
    createdBefore?: string;
} 
import { Request, Response } from 'express';
import Joi from 'joi';
import { ProjectService } from '../services/projectService';
import { ApiResponse, CreateProjectRequest, UpdateProjectRequest } from '../types/project';

const projectService = new ProjectService();

// Validation schemas
const createProjectSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).allow(''),
    knowledge_domain: Joi.string().min(1).max(100).required(),
    settings: Joi.object({
        default_llm: Joi.string(),
        personas: Joi.array().items(Joi.string()),
        tools_enabled: Joi.array().items(Joi.string())
    }).optional()
});

const updateProjectSchema = Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).allow('').optional(),
    knowledge_domain: Joi.string().min(1).max(100).optional(),
    status: Joi.string().valid('active', 'completed').optional(),
    settings: Joi.object({
        default_llm: Joi.string(),
        personas: Joi.array().items(Joi.string()),
        tools_enabled: Joi.array().items(Joi.string())
    }).optional()
});

export class ProjectController {
    /**
     * Create a new project
     */
    async createProject(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const { error, value } = createProjectSchema.validate(req.body);
            if (error) {
                res.status(400).json(this.createErrorResponse('Validation error', error.details[0].message));
                return;
            }

            // Use a valid user ID from the database (admin@dadms.com)
            const userId = '3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1';

            const project = await projectService.createProject(userId, value as CreateProjectRequest);

            res.status(201).json(this.createSuccessResponse(project, 'Project created successfully'));
        } catch (error) {
            console.error('Create project error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to create project'));
        }
    }

    /**
     * Get user's projects with pagination
     */
    async getUserProjects(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query['page'] as string) || 1;
            const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50); // Max 50 items per page

            // Use a valid user ID from the database (admin@dadms.com)
            const userId = '3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1';

            const result = await projectService.getUserProjects(userId, page, limit);

            res.json(this.createSuccessResponse(result, 'Projects retrieved successfully'));
        } catch (error) {
            console.error('Get projects error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to retrieve projects'));
        }
    }

    /**
     * Get a single project by ID
     */
    async getProject(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Use a valid user ID from the database (admin@dadms.com)
            const userId = '3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1';

            const project = await projectService.getProject(id, userId);

            if (!project) {
                res.status(404).json(this.createErrorResponse('Not found', 'Project not found'));
                return;
            }

            res.json(this.createSuccessResponse(project, 'Project retrieved successfully'));
        } catch (error) {
            console.error('Get project error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to retrieve project'));
        }
    }

    /**
     * Update a project
     */
    async updateProject(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Validate request body
            const { error, value } = updateProjectSchema.validate(req.body);
            if (error) {
                res.status(400).json(this.createErrorResponse('Validation error', error.details[0].message));
                return;
            }

            // Use a valid user ID from the database (admin@dadms.com)
            const userId = '3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1';

            const project = await projectService.updateProject(id, userId, value as UpdateProjectRequest);

            if (!project) {
                res.status(404).json(this.createErrorResponse('Not found', 'Project not found'));
                return;
            }

            res.json(this.createSuccessResponse(project, 'Project updated successfully'));
        } catch (error) {
            console.error('Update project error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to update project'));
        }
    }

    /**
     * Delete a project
     */
    async deleteProject(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Use a valid user ID from the database (admin@dadms.com)
            const userId = '3e256d9f-28c0-4d8e-8c9d-f5859b8fbac1';

            const deleted = await projectService.deleteProject(id, userId);

            if (!deleted) {
                res.status(404).json(this.createErrorResponse('Not found', 'Project not found'));
                return;
            }

            res.json(this.createSuccessResponse(null, 'Project deleted successfully'));
        } catch (error) {
            console.error('Delete project error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to delete project'));
        }
    }

    /**
     * Create success response
     */
    private createSuccessResponse<T>(data: T, message: string): ApiResponse<T> {
        return {
            success: true,
            data,
            message,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Create error response
     */
    private createErrorResponse(error: string, message: string): ApiResponse<null> {
        return {
            success: false,
            data: null,
            error,
            message,
            timestamp: new Date().toISOString()
        };
    }
} 
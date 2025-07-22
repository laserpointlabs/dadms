import { Request, Response } from 'express';
import Joi from 'joi';
import { ApiResponse, CreateWorkspaceRequest, UpdateWorkspaceRequest } from '../models/workspace';
import { WorkspaceService } from '../services/workspaceService';

const workspaceService = new WorkspaceService();

// Validation schemas
const createWorkspaceSchema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).allow('').optional(),
    project_id: Joi.string().uuid().required(),
    settings: Joi.object({
        auto_save_enabled: Joi.boolean().optional(),
        auto_layout_enabled: Joi.boolean().optional(),
        validation_on_save: Joi.boolean().optional(),
        default_reasoner: Joi.string().valid('hermit', 'pellet', 'elk').optional(),
        color_scheme: Joi.string().valid('light', 'dark', 'auto').optional(),
        grid_enabled: Joi.boolean().optional(),
        snap_to_grid: Joi.boolean().optional()
    }).optional()
});

const updateWorkspaceSchema = Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).allow('').optional(),
    settings: Joi.object({
        auto_save_enabled: Joi.boolean().optional(),
        auto_layout_enabled: Joi.boolean().optional(),
        validation_on_save: Joi.boolean().optional(),
        default_reasoner: Joi.string().valid('hermit', 'pellet', 'elk').optional(),
        color_scheme: Joi.string().valid('light', 'dark', 'auto').optional(),
        grid_enabled: Joi.boolean().optional(),
        snap_to_grid: Joi.boolean().optional()
    }).optional()
});

export class WorkspaceController {
    /**
     * List ontology workspaces
     */
    async listWorkspaces(req: Request, res: Response): Promise<void> {
        try {
            const { project_id, name_contains, limit, offset } = req.query;

            const filters = {
                project_id: project_id as string,
                name_contains: name_contains as string
            };

            const pagination = {
                limit: limit ? parseInt(limit as string, 10) : 20,
                offset: offset ? parseInt(offset as string, 10) : 0
            };

            const result = await workspaceService.getWorkspaces(filters, pagination);

            res.json(this.createSuccessResponse(result, 'Workspaces retrieved successfully'));
        } catch (error) {
            console.error('List workspaces error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to retrieve workspaces'));
        }
    }

    /**
     * Create new ontology workspace
     */
    async createWorkspace(req: Request, res: Response): Promise<void> {
        try {
            // Validate request body
            const { error, value } = createWorkspaceSchema.validate(req.body);
            if (error) {
                res.status(400).json(this.createErrorResponse('Validation error', error.details[0].message));
                return;
            }

            // TODO: Extract user ID from JWT token - for now using placeholder
            const userId = req.headers['user-id'] as string || 'admin@dadms.com';

            const workspace = await workspaceService.createWorkspace(userId, value as CreateWorkspaceRequest);

            res.status(201).json(this.createSuccessResponse({
                workspace_id: workspace.id,
                message: 'Workspace created successfully'
            }));
        } catch (error) {
            console.error('Create workspace error:', error);
            if (error instanceof Error && error.message.includes('duplicate')) {
                res.status(409).json(this.createErrorResponse('Conflict', 'Workspace with same name already exists'));
            } else {
                res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to create workspace'));
            }
        }
    }

    /**
     * Get workspace details
     */
    async getWorkspace(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId } = req.params;

            const workspace = await workspaceService.getWorkspace(workspaceId);

            if (!workspace) {
                res.status(404).json(this.createErrorResponse('Not found', 'Workspace not found'));
                return;
            }

            res.json(this.createSuccessResponse(workspace, 'Workspace retrieved successfully'));
        } catch (error) {
            console.error('Get workspace error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to retrieve workspace'));
        }
    }

    /**
     * Update workspace
     */
    async updateWorkspace(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId } = req.params;

            // Validate request body
            const { error, value } = updateWorkspaceSchema.validate(req.body);
            if (error) {
                res.status(400).json(this.createErrorResponse('Validation error', error.details[0].message));
                return;
            }

            const workspace = await workspaceService.updateWorkspace(workspaceId, value as UpdateWorkspaceRequest);

            if (!workspace) {
                res.status(404).json(this.createErrorResponse('Not found', 'Workspace not found'));
                return;
            }

            res.json(this.createSuccessResponse(workspace, 'Workspace updated successfully'));
        } catch (error) {
            console.error('Update workspace error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to update workspace'));
        }
    }

    /**
     * Delete workspace
     */
    async deleteWorkspace(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId } = req.params;

            const deleted = await workspaceService.deleteWorkspace(workspaceId);

            if (!deleted) {
                res.status(404).json(this.createErrorResponse('Not found', 'Workspace not found'));
                return;
            }

            res.status(204).send();
        } catch (error) {
            console.error('Delete workspace error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to delete workspace'));
        }
    }

    /**
     * List ontologies in workspace
     */
    async listOntologies(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId } = req.params;

            const ontologies = await workspaceService.getOntologies(workspaceId);

            res.json(this.createSuccessResponse({ ontologies }, 'Ontologies retrieved successfully'));
        } catch (error) {
            console.error('List ontologies error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to retrieve ontologies'));
        }
    }

    /**
     * Add ontology to workspace
     */
    async addOntology(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId } = req.params;

            // Basic validation
            const { name, action } = req.body;
            if (!name || !action) {
                res.status(400).json(this.createErrorResponse('Validation error', 'Name and action are required'));
                return;
            }

            const ontology = await workspaceService.addOntology(workspaceId, req.body);

            res.status(201).json(this.createSuccessResponse({
                ontology_id: ontology.id,
                message: 'Ontology added successfully'
            }));
        } catch (error) {
            console.error('Add ontology error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to add ontology'));
        }
    }

    /**
     * Get ontology details
     */
    async getOntology(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId, ontologyId } = req.params;

            const ontology = await workspaceService.getOntology(workspaceId, ontologyId);

            if (!ontology) {
                res.status(404).json(this.createErrorResponse('Not found', 'Ontology not found'));
                return;
            }

            res.json(this.createSuccessResponse(ontology, 'Ontology retrieved successfully'));
        } catch (error) {
            console.error('Get ontology error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to retrieve ontology'));
        }
    }

    /**
     * Update ontology
     */
    async updateOntology(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId, ontologyId } = req.params;

            const ontology = await workspaceService.updateOntology(workspaceId, ontologyId, req.body);

            if (!ontology) {
                res.status(404).json(this.createErrorResponse('Not found', 'Ontology not found'));
                return;
            }

            res.json(this.createSuccessResponse(ontology, 'Ontology updated successfully'));
        } catch (error) {
            console.error('Update ontology error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to update ontology'));
        }
    }

    /**
     * Delete ontology
     */
    async deleteOntology(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId, ontologyId } = req.params;

            const deleted = await workspaceService.deleteOntology(workspaceId, ontologyId);

            if (!deleted) {
                res.status(404).json(this.createErrorResponse('Not found', 'Ontology not found'));
                return;
            }

            res.status(204).send();
        } catch (error) {
            console.error('Delete ontology error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to delete ontology'));
        }
    }

    /**
     * Create success response
     */
    private createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
        return {
            success: true,
            data,
            message
        };
    }

    /**
     * Create error response
     */
    private createErrorResponse(error: string, message?: string): ApiResponse {
        return {
            success: false,
            error,
            message
        };
    }
} 
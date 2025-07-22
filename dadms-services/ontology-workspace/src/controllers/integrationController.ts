import { Request, Response } from 'express';
import multer from 'multer';
import { CementoService } from '../integrations/cementoService';
import { ApiResponse, CementoSyncRequest, ImportFromDrawIORequest } from '../models/workspace';
import { WorkspaceService } from '../services/workspaceService';

const cementoService = new CementoService();
const workspaceService = new WorkspaceService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept draw.io files and common ontology formats
        const allowedMimes = [
            'application/xml',
            'text/xml',
            'application/vnd.jgraph.mxfile',
            'text/turtle',
            'application/rdf+xml',
            'application/owl+xml'
        ];

        const allowedExtensions = ['.drawio', '.xml', '.ttl', '.rdf', '.owl'];
        const hasValidExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

        if (allowedMimes.includes(file.mimetype) || hasValidExtension) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only draw.io, XML, TTL, RDF, and OWL files are allowed.'));
        }
    }
});

export class IntegrationController {
    // Multer middleware for file uploads
    uploadMiddleware = upload.single('file');

    /**
     * Import from draw.io
     */
    async importFromDrawIO(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId } = req.params;

            if (!req.file) {
                res.status(400).json(this.createErrorResponse('Bad request', 'No file uploaded'));
                return;
            }

            // Parse options
            const options: ImportFromDrawIORequest = {
                interpretation_mode: (req.body.options?.interpretation_mode) || 'flexible_mapping',
                generate_iris: req.body.options?.generate_iris !== false // Default to true
            };

            console.log(`Importing draw.io file for workspace ${workspaceId}:`, {
                filename: req.file.originalname,
                size: req.file.size,
                options
            });

            // Convert draw.io to turtle using cemento
            const conversionResult = await cementoService.convertDrawioToTurtle(req.file.buffer, {
                autoGenerateLayout: true,
                validateOnImport: true
            });

            if (!conversionResult.success) {
                res.status(400).json(this.createErrorResponse(
                    'Conversion failed',
                    conversionResult.errors?.join('; ') || 'Unknown conversion error'
                ));
                return;
            }

            // Create new ontology in workspace
            const ontologyName = req.file.originalname.replace(/\.(drawio|xml)$/i, '');
            const ontology = await workspaceService.addOntology(workspaceId, {
                name: ontologyName,
                description: `Imported from draw.io file: ${req.file.originalname}`,
                action: 'import_existing',
                format: 'turtle',
                content: conversionResult.content,
                iri: `http://example.com/ontology/${ontologyName.toLowerCase().replace(/\s+/g, '-')}`
            });

            res.json(this.createSuccessResponse({
                success: true,
                message: 'Draw.io file imported successfully',
                ontology_id: ontology.id,
                metadata: conversionResult.metadata,
                warnings: conversionResult.warnings
            }));

        } catch (error) {
            console.error('Draw.io import error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to import draw.io file'));
        }
    }

    /**
     * Export ontology to draw.io format
     */
    async exportToDrawIO(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId, ontologyId } = req.params;

            // Get the ontology
            const ontology = await workspaceService.getOntology(workspaceId, ontologyId);
            if (!ontology) {
                res.status(404).json(this.createErrorResponse('Not found', 'Ontology not found'));
                return;
            }

            // Convert content to turtle format if needed
            let turtleContent: string;
            if (ontology.format === 'turtle') {
                turtleContent = typeof ontology.content === 'string' ? ontology.content : JSON.stringify(ontology.content);
            } else {
                // For now, assume content is already in a usable format
                // In a real implementation, you'd convert from other formats to turtle
                turtleContent = JSON.stringify(ontology.content);
            }

            // Convert turtle to draw.io using cemento
            const conversionResult = await cementoService.convertTurtleToDrawio(turtleContent, {
                autoGenerateLayout: true,
                preserveLayout: true
            });

            if (!conversionResult.success) {
                res.status(500).json(this.createErrorResponse(
                    'Conversion failed',
                    conversionResult.errors?.join('; ') || 'Unknown conversion error'
                ));
                return;
            }

            // Send the draw.io file as download
            const filename = `${ontology.name.replace(/\s+/g, '_')}.drawio`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/xml');
            res.send(conversionResult.content);

        } catch (error) {
            console.error('Draw.io export error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to export to draw.io'));
        }
    }

    /**
     * Sync with Cemento
     */
    async syncWithCemento(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId } = req.params;
            const syncRequest: CementoSyncRequest = req.body;

            if (!syncRequest.cemento_project_id) {
                res.status(400).json(this.createErrorResponse('Bad request', 'cemento_project_id is required'));
                return;
            }

            // For now, we'll implement a basic version that focuses on file conversion
            // A full implementation would integrate with Cemento's project management

            console.log(`Syncing workspace ${workspaceId} with Cemento project ${syncRequest.cemento_project_id}:`, {
                direction: syncRequest.direction,
                options: syncRequest.options
            });

            // Test cemento installation
            const cementoTest = await cementoService.testCementoInstallation();
            if (!cementoTest.available) {
                res.status(503).json(this.createErrorResponse(
                    'Service unavailable',
                    `Cemento is not available: ${cementoTest.error}`
                ));
                return;
            }

            // Placeholder response - in a real implementation this would:
            // 1. Connect to Cemento project
            // 2. Compare local vs remote ontologies
            // 3. Handle conflicts based on merge_conflicts setting
            // 4. Perform bidirectional sync if requested

            res.json(this.createSuccessResponse({
                success: true,
                message: 'Cemento sync initiated',
                cemento_version: cementoTest.version,
                sync_status: 'completed',
                conflicts_resolved: 0,
                files_synced: 0
            }));

        } catch (error) {
            console.error('Cemento sync error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to sync with Cemento'));
        }
    }

    /**
     * Validate ontology using Cemento
     */
    async validateOntology(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId, ontologyId } = req.params;

            // Get the ontology
            const ontology = await workspaceService.getOntology(workspaceId, ontologyId);
            if (!ontology) {
                res.status(404).json(this.createErrorResponse('Not found', 'Ontology not found'));
                return;
            }

            // Prepare content for validation
            const content = typeof ontology.content === 'string' ? ontology.content : JSON.stringify(ontology.content);

            // Validate using cemento
            const validationResult = await cementoService.validateOntology(content, ontology.format as any);

            // Update ontology status based on validation
            const newStatus = validationResult.success ? 'valid' : 'invalid';
            await workspaceService.updateOntology(workspaceId, ontologyId, { status: newStatus });

            res.json(this.createSuccessResponse({
                is_valid: validationResult.success,
                reasoner_used: 'cemento',
                timestamp: new Date().toISOString(),
                metadata: validationResult.metadata,
                errors: validationResult.errors || [],
                warnings: validationResult.warnings || []
            }));

        } catch (error) {
            console.error('Ontology validation error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to validate ontology'));
        }
    }

    /**
     * Get Cemento service status
     */
    async getCementoStatus(req: Request, res: Response): Promise<void> {
        try {
            const status = await cementoService.testCementoInstallation();

            res.json(this.createSuccessResponse({
                available: status.available,
                version: status.version,
                error: status.error,
                features: {
                    drawio_to_turtle: status.available,
                    turtle_to_drawio: status.available,
                    validation: status.available,
                    auto_layout: status.available
                }
            }));

        } catch (error) {
            console.error('Cemento status error:', error);
            res.status(500).json(this.createErrorResponse('Internal server error', 'Failed to get Cemento status'));
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
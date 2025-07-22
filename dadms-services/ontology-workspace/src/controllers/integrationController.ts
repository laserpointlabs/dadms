import { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { CementoService } from '../integrations/cementoService';
import { WorkspaceService } from '../services/workspaceService';
import { ApiResponse, ImportFromDrawIORequest, CementoSyncRequest } from '../models/workspace';

const cementoService = new CementoService();
const workspaceService = new WorkspaceService();

// Extend Express Request to include file from multer
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // Accept draw.io files and common ontology formats
        const allowedMimes = [
            'application/xml',
            'text/xml',
            'application/octet-stream', // Sometimes draw.io files are detected as this
            'text/plain',
            'application/rdf+xml',
            'text/turtle',
            'application/ld+json'
        ];

        const allowedExts = ['.drawio', '.xml', '.owl', '.ttl', '.rdf', '.jsonld', '.n3'];
        const fileExt = file.originalname.toLowerCase();
        const hasValidExt = allowedExts.some(ext => fileExt.endsWith(ext));

        if (allowedMimes.includes(file.mimetype) || hasValidExt) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Please upload .drawio, .xml, .owl, .ttl, .rdf, or .jsonld files.'));
        }
    }
});

export class IntegrationController {
    /**
     * Import from draw.io file and convert to ontology
     */
    async importFromDrawIO(req: MulterRequest, res: Response): Promise<void> {
        try {
            const { workspaceId } = req.params;

            if (!workspaceId) {
                res.status(400).json({
                    success: false,
                    error: 'Workspace ID is required'
                });
                return;
            }

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
                return;
            }

            const fileInfo = {
                filename: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            };

            // Convert draw.io to ontology format using cemento
            const conversionResult = await cementoService.convertDrawioToTurtle(req.file.buffer, {
                preserveLayout: true,
                validateOnImport: true
            });

            if (!conversionResult.success) {
                res.status(422).json({
                    success: false,
                    error: 'Failed to convert draw.io file',
                    details: conversionResult.errors
                });
                return;
            }

            // Create new ontology in workspace
            const ontologyName = req.file.originalname.replace(/\.(drawio|xml)$/i, '');
            const ontology = await workspaceService.addOntology(workspaceId, {
                name: ontologyName,
                description: `Imported from draw.io file: ${req.file.originalname}`,
                format: 'turtle',
                content: conversionResult.content ? JSON.stringify(conversionResult.content) : '{}',
                visual_layout: {
                    type: 'drawio',
                    data: req.file.buffer.toString('utf8'),
                    auto_layout: false
                }
            });

            res.json({
                success: true,
                data: {
                    ontology,
                    fileInfo,
                    conversionResult: {
                        success: conversionResult.success,
                        metadata: conversionResult.metadata
                    }
                }
            });

        } catch (error) {
            console.error('Import from draw.io error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to import from draw.io',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Export ontology to draw.io format
     */
    async exportToDrawIO(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId, ontologyId } = req.params;

            if (!workspaceId || !ontologyId) {
                res.status(400).json({
                    success: false,
                    error: 'Workspace ID and Ontology ID are required'
                });
                return;
            }

            const ontology = await workspaceService.getOntology(workspaceId, ontologyId);
            if (!ontology) {
                res.status(404).json({
                    success: false,
                    error: 'Ontology not found'
                });
                return;
            }

            // Check if we have existing visual layout
            if (ontology.visual_layout && ontology.visual_layout.type === 'drawio') {
                // Return existing draw.io layout
                res.setHeader('Content-Type', 'application/xml');
                res.setHeader('Content-Disposition', `attachment; filename="${ontology.name}.drawio"`);
                res.send(ontology.visual_layout.data);
                return;
            }

            // Convert ontology to draw.io format using cemento
            const contentStr = typeof ontology.content === 'string' ? ontology.content : JSON.stringify(ontology.content);
            const conversionResult = await cementoService.convertTurtleToDrawio(contentStr, {
                autoGenerateLayout: true,
                preserveLayout: false
            });

            if (!conversionResult.success) {
                res.status(422).json({
                    success: false,
                    error: 'Failed to convert ontology to draw.io format',
                    details: conversionResult.errors
                });
                return;
            }

            res.setHeader('Content-Type', 'application/xml');
            res.setHeader('Content-Disposition', `attachment; filename="${ontology.name}.drawio"`);
            res.send(conversionResult.content);

        } catch (error) {
            console.error('Export to draw.io error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export to draw.io',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Import ontology from standard formats (OWL, Turtle, RDF)
     */
    async importOntology(req: MulterRequest, res: Response): Promise<void> {
        try {
            const { workspaceId } = req.params;

            if (!workspaceId) {
                res.status(400).json({
                    success: false,
                    error: 'Workspace ID is required'
                });
                return;
            }

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
                return;
            }

            const fileContent = req.file.buffer.toString('utf8');
            const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

            // Determine format from file extension
            let format: 'owl' | 'turtle' | 'rdf' | 'jsonld' = 'turtle';
            switch (fileExtension) {
                case 'owl':
                case 'xml':
                    format = 'owl';
                    break;
                case 'ttl':
                    format = 'turtle';
                    break;
                case 'rdf':
                    format = 'rdf';
                    break;
                case 'jsonld':
                    format = 'jsonld';
                    break;
            }

            // For now, we'll store the raw content and create basic draw.io representation
            const ontologyName = req.file.originalname.replace(/\.(owl|ttl|rdf|jsonld|xml)$/i, '');
            const ontology = await workspaceService.addOntology(workspaceId, {
                name: ontologyName,
                description: `Imported from ${format.toUpperCase()} file: ${req.file.originalname}`,
                format: format,
                content: fileContent,
                visual_layout: {
                    type: 'drawio',
                    data: '<?xml version="1.0" encoding="UTF-8"?><mxfile><diagram></diagram></mxfile>',
                    auto_layout: true
                }
            });

            res.json({
                success: true,
                data: {
                    ontology,
                    conversionResult: {
                        success: true,
                        metadata: { format, size: fileContent.length },
                        errors: []
                    }
                }
            });

        } catch (error) {
            console.error('Import ontology error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to import ontology',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Sync ontology with cemento (bi-directional conversion)
     */
    async syncWithCemento(req: Request, res: Response): Promise<void> {
        try {
            const { workspaceId, ontologyId } = req.params;
            const { operation, sourceFormat, targetFormat, options } = req.body as CementoSyncRequest;

            if (!workspaceId || !ontologyId) {
                res.status(400).json({
                    success: false,
                    error: 'Workspace ID and Ontology ID are required'
                });
                return;
            }

            const ontology = await workspaceService.getOntology(workspaceId, ontologyId);
            if (!ontology) {
                res.status(404).json({
                    success: false,
                    error: 'Ontology not found'
                });
                return;
            }

            let conversionResult;
            let newStatus = ontology.status;

            switch (operation) {
                case 'validate':
                    const contentStr = typeof ontology.content === 'string' ? ontology.content : JSON.stringify(ontology.content);
                    conversionResult = await cementoService.validateOntology(contentStr, ontology.format);
                    newStatus = conversionResult.success ? 'validated' : 'invalid';
                    break;

                case 'convert':
                    if (sourceFormat === 'drawio' && targetFormat === 'turtle') {
                        const drawioData = ontology.visual_layout?.data || '';
                        conversionResult = await cementoService.convertDrawioToTurtle(Buffer.from(drawioData), options);
                    } else {
                        // For now, return a basic success response
                        conversionResult = { success: true, content: ontology.content };
                    }
                    break;

                default:
                    res.status(400).json({
                        success: false,
                        error: 'Invalid operation. Supported operations: validate, convert'
                    });
                    return;
            }

            // Update ontology status
            await workspaceService.updateOntology(workspaceId, ontologyId, { status: newStatus });

            res.json({
                success: true,
                data: {
                    operation,
                    result: conversionResult,
                    ontology: {
                        ...ontology,
                        status: newStatus
                    }
                }
            });

        } catch (error) {
            console.error('Cemento sync error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to sync with cemento',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Get upload middleware for draw.io files
     */
    getDrawIOUploadMiddleware() {
        return upload.single('file');
    }

    /**
     * Get upload middleware for ontology files
     */
    getOntologyUploadMiddleware() {
        return upload.single('file');
    }
} 

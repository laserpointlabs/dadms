import { Router } from 'express';
import { IntegrationController } from '../controllers/integrationController';
import { WorkspaceController } from '../controllers/workspaceController';
import { checkDatabaseHealth } from '../database/connection';

const router = Router();
const workspaceController = new WorkspaceController();
const integrationController = new IntegrationController();

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const dbHealth = await checkDatabaseHealth();

        res.json({
            status: dbHealth.healthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: dbHealth.healthy ? 'healthy' : 'unhealthy',
                    response_time_ms: dbHealth.responseTime,
                    error_message: dbHealth.error
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// API info endpoint
router.get('/api', (req, res) => {
    res.json({
        service: 'DADMS Ontology Workspace Service',
        version: '1.0.0',
        description: 'Visual ontology workspace with draw.io and cemento integration',
        features: {
            ontology_management: true,
            visual_editing: true,
            draw_io_integration: true,
            cemento_integration: true,
            collaboration: true,
            validation: true
        },
        endpoints: {
            workspaces: '/workspaces',
            health: '/health',
            cemento_status: '/integrations/cemento/status'
        },
        timestamp: new Date().toISOString()
    });
});

// Workspace management routes
router.get('/workspaces', (req, res) => workspaceController.listWorkspaces(req, res));
router.post('/workspaces', (req, res) => workspaceController.createWorkspace(req, res));
router.get('/workspaces/:workspaceId', (req, res) => workspaceController.getWorkspace(req, res));
router.put('/workspaces/:workspaceId', (req, res) => workspaceController.updateWorkspace(req, res));
router.delete('/workspaces/:workspaceId', (req, res) => workspaceController.deleteWorkspace(req, res));

// Ontology management routes
router.get('/workspaces/:workspaceId/ontologies', (req, res) => workspaceController.listOntologies(req, res));
router.post('/workspaces/:workspaceId/ontologies', (req, res) => workspaceController.addOntology(req, res));
router.get('/workspaces/:workspaceId/ontologies/:ontologyId', (req, res) => workspaceController.getOntology(req, res));
router.put('/workspaces/:workspaceId/ontologies/:ontologyId', (req, res) => workspaceController.updateOntology(req, res));
router.delete('/workspaces/:workspaceId/ontologies/:ontologyId', (req, res) => workspaceController.deleteOntology(req, res));

// Integration routes - draw.io
router.post('/workspaces/:workspaceId/integrations/drawio',
    integrationController.uploadMiddleware,
    (req, res) => integrationController.importFromDrawIO(req, res)
);

router.get('/workspaces/:workspaceId/ontologies/:ontologyId/export/drawio',
    (req, res) => integrationController.exportToDrawIO(req, res)
);

// Integration routes - cemento
router.post('/workspaces/:workspaceId/integrations/cemento',
    (req, res) => integrationController.syncWithCemento(req, res)
);

router.get('/integrations/cemento/status',
    (req, res) => integrationController.getCementoStatus(req, res)
);

// Validation routes
router.post('/workspaces/:workspaceId/ontologies/:ontologyId/validate',
    (req, res) => integrationController.validateOntology(req, res)
);

export default router; 
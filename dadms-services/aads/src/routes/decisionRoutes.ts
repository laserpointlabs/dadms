import { Router } from 'express';
import { DecisionController } from '../controllers/DecisionController';

const router = Router();
const decisionController = new DecisionController();

// GET /api/decisions/:projectId/summary
router.get('/:projectId/summary', decisionController.getDecisionSummary);

// PUT /api/decisions/:projectId/summary
router.put('/:projectId/summary', decisionController.updateDecisionSummary);

export { router as decisionRoutes };

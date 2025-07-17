import { Router } from 'express';
import { WhitePaperController } from '../controllers/WhitePaperController';

const router = Router();
const whitePaperController = new WhitePaperController();

// GET /api/decisions/:projectId/white-paper
router.get('/:projectId/white-paper', whitePaperController.getWhitePaper);

// PUT /api/decisions/:projectId/white-paper/sections/:sectionId
router.put('/:projectId/white-paper/sections/:sectionId', whitePaperController.updateSection);

// POST /api/decisions/:projectId/white-paper/generate
router.post('/:projectId/white-paper/generate', whitePaperController.generateWithAI);

// PUT /api/decisions/:projectId/white-paper/draft
router.put('/:projectId/white-paper/draft', whitePaperController.saveDraft);

// POST /api/decisions/:projectId/white-paper/export/pdf
router.post('/:projectId/white-paper/export/pdf', whitePaperController.exportPDF);

export { router as whitePaperRoutes };

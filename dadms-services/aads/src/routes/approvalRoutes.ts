import { Router } from 'express';
import { ApprovalController } from '../controllers/ApprovalController';

const router = Router();
const approvalController = new ApprovalController();

// POST /api/decisions/:projectId/approval
router.post('/:projectId/approval', approvalController.submitForApproval);

// GET /api/decisions/:projectId/approval/status
router.get('/:projectId/approval/status', approvalController.getApprovalStatus);

export { router as approvalRoutes };

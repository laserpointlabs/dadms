import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';

const router = Router();
const chatController = new ChatController();

// GET /api/decisions/:projectId/chat
router.get('/:projectId/chat', chatController.getChatMessages);

// POST /api/decisions/:projectId/chat
router.post('/:projectId/chat', chatController.sendChatMessage);

export { router as chatRoutes };

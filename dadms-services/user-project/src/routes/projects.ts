import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';

const router = Router();
const projectController = new ProjectController();

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (requires authentication)
 */
router.post('/', (req, res) => projectController.createProject(req, res));

/**
 * @route   GET /api/projects
 * @desc    Get user's projects with pagination
 * @access  Private (requires authentication)
 * @query   page: number (default: 1)
 * @query   limit: number (default: 10, max: 50)
 */
router.get('/', (req, res) => projectController.getUserProjects(req, res));

/**
 * @route   GET /api/projects/:id
 * @desc    Get a single project by ID
 * @access  Private (requires authentication)
 */
router.get('/:id', (req, res) => projectController.getProject(req, res));

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project
 * @access  Private (requires authentication)
 */
router.put('/:id', (req, res) => projectController.updateProject(req, res));

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private (requires authentication)
 */
router.delete('/:id', (req, res) => projectController.deleteProject(req, res));

export default router; 
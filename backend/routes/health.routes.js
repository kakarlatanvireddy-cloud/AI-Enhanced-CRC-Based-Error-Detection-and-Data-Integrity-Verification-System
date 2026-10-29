import { Router } from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = Router();

/**
 * @route GET /api/health
 * @desc  System health check endpoint
 * @access Public
 */
router.get('/health', checkHealth);

export default router;

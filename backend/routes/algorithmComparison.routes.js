import { Router } from 'express';
import {
  handleCompareCrcAlgorithms,
  handleGetComparisonStats
} from '../controllers/algorithmComparison.controller.js';

const router = Router();

/**
 * @route POST /api/crc/compare
 * @desc  Compare CRC-8, CRC-16, and CRC-32 algorithms for a single payload
 * @access Public
 */
router.post('/compare', handleCompareCrcAlgorithms);

/**
 * @route GET /api/crc/compare/stats
 * @desc  Return in-memory telemetry statistics for the comparison module
 * @access Public
 */
router.get('/compare/stats', handleGetComparisonStats);

export default router;

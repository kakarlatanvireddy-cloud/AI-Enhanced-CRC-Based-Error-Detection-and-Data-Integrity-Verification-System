import { Router } from 'express';
import {
  handleAnalyze,
  handleGetHistory,
  handleGetStats
} from '../controllers/anomalyDetection.controller.js';

const router = Router();

/**
 * @route  POST /api/anomaly-detection/analyze
 * @desc   Run anomaly detection on current in-memory telemetry
 * @access Public
 */
router.post('/analyze', handleAnalyze);

/**
 * @route  GET /api/anomaly-detection/history
 * @desc   Retrieve past analysis results (most-recent first)
 * @query  limit {number} 1–100, default 50
 * @access Public
 */
router.get('/history', handleGetHistory);

/**
 * @route  GET /api/anomaly-detection/stats
 * @desc   Aggregate anomaly detection statistics
 * @access Public
 */
router.get('/stats', handleGetStats);

export default router;

import { Router } from 'express';
import {
  handleAnalyzePatterns,
  handleGetPatternHistory,
  handleGetPatternStats
} from '../controllers/errorPatternAnalysis.controller.js';

const router = Router();

/**
 * @route  GET /api/error-patterns/analyze
 * @desc   Run error pattern analysis on current telemetry (creates a new record)
 * @access Public
 */
router.get('/analyze', handleAnalyzePatterns);

/**
 * @route  GET /api/error-patterns/history
 * @desc   Retrieve past analysis results (most-recent first)
 * @query  limit {number} 1–100, default 20
 * @access Public
 */
router.get('/history', handleGetPatternHistory);

/**
 * @route  GET /api/error-patterns/stats
 * @desc   Aggregate statistics across all past analyses
 * @access Public
 */
router.get('/stats', handleGetPatternStats);

export default router;

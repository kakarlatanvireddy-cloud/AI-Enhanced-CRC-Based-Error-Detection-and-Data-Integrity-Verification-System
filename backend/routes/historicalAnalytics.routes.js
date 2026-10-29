import { Router } from 'express';
import {
  handleGetHistoricalOverview,
  handleGetHistoricalTimeline,
  handleGetHistoricalErrors,
  handleGetHistoricalAlgorithms,
  handleExportHistoricalData
} from '../controllers/historicalAnalytics.controller.js';

const router = Router();

/**
 * @route   GET /api/historical-analytics/overview
 * @desc    Get aggregated historical metrics
 * @access  Public
 */
router.get('/overview', handleGetHistoricalOverview);

/**
 * @route   GET /api/historical-analytics/timeline
 * @desc    Get time-bucketed event trends over selected range
 * @access  Public
 */
router.get('/timeline', handleGetHistoricalTimeline);

/**
 * @route   GET /api/historical-analytics/errors
 * @desc    Get error-type frequency distribution and bit metrics
 * @access  Public
 */
router.get('/errors', handleGetHistoricalErrors);

/**
 * @route   GET /api/historical-analytics/algorithms
 * @desc    Get CRC algorithm outcomes and empirical detection rates
 * @access  Public
 */
router.get('/algorithms', handleGetHistoricalAlgorithms);

/**
 * @route   GET /api/historical-analytics/export
 * @desc    Export historical records, alerts, or summaries as CSV
 * @access  Public
 */
router.get('/export', handleExportHistoricalData);

export default router;

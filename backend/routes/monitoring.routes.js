import { Router } from 'express';
import {
  handleGetOverview,
  handleGetActivity,
  handleGetTimeline,
  handleGetHealth
} from '../controllers/monitoring.controller.js';

const router = Router();

/**
 * @route   GET /api/monitoring/overview
 * @desc    Get aggregated overview metrics from all active modules
 * @access  Public
 */
router.get('/overview', handleGetOverview);

/**
 * @route   GET /api/monitoring/activity
 * @desc    Get chronological unified activity feed with filtering
 * @query   limit (1-100), eventType, algorithm
 * @access  Public
 */
router.get('/activity', handleGetActivity);

/**
 * @route   GET /api/monitoring/timeline
 * @desc    Get time-bucketed event counts and trends
 * @query   buckets (2-20)
 * @access  Public
 */
router.get('/timeline', handleGetTimeline);

/**
 * @route   GET /api/monitoring/health
 * @desc    Get system and module operational health status
 * @access  Public
 */
router.get('/health', handleGetHealth);

export default router;

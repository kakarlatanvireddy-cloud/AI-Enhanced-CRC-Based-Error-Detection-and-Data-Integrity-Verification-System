import { Router } from 'express';
import {
  handleGetAlerts,
  handleGetAlertStats,
  handleGetAlertById,
  handleAcknowledgeAlert
} from '../controllers/alert.controller.js';

const router = Router();

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts with filtering (severity, type, acknowledged, dates)
 * @access  Public
 */
router.get('/', handleGetAlerts);

/**
 * @route   GET /api/alerts/stats
 * @desc    Get summary statistics across alerts
 * @access  Public
 */
router.get('/stats', handleGetAlertStats);

/**
 * @route   GET /api/alerts/:id
 * @desc    Get details for a single alert
 * @access  Public
 */
router.get('/:id', handleGetAlertById);

/**
 * @route   PATCH /api/alerts/:id/acknowledge
 * @desc    Acknowledge an alert
 * @access  Public
 */
router.patch('/:id/acknowledge', handleAcknowledgeAlert);

export default router;

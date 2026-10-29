/**
 * Monitoring Controller — Module 7
 *
 * Exposes endpoints for the Real-Time Monitoring Dashboard.
 */

import {
  getMonitoringOverview,
  getRecentActivity,
  getMonitoringTimeline
} from '../services/monitoring.service.js';
import { getSystemHealthStatus } from '../services/health.service.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/monitoring/overview
 * Returns consolidated metrics from all active subsystems.
 */
export const handleGetOverview = (req, res) => {
  try {
    const overview = getMonitoringOverview();
    return res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error('Error fetching monitoring overview', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching monitoring overview.'
    });
  }
};

/**
 * GET /api/monitoring/activity
 * Returns recent activity feed with optional query filters:
 *  - limit: number (1-100, default 20)
 *  - eventType: string ('TRANSMISSION', 'ERROR_INJECTION', 'ANOMALY_DETECTION', 'PATTERN_ANALYSIS')
 *  - algorithm: string ('CRC-8', 'CRC-16', 'CRC-32')
 */
export const handleGetActivity = (req, res) => {
  try {
    const { limit, eventType, algorithm } = req.query;

    if (limit !== undefined) {
      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameter: "limit" must be an integer between 1 and 100.'
        });
      }
    }

    const result = getRecentActivity({
      limit: limit ? parseInt(limit, 10) : 20,
      eventType: eventType || null,
      algorithm: algorithm || null
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error fetching monitoring activity', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching monitoring activity.'
    });
  }
};

/**
 * GET /api/monitoring/timeline
 * Returns time-bucketed event volume.
 *  - buckets: number (2-20, default 8)
 */
export const handleGetTimeline = (req, res) => {
  try {
    const { buckets } = req.query;

    if (buckets !== undefined) {
      const parsed = parseInt(buckets, 10);
      if (isNaN(parsed) || parsed < 2 || parsed > 20) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameter: "buckets" must be an integer between 2 and 20.'
        });
      }
    }

    const timeline = getMonitoringTimeline(buckets ? parseInt(buckets, 10) : 8);

    return res.status(200).json({
      success: true,
      timeline,
      bucketCount: timeline.length
    });
  } catch (error) {
    logger.error('Error fetching monitoring timeline', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching monitoring timeline.'
    });
  }
};

/**
 * GET /api/monitoring/health
 * Returns live health and active module status.
 */
export const handleGetHealth = (req, res) => {
  try {
    const health = getSystemHealthStatus();
    return res.status(200).json({
      success: true,
      health
    });
  } catch (error) {
    logger.error('Error fetching monitoring health', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching monitoring health.'
    });
  }
};

/**
 * Alert Controller — Module 8
 *
 * Handles HTTP requests for alert retrieval, filtering, statistics, and acknowledgement.
 */

import {
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  getAlertStats
} from '../services/alert.service.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/alerts
 * Query parameters:
 *  - severity: string ('INFO' | 'WARNING' | 'HIGH' | 'CRITICAL')
 *  - alertType: string
 *  - acknowledged: boolean/string ('true' | 'false')
 *  - startDate: string (ISO)
 *  - endDate: string (ISO)
 *  - limit: number (1-100, default 50)
 */
export const handleGetAlerts = (req, res) => {
  try {
    const { severity, alertType, acknowledged, startDate, endDate, limit } = req.query;

    if (limit !== undefined) {
      const parsed = parseInt(limit, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameter: "limit" must be an integer between 1 and 100.'
        });
      }
    }

    const result = getAlerts({
      severity,
      alertType,
      acknowledged,
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : 50
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error fetching alerts', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching alerts.'
    });
  }
};

/**
 * GET /api/alerts/stats
 * Returns summary counts across severities and acknowledgement states.
 */
export const handleGetAlertStats = (req, res) => {
  try {
    const stats = getAlertStats();
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching alert stats', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching alert stats.'
    });
  }
};

/**
 * GET /api/alerts/:id
 * Returns a single alert record by alertId.
 */
export const handleGetAlertById = (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert ID parameter.'
      });
    }

    const alert = getAlertById(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: `Alert not found with ID: ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      alert
    });
  } catch (error) {
    logger.error('Error fetching alert by ID', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching alert details.'
    });
  }
};

/**
 * PATCH /api/alerts/:id/acknowledge
 * Acknowledges an alert and records the timestamp.
 */
export const handleAcknowledgeAlert = (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid alert ID parameter.'
      });
    }

    const alert = acknowledgeAlert(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: `Alert not found or cannot be acknowledged: ${id}`
      });
    }

    logger.info(`Alert acknowledged: ${alert.alertId}`);

    return res.status(200).json({
      success: true,
      message: 'Alert successfully acknowledged.',
      alert
    });
  } catch (error) {
    logger.error('Error acknowledging alert', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error acknowledging alert.'
    });
  }
};

/**
 * Historical Analytics Controller — Module 8
 *
 * Exposes endpoints for retrospective telemetry analysis, timelines, error distributions,
 * algorithm comparisons, and CSV reports.
 */

import {
  getHistoricalOverview,
  getHistoricalTimeline,
  getHistoricalErrorDistribution,
  getHistoricalAlgorithmOutcomes,
  exportHistoricalCsv
} from '../services/historicalAnalytics.service.js';
import { logger } from '../utils/logger.js';

/**
 * GET /api/historical-analytics/overview
 * Query params: startDate, endDate
 */
export const handleGetHistoricalOverview = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = getHistoricalOverview({ startDate, endDate });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error fetching historical overview', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching historical overview.'
    });
  }
};

/**
 * GET /api/historical-analytics/timeline
 * Query params: startDate, endDate, buckets (2-24, default 8)
 */
export const handleGetHistoricalTimeline = (req, res) => {
  try {
    const { startDate, endDate, buckets } = req.query;

    if (buckets !== undefined) {
      const parsed = parseInt(buckets, 10);
      if (isNaN(parsed) || parsed < 2 || parsed > 24) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameter: "buckets" must be an integer between 2 and 24.'
        });
      }
    }

    const timeline = getHistoricalTimeline({
      startDate,
      endDate,
      buckets: buckets ? parseInt(buckets, 10) : 8
    });

    return res.status(200).json({
      success: true,
      timeline,
      bucketCount: timeline.length
    });
  } catch (error) {
    logger.error('Error fetching historical timeline', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching historical timeline.'
    });
  }
};

/**
 * GET /api/historical-analytics/errors
 * Query params: startDate, endDate
 */
export const handleGetHistoricalErrors = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = getHistoricalErrorDistribution({ startDate, endDate });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error fetching historical error distribution', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching historical error distribution.'
    });
  }
};

/**
 * GET /api/historical-analytics/algorithms
 * Query params: startDate, endDate
 */
export const handleGetHistoricalAlgorithms = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const algorithms = getHistoricalAlgorithmOutcomes({ startDate, endDate });
    return res.status(200).json({
      success: true,
      algorithms
    });
  } catch (error) {
    logger.error('Error fetching historical algorithm outcomes', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching historical algorithm outcomes.'
    });
  }
};

/**
 * GET /api/historical-analytics/export
 * Query params: type ('alerts' | 'telemetry' | 'summary'), startDate, endDate
 * Returns: text/csv attachment download or raw CSV string
 */
export const handleExportHistoricalData = (req, res) => {
  try {
    const { type = 'alerts', startDate, endDate } = req.query;

    const validTypes = ['alerts', 'telemetry', 'summary'];
    const safeType = validTypes.includes(type) ? type : 'alerts';

    const csvContent = exportHistoricalCsv({
      type: safeType,
      startDate,
      endDate
    });

    const filename = `crc-integrity-${safeType}-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    logger.error('Error exporting historical CSV data', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error exporting historical analytics data.'
    });
  }
};

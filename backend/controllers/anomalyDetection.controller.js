import { analyzeTransmissions, getAnalysisHistory, getAnomalyStats } from '../services/anomalyDetection.service.js';
import { getTelemetryStats } from '../services/telemetry.service.js';
import { logger } from '../utils/logger.js';

/**
 * Controller to handle POST /api/anomaly-detection/analyze
 *
 * Analyzes the current in-memory telemetry and returns the detection result.
 * No request body is required; the endpoint always analyzes whatever telemetry
 * has been collected during this server session by Modules 2 and 3.
 */
export const handleAnalyze = (req, res) => {
  try {
    const result       = analyzeTransmissions();
    const telemetryStats = getTelemetryStats();

    logger.info(
      `Anomaly analysis performed [ID: ${result.analysisId}, ` +
      `Status: ${result.status}, Events: ${result.eventCount}]`
    );

    return res.status(200).json({
      success: true,
      analysis: result,
      telemetryStats
    });
  } catch (error) {
    logger.error('Error during anomaly analysis', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during anomaly analysis.'
    });
  }
};

/**
 * Controller to handle GET /api/anomaly-detection/history
 *
 * Returns past analysis results in reverse-chronological order.
 * Optional query parameter: ?limit=N (1–100, default 50)
 */
export const handleGetHistory = (req, res) => {
  try {
    const rawLimit = req.query.limit;

    if (rawLimit !== undefined) {
      const parsed = parseInt(rawLimit, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameter: "limit" must be an integer between 1 and 100.'
        });
      }
    }

    const limit   = rawLimit ? parseInt(rawLimit, 10) : 50;
    const history = getAnalysisHistory(limit);

    return res.status(200).json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    logger.error('Error fetching anomaly history', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching anomaly history.'
    });
  }
};

/**
 * Controller to handle GET /api/anomaly-detection/stats
 *
 * Returns aggregated statistics across all past analyses, plus current telemetry stats.
 */
export const handleGetStats = (req, res) => {
  try {
    const stats = getAnomalyStats();

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching anomaly stats', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching anomaly stats.'
    });
  }
};

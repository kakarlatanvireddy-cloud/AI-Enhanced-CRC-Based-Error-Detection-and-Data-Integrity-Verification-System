import { analyzePatterns, getPatternHistory, getPatternStats } from '../services/errorPatternAnalysis.service.js';
import { logger } from '../utils/logger.js';

/**
 * Controller to handle GET /api/error-patterns/analyze
 *
 * Runs pattern analysis on all current telemetry and returns the result.
 * Each call creates a new analysis record; no request body is required.
 */
export const handleAnalyzePatterns = (req, res) => {
  try {
    const result = analyzePatterns();

    logger.info(
      `Error pattern analysis performed [ID: ${result.analysisId}, ` +
      `Status: ${result.status}, Injections: ${result.injectionCount}]`
    );

    return res.status(200).json({
      success: true,
      analysis: result
    });
  } catch (error) {
    logger.error('Error during pattern analysis', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during error pattern analysis.'
    });
  }
};

/**
 * Controller to handle GET /api/error-patterns/history
 *
 * Returns past analysis results in reverse-chronological order.
 * Optional query parameter: ?limit=N (1–100, default 20)
 */
export const handleGetPatternHistory = (req, res) => {
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

    const limit   = rawLimit ? parseInt(rawLimit, 10) : 20;
    const history = getPatternHistory(limit);

    return res.status(200).json({
      success: true,
      history,
      count: history.length
    });
  } catch (error) {
    logger.error('Error fetching pattern history', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching pattern history.'
    });
  }
};

/**
 * Controller to handle GET /api/error-patterns/stats
 *
 * Returns aggregate statistics across all past analyses.
 */
export const handleGetPatternStats = (req, res) => {
  try {
    const stats = getPatternStats();

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching pattern stats', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching pattern stats.'
    });
  }
};

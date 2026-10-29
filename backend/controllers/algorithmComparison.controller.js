import { compareCrcAlgorithms, getComparisonStats } from '../services/algorithmComparison.service.js';
import { logger } from '../utils/logger.js';

/**
 * Controller to handle POST /api/crc/compare
 */
export const handleCompareCrcAlgorithms = (req, res) => {
  try {
    const { data } = req.body || {};

    if (data === undefined || data === null || typeof data !== 'string' || data.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: Payload "data" must be a non-empty string.'
      });
    }

    const result = compareCrcAlgorithms(data);
    logger.info(`CRC algorithms compared for payload [Length: ${data.length} chars]`);
    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error during CRC algorithm comparison', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error executing CRC algorithm comparison.'
    });
  }
};

/**
 * Controller to handle GET /api/crc/compare/stats
 */
export const handleGetComparisonStats = (req, res) => {
  try {
    const stats = getComparisonStats();
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching comparison stats', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching comparison stats.'
    });
  }
};

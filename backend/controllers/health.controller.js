import { getSystemHealthStatus } from '../services/health.service.js';
import { logger } from '../utils/logger.js';

/**
 * Controller to handle GET /api/health requests
 */
export const checkHealth = (req, res) => {
  try {
    const healthStatus = getSystemHealthStatus();
    logger.info('Health check endpoint called successfully');
    return res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Error handling health check', error);
    return res.status(500).json({
      status: "ERROR",
      message: "Internal server error during health check",
      error: error.message
    });
  }
};

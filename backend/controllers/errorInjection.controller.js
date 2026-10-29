import { injectErrorAndSimulate, getErrorInjectionStats } from '../services/errorInjection.service.js';
import { logger } from '../utils/logger.js';
import { CRC_ALGORITHM_DETAILS } from '../services/crc.service.js';

/**
 * Controller to handle POST /api/error-injection/simulate
 */
export const handleSimulateErrorInjection = (req, res) => {
  try {
    const { data, algorithm = 'CRC-32', errorType = 'SINGLE_BIT', bitCount, burstLength } = req.body || {};

    if (data === undefined || data === null || typeof data !== 'string' || data.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: Payload "data" must be a non-empty string.'
      });
    }

    const normalizedAlgo = (algorithm || '').toUpperCase().trim();
    if (!CRC_ALGORITHM_DETAILS[normalizedAlgo]) {
      return res.status(400).json({
        success: false,
        error: `Invalid algorithm '${algorithm}'. Supported algorithms: CRC-8, CRC-16, CRC-32.`
      });
    }

    const normalizedType = (errorType || '').toUpperCase().trim();
    const validTypes = ['SINGLE_BIT', 'MULTI_BIT', 'BURST', 'RANDOM'];
    if (!validTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid errorType '${errorType}'. Supported types: ${validTypes.join(', ')}.`
      });
    }

    // Specific field validations
    if (normalizedType === 'MULTI_BIT') {
      if (bitCount === undefined || bitCount === null || isNaN(parseInt(bitCount, 10)) || parseInt(bitCount, 10) < 1) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid field: "bitCount" must be a positive integer for MULTI_BIT error type.'
        });
      }
    }

    if (normalizedType === 'BURST') {
      if (burstLength === undefined || burstLength === null || isNaN(parseInt(burstLength, 10)) || parseInt(burstLength, 10) < 1) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid field: "burstLength" must be a positive integer for BURST error type.'
        });
      }
    }

    const result = injectErrorAndSimulate(data, normalizedAlgo, normalizedType, { bitCount, burstLength });
    logger.info(`Error injection simulated [ID: ${result.result.injectionId}, Type: ${normalizedType}, Status: ${result.result.status}]`);
    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error during error injection simulation', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error executing error injection simulation.'
    });
  }
};

/**
 * Controller to handle GET /api/error-injection/stats
 */
export const handleGetErrorInjectionStats = (req, res) => {
  try {
    const stats = getErrorInjectionStats();
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching error injection stats', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching error injection stats.'
    });
  }
};

import { simulateTransmission, getTransmissionStats } from '../services/transmission.service.js';
import { logger } from '../utils/logger.js';
import { CRC_ALGORITHM_DETAILS } from '../services/crc.service.js';

/**
 * Controller to handle POST /api/transmission/send
 */
export const handleSendTransmission = (req, res) => {
  try {
    const { data, algorithm = 'CRC-32' } = req.body || {};

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

    const result = simulateTransmission(data, normalizedAlgo);
    logger.info(`Transmission simulated [ID: ${result.transmission.transmissionId}, Status: ${result.transmission.status}]`);
    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error during transmission simulation', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during transmission simulation.',
      message: error.message
    });
  }
};

/**
 * Controller to handle GET /api/transmission/stats
 */
export const handleGetTransmissionStats = (req, res) => {
  try {
    const stats = getTransmissionStats();
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error fetching transmission stats', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error fetching transmission stats.'
    });
  }
};

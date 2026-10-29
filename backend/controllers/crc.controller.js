import { generateCrc, verifyCrc, CRC_ALGORITHM_DETAILS } from '../services/crc.service.js';
import { logger } from '../utils/logger.js';

/**
 * Controller to handle POST /api/crc/generate
 */
export const handleGenerateCrc = (req, res) => {
  try {
    const { data, algorithm = 'CRC-32' } = req.body || {};

    if (data === undefined || data === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "data" string is required.'
      });
    }

    if (typeof data !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Field "data" must be a string.'
      });
    }

    const normalizedAlgo = (algorithm || '').toUpperCase().trim();
    if (!CRC_ALGORITHM_DETAILS[normalizedAlgo]) {
      return res.status(400).json({
        success: false,
        error: `Invalid algorithm '${algorithm}'. Supported algorithms: CRC-8, CRC-16, CRC-32.`
      });
    }

    const result = generateCrc(data, normalizedAlgo);
    logger.info(`CRC generated successfully [Data: "${data}", Algo: ${normalizedAlgo}, CRC: ${result.crc}]`);
    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error generating CRC', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while generating CRC.',
      message: error.message
    });
  }
};

/**
 * Controller to handle POST /api/crc/verify
 */
export const handleVerifyCrc = (req, res) => {
  try {
    const { data, algorithm = 'CRC-32', expectedCrc } = req.body || {};

    if (data === undefined || data === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "data" string is required.'
      });
    }

    if (!expectedCrc || typeof expectedCrc !== 'string' || expectedCrc.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "expectedCrc" string is required.'
      });
    }

    const normalizedAlgo = (algorithm || '').toUpperCase().trim();
    if (!CRC_ALGORITHM_DETAILS[normalizedAlgo]) {
      return res.status(400).json({
        success: false,
        error: `Invalid algorithm '${algorithm}'. Supported algorithms: CRC-8, CRC-16, CRC-32.`
      });
    }

    const result = verifyCrc(data, normalizedAlgo, expectedCrc);
    logger.info(`CRC verified [Match: ${result.match}, Status: ${result.status}]`);
    return res.status(200).json(result);

  } catch (error) {
    logger.error('Error verifying CRC', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while verifying CRC.',
      message: error.message
    });
  }
};

/**
 * Controller to handle GET /api/crc/algorithms
 */
export const handleGetAlgorithms = (req, res) => {
  return res.status(200).json({
    success: true,
    algorithms: CRC_ALGORITHM_DETAILS
  });
};

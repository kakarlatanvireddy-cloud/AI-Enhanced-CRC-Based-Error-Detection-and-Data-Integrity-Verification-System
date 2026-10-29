import { generateCrc, CRC_ALGORITHM_DETAILS } from './crc.service.js';

/**
 * In-memory statistics store for Algorithm Comparison Module
 */
let comparisonCounter = 0;

/**
 * Retrieves total comparison operations count
 */
export const getComparisonStats = () => {
  return {
    totalComparisons: comparisonCounter
  };
};

/**
 * Compares CRC-8, CRC-16, and CRC-32 algorithms for a given data payload.
 * Reuses existing crc.service.js engine without duplicating mathematical logic.
 * @param {string} data Input payload string
 * @returns {object} Structured comparison result object
 */
export const compareCrcAlgorithms = (data) => {
  if (typeof data !== 'string' || data.trim() === '') {
    throw new Error('Invalid input: Payload "data" must be a non-empty string.');
  }

  comparisonCounter++;

  const algorithms = ['CRC-8', 'CRC-16', 'CRC-32'];
  const results = algorithms.map((algoKey) => {
    const crcGen = generateCrc(data, algoKey);
    const details = CRC_ALGORITHM_DETAILS[algoKey];

    return {
      algorithm: algoKey,
      name: details.name,
      width: details.bits,
      crc: crcGen.crc,
      binaryData: crcGen.binaryData,
      details: {
        poly: details.poly,
        init: details.init,
        xorOut: details.xorOut,
        refIn: details.refIn,
        refOut: details.refOut
      }
    };
  });

  return {
    success: true,
    data,
    payloadSize: Buffer.byteLength(data, 'utf-8'),
    results,
    timestamp: new Date().toISOString()
  };
};

import { generateCrc, verifyCrc, stringToBinary, CRC_ALGORITHM_DETAILS } from './crc.service.js';
import { recordInjectionEvent } from './telemetry.service.js';

/**
 * In-memory statistics store for Error Injection Module
 */
let injectionCounter = 0;
const errorInjectionStats = {
  totalInjections: 0,
  errorsDetected: 0,
  errorsNotDetected: 0
};

/**
 * Generates a unique, formatted Error Injection ID.
 * Example: ERR-20260929-0001
 */
const generateInjectionId = () => {
  injectionCounter++;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = String(injectionCounter).padStart(4, '0');
  return `ERR-${dateStr}-${seqStr}`;
};

/**
 * Retrieves live in-memory error injection statistics
 */
export const getErrorInjectionStats = () => {
  const { totalInjections, errorsDetected, errorsNotDetected } = errorInjectionStats;
  const detectionRate = totalInjections > 0 
    ? ((errorsDetected / totalInjections) * 100).toFixed(2) 
    : "0.00";

  return {
    totalInjections,
    errorsDetected,
    errorsNotDetected,
    detectionRate: `${detectionRate}%`
  };
};

/**
 * Helper to flip a specific bit index in a Buffer byte array.
 * @param {Buffer} buffer 
 * @param {number} bitIndex (0-indexed across full byte buffer)
 */
const flipBitInBuffer = (buffer, bitIndex) => {
  const byteIndex = Math.floor(bitIndex / 8);
  const bitPosInByte = 7 - (bitIndex % 8); // MSB to LSB
  buffer[byteIndex] ^= (1 << bitPosInByte);
};

/**
 * Main error injection simulator engine.
 * @param {string} data Original payload
 * @param {string} algorithm CRC algorithm ('CRC-8', 'CRC-16', 'CRC-32')
 * @param {string} errorType ('SINGLE_BIT', 'MULTI_BIT', 'BURST', 'RANDOM')
 * @param {object} options { bitCount, burstLength, customBitPosition }
 */
export const injectErrorAndSimulate = (data, algorithm = 'CRC-32', errorType = 'SINGLE_BIT', options = {}) => {
  if (typeof data !== 'string' || data.trim() === '') {
    throw new Error('Invalid input: Payload "data" must be a non-empty string.');
  }

  const normalizedAlgo = (algorithm || '').toUpperCase().trim();
  if (!CRC_ALGORITHM_DETAILS[normalizedAlgo]) {
    throw new Error(`Invalid algorithm '${algorithm}'. Supported: CRC-8, CRC-16, CRC-32`);
  }

  const normalizedType = (errorType || '').toUpperCase().trim();
  const validTypes = ['SINGLE_BIT', 'MULTI_BIT', 'BURST', 'RANDOM'];
  if (!validTypes.includes(normalizedType)) {
    throw new Error(`Invalid errorType '${errorType}'. Supported: ${validTypes.join(', ')}`);
  }

  // 1. Sender Side: Calculate Original CRC
  const senderCrcResult = generateCrc(data, normalizedAlgo);
  const originalCrc = senderCrcResult.crc;
  const originalBinary = senderCrcResult.binaryData;

  // Prepare binary buffer for bit manipulation
  const origBuffer = Buffer.from(data, 'utf-8');
  const corruptedBuffer = Buffer.from(origBuffer); // Clone buffer
  const totalBits = origBuffer.length * 8;

  if (totalBits === 0) {
    throw new Error('Payload contains 0 bits; cannot inject errors.');
  }

  let changedBitPositions = [];
  let burstDetails = null;

  // 2. Bitwise Mutation Logic by Error Type
  switch (normalizedType) {
    case 'SINGLE_BIT': {
      // Flip single bit at specified position or default to bit 0
      const pos = (typeof options.customBitPosition === 'number' && options.customBitPosition >= 0 && options.customBitPosition < totalBits)
        ? options.customBitPosition
        : 0;
      flipBitInBuffer(corruptedBuffer, pos);
      changedBitPositions = [pos];
      break;
    }

    case 'RANDOM': {
      // Randomly select valid bit index
      const randPos = Math.floor(Math.random() * totalBits);
      flipBitInBuffer(corruptedBuffer, randPos);
      changedBitPositions = [randPos];
      break;
    }

    case 'MULTI_BIT': {
      const bitCount = parseInt(options.bitCount, 10);
      if (isNaN(bitCount) || bitCount < 1) {
        throw new Error('Invalid input: "bitCount" must be a positive integer for MULTI_BIT error type.');
      }
      if (bitCount > totalBits) {
        throw new Error(`Requested bitCount (${bitCount}) exceeds total payload size (${totalBits} bits).`);
      }

      // Select distinct random positions
      const positionsSet = new Set();
      while (positionsSet.size < bitCount) {
        positionsSet.add(Math.floor(Math.random() * totalBits));
      }
      changedBitPositions = Array.from(positionsSet).sort((a, b) => a - b);
      changedBitPositions.forEach(pos => flipBitInBuffer(corruptedBuffer, pos));
      break;
    }

    case 'BURST': {
      const burstLength = parseInt(options.burstLength, 10);
      if (isNaN(burstLength) || burstLength < 1) {
        throw new Error('Invalid input: "burstLength" must be a positive integer for BURST error type.');
      }
      if (burstLength > totalBits) {
        throw new Error(`Requested burstLength (${burstLength}) exceeds total payload size (${totalBits} bits).`);
      }

      // Pick start index such that burst fits within totalBits
      const maxStart = totalBits - burstLength;
      const startPos = Math.floor(Math.random() * (maxStart + 1));
      const endPos = startPos + burstLength - 1;

      for (let p = startPos; p <= endPos; p++) {
        changedBitPositions.push(p);
        flipBitInBuffer(corruptedBuffer, p);
      }

      burstDetails = {
        burstLength,
        startPosition: startPos,
        endPosition: endPos
      };
      break;
    }
  }

  // 3. Receiver Side: Form corrupted payload & compute CRC on corrupted data
  // Convert corrupted buffer to string safely
  const receivedData = corruptedBuffer.toString('utf-8');
  const corruptedBinary = stringToBinary(corruptedBuffer);

  // Recalculate CRC using receiver's corrupted payload
  const receiverCrcResult = generateCrc(receivedData, normalizedAlgo);
  const calculatedCrc = receiverCrcResult.crc;

  // Compare Receiver Calculated CRC with ORIGINAL Transmitted CRC
  const match = (calculatedCrc === originalCrc);
  const errorDetected = !match;
  const status = errorDetected ? 'ERROR DETECTED' : 'CRC MATCH (UNDETECTED)';

  // 4. Update In-Memory Statistics
  errorInjectionStats.totalInjections++;
  if (errorDetected) {
    errorInjectionStats.errorsDetected++;
  } else {
    errorInjectionStats.errorsNotDetected++;
  }

  // 5. Build Result Object
  const injectionId = generateInjectionId();
  const timestamp = new Date().toISOString();

  const injectionResult = {
    injectionId,
    data,
    algorithm: normalizedAlgo,
    errorType: normalizedType,
    originalBinary,
    corruptedBinary,
    originalCrc,
    receivedData,
    calculatedCrc,
    match,
    status,
    errorDetected,
    changedBitPositions,
    changedBitCount: changedBitPositions.length,
    burstDetails,
    timestamp,
    totalBits
  };

  // 6. Record event in Module 5 telemetry store (non-destructive)
  recordInjectionEvent(injectionResult);

  return {
    success: true,
    result: injectionResult,
    stats: getErrorInjectionStats()
  };
};

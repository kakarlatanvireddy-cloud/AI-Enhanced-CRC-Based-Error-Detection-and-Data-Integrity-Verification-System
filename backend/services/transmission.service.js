import { generateCrc, verifyCrc } from './crc.service.js';
import { recordTransmissionEvent } from './telemetry.service.js';

/**
 * In-memory transmission statistics store
 */
let transmissionCounter = 0;
const transmissionStats = {
  totalTransmissions: 0,
  successfulTransmissions: 0,
  crcErrors: 0
};

/**
 * Generates a unique, formatted Transmission ID.
 * Example: TXN-20260929-0001
 */
const generateTransmissionId = () => {
  transmissionCounter++;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = String(transmissionCounter).padStart(4, '0');
  return `TXN-${dateStr}-${seqStr}`;
};

/**
 * Retrieves live in-memory transmission statistics
 */
export const getTransmissionStats = () => {
  const { totalTransmissions, successfulTransmissions, crcErrors } = transmissionStats;
  const errorRate = totalTransmissions > 0 
    ? ((crcErrors / totalTransmissions) * 100).toFixed(2) 
    : "0.00";

  return {
    totalTransmissions,
    successfulTransmissions,
    crcErrors,
    errorRate: `${errorRate}%`,
    errorRateNumeric: parseFloat(errorRate)
  };
};

/**
 * Simulates end-to-end packet transmission over communication channel
 * @param {string} data Input payload string
 * @param {string} algorithm Selected CRC algorithm ('CRC-8', 'CRC-16', 'CRC-32')
 * @returns {object} Transmission simulation result object
 */
export const simulateTransmission = (data, algorithm = 'CRC-32') => {
  if (typeof data !== 'string' || data.trim() === '') {
    throw new Error('Invalid input: Transmission payload "data" must be a non-empty string.');
  }

  // 1. Sender Side: Generate CRC
  const senderGen = generateCrc(data, algorithm);

  // 2. Channel Transmission (Unmodified in Module 2)
  const txId = generateTransmissionId();
  const timestamp = new Date().toISOString();
  const receivedData = data;
  const transmittedCrc = senderGen.crc;

  // 3. Receiver Side: Verify Received Payload
  const receiverVerify = verifyCrc(receivedData, senderGen.algorithm, transmittedCrc);

  // 4. Update In-Memory Metrics
  transmissionStats.totalTransmissions++;
  if (receiverVerify.match) {
    transmissionStats.successfulTransmissions++;
  } else {
    transmissionStats.crcErrors++;
  }

  // 5. Construct Transmission Record
  const transmissionRecord = {
    transmissionId: txId,
    data: senderGen.data,
    algorithm: senderGen.algorithm,
    binaryData: senderGen.binaryData,
    generatedCrc: senderGen.crc,
    transmittedCrc,
    receivedData,
    calculatedCrc: receiverVerify.calculatedCrc,
    match: receiverVerify.match,
    status: receiverVerify.match ? 'SUCCESS' : 'CRC ERROR',
    errorDetected: !receiverVerify.match,
    payloadSize: Buffer.byteLength(data, 'utf-8'),
    timestamp,
    channelStatus: 'NO NOISE (Normal Module 2 Stream)'
  };

  // 6. Record event in Module 5 telemetry store (non-destructive)
  recordTransmissionEvent(transmissionRecord);

  return {
    success: true,
    transmission: transmissionRecord,
    stats: getTransmissionStats()
  };
};

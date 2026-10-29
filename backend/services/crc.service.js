/**
 * CRC Engine Service
 * Standard CRC implementation for CRC-8, CRC-16, and CRC-32 algorithms.
 * 
 * Algorithm Configurations & Test Vectors:
 * 1. CRC-8 (CRC-8 / SMBus)
 *    - Polynomial: 0x07 (x^8 + x^2 + x + 1)
 *    - Initial Value: 0x00
 *    - RefIn: false, RefOut: false
 *    - Final XOR: 0x00
 *    - Standard Test Vector ("123456789"): 0xF4
 * 
 * 2. CRC-16 (CRC-16 / ARC - IBM Standard)
 *    - Polynomial: 0x8005 (x^16 + x^15 + x^2 + 1, reflected: 0xA001)
 *    - Initial Value: 0x0000
 *    - RefIn: true, RefOut: true
 *    - Final XOR: 0x0000
 *    - Standard Test Vector ("123456789"): 0xBB3D
 * 
 * 3. CRC-32 (IEEE 802.3 Ethernet standard)
 *    - Polynomial: 0x04C11DB7 (reflected: 0xEDB88320)
 *    - Initial Value: 0xFFFFFFFF
 *    - RefIn: true, RefOut: true
 *    - Final XOR: 0xFFFFFFFF
 *    - Standard Test Vector ("123456789"): 0xCBF43926
 */

/**
 * Metadata parameters for supported CRC algorithms
 */
export const CRC_ALGORITHM_DETAILS = {
  'CRC-8': {
    name: 'CRC-8 / SMBus',
    bits: 8,
    poly: '0x07',
    init: '0x00',
    xorOut: '0x00',
    refIn: false,
    refOut: false,
    testVectorInput: '123456789',
    testVectorExpected: 'F4'
  },
  'CRC-16': {
    name: 'CRC-16 / ARC (IBM)',
    bits: 16,
    poly: '0x8005',
    init: '0x0000',
    xorOut: '0x0000',
    refIn: true,
    refOut: true,
    testVectorInput: '123456789',
    testVectorExpected: 'BB3D'
  },
  'CRC-32': {
    name: 'CRC-32 (IEEE 802.3)',
    bits: 32,
    poly: '0x04C11DB7',
    init: '0xFFFFFFFF',
    xorOut: '0xFFFFFFFF',
    refIn: true,
    refOut: true,
    testVectorInput: '123456789',
    testVectorExpected: 'CBF43926'
  }
};

/**
 * Converts a string or Buffer into its binary 8-bit representation string.
 * @param {string|Buffer} input 
 * @returns {string} Space-separated 8-bit binary string
 */
export const stringToBinary = (input) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf-8');
  return Array.from(buffer)
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join(' ');
};

/**
 * Computes CRC-8 (SMBus) checksum for input buffer.
 * @param {Buffer} buffer 
 * @returns {string} Hexadecimal CRC string (padded to 2 chars)
 */
export const calculateCrc8 = (buffer) => {
  let crc = 0x00;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x80) !== 0) {
        crc = ((crc << 1) ^ 0x07) & 0xFF;
      } else {
        crc = (crc << 1) & 0xFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(2, '0');
};

/**
 * Computes CRC-16 (ARC / IBM) checksum for input buffer.
 * Poly 0x8005 reflected = 0xA001, RefIn = true, RefOut = true.
 * @param {Buffer} buffer 
 * @returns {string} Hexadecimal CRC string (padded to 4 chars)
 */
export const calculateCrc16 = (buffer) => {
  let crc = 0x0000;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x0001) !== 0) {
        crc = ((crc >>> 1) ^ 0xA001) & 0xFFFF;
      } else {
        crc = (crc >>> 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Computes CRC-32 (IEEE 802.3) checksum for input buffer.
 * Poly 0x04C11DB7 reflected = 0xEDB88320, Init = 0xFFFFFFFF, RefIn = true, RefOut = true, XorOut = 0xFFFFFFFF.
 * Standard Test Vector "123456789" -> "CBF43926".
 * @param {Buffer} buffer 
 * @returns {string} Hexadecimal CRC string (padded to 8 chars)
 */
export const calculateCrc32 = (buffer) => {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xEDB88320 & mask);
    }
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
};

/**
 * Main calculation dispatcher.
 * @param {string} data Input text payload
 * @param {string} algorithm CRC algorithm ('CRC-8', 'CRC-16', 'CRC-32')
 * @returns {object} CRC computation result
 */
export const generateCrc = (data, algorithm) => {
  if (typeof data !== 'string') {
    throw new Error('Invalid input: Data must be a string');
  }

  const normalizedAlgo = (algorithm || '').toUpperCase().trim();
  if (!CRC_ALGORITHM_DETAILS[normalizedAlgo]) {
    throw new Error(`Unsupported algorithm '${algorithm}'. Supported: CRC-8, CRC-16, CRC-32`);
  }

  const buffer = Buffer.from(data, 'utf-8');
  let crcValue = '';

  switch (normalizedAlgo) {
    case 'CRC-8':
      crcValue = calculateCrc8(buffer);
      break;
    case 'CRC-16':
      crcValue = calculateCrc16(buffer);
      break;
    case 'CRC-32':
      crcValue = calculateCrc32(buffer);
      break;
  }

  return {
    success: true,
    data,
    algorithm: normalizedAlgo,
    crc: crcValue,
    binaryData: stringToBinary(buffer),
    status: 'generated',
    details: CRC_ALGORITHM_DETAILS[normalizedAlgo]
  };
};

/**
 * Verifies if incoming expected CRC matches calculated CRC.
 * @param {string} data 
 * @param {string} algorithm 
 * @param {string} expectedCrc 
 * @returns {object} Verification result
 */
export const verifyCrc = (data, algorithm, expectedCrc) => {
  if (typeof expectedCrc !== 'string' || expectedCrc.trim() === '') {
    throw new Error('Invalid input: Expected CRC is required for verification');
  }

  const genResult = generateCrc(data, algorithm);
  const calculatedCrc = genResult.crc.toUpperCase().trim();
  const normalizedExpected = expectedCrc.toUpperCase().trim();

  // Strip leading 0x if present
  const cleanExpected = normalizedExpected.startsWith('0X') 
    ? normalizedExpected.slice(2) 
    : normalizedExpected;

  const match = (calculatedCrc === cleanExpected);

  return {
    success: true,
    algorithm: genResult.algorithm,
    calculatedCrc,
    expectedCrc: cleanExpected,
    match,
    status: match ? 'VALID' : 'ERROR DETECTED'
  };
};

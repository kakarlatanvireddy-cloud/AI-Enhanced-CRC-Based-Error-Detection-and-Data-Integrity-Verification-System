import { simulateTransmission, getTransmissionStats } from '../services/transmission.service.js';
import { generateCrc } from '../services/crc.service.js';

console.log('====================================================');
console.log('   RUNNING BACKEND TRANSMISSION SIMULATOR TESTS     ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

const assert = (description, condition) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${description}`);
  } else {
    console.error(`❌ FAIL: ${description}`);
  }
};

try {
  // Test 1: Successful transmission using CRC-8
  const resCrc8 = simulateTransmission('TEST_PAYLOAD_8', 'CRC-8');
  assert(
    'CRC-8 transmission returns status SUCCESS and match=true',
    resCrc8.transmission.status === 'SUCCESS' && resCrc8.transmission.match === true
  );

  // Test 2: Successful transmission using CRC-16
  const resCrc16 = simulateTransmission('TEST_PAYLOAD_16', 'CRC-16');
  assert(
    'CRC-16 transmission returns status SUCCESS and match=true',
    resCrc16.transmission.status === 'SUCCESS' && resCrc16.transmission.match === true
  );

  // Test 3: Successful transmission using CRC-32
  const resCrc32 = simulateTransmission('123456789', 'CRC-32');
  assert(
    'CRC-32 transmission returns status SUCCESS and generatedCrc=CBF43926',
    resCrc32.transmission.status === 'SUCCESS' && resCrc32.transmission.generatedCrc === 'CBF43926'
  );

  // Test 4: Receiver CRC matches sender CRC
  assert(
    'Receiver calculated CRC matches transmitted CRC exactly',
    resCrc32.transmission.calculatedCrc === resCrc32.transmission.transmittedCrc
  );

  // Test 5: Formatted Transmission ID is generated
  assert(
    `Generates unique formatted Transmission ID (Got: ${resCrc32.transmission.transmissionId})`,
    /^TXN-\d{8}-\d{4}$/.test(resCrc32.transmission.transmissionId)
  );

  // Test 6: In-Memory telemetry statistics updated
  const stats = getTransmissionStats();
  assert(
    `Transmission stats updated correctly (Total: ${stats.totalTransmissions}, Success: ${stats.successfulTransmissions})`,
    stats.totalTransmissions >= 3 && stats.successfulTransmissions >= 3
  );

  // Test 7: Empty data is rejected
  try {
    simulateTransmission('', 'CRC-32');
    assert('Throws error on empty data payload', false);
  } catch (err) {
    assert('Throws error on empty data payload', true);
  }

  // Test 8: Invalid algorithm is rejected
  try {
    simulateTransmission('HELLO', 'CRC-INVALID');
    assert('Throws error on invalid CRC algorithm', false);
  } catch (err) {
    assert('Throws error on invalid CRC algorithm', true);
  }

} catch (error) {
  console.error('Unexpected error during transmission tests:', error);
}

console.log(`\n----------------------------------------------------`);
console.log(`Test Summary: ${passedTests}/${totalTests} Passed.`);
console.log(`----------------------------------------------------\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

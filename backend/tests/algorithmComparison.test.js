import { compareCrcAlgorithms } from '../services/algorithmComparison.service.js';

console.log('====================================================');
console.log('   RUNNING BACKEND ALGORITHM COMPARISON TESTS       ');
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
  // Test 1: Test Vector "123456789" returns exact standard CRC results
  const resVector = compareCrcAlgorithms('123456789');
  assert(
    'Returns array of 3 algorithm results (CRC-8, CRC-16, CRC-32)',
    resVector.results && resVector.results.length === 3
  );

  const crc8Res = resVector.results.find(r => r.algorithm === 'CRC-8');
  const crc16Res = resVector.results.find(r => r.algorithm === 'CRC-16');
  const crc32Res = resVector.results.find(r => r.algorithm === 'CRC-32');

  assert(
    `CRC-8 for "123456789" produces F4 (Got: ${crc8Res ? crc8Res.crc : 'null'})`,
    crc8Res && crc8Res.crc === 'F4' && crc8Res.width === 8
  );

  assert(
    `CRC-16 for "123456789" produces BB3D (Got: ${crc16Res ? crc16Res.crc : 'null'})`,
    crc16Res && crc16Res.crc === 'BB3D' && crc16Res.width === 16
  );

  assert(
    `CRC-32 for "123456789" produces CBF43926 (Got: ${crc32Res ? crc32Res.crc : 'null'})`,
    crc32Res && crc32Res.crc === 'CBF43926' && crc32Res.width === 32
  );

  // Test 2: Payload "HELLO" returns valid comparison results
  const resHello = compareCrcAlgorithms('HELLO');
  assert(
    'Payload "HELLO" returns non-empty CRCs for all three algorithms',
    resHello.results.every(r => typeof r.crc === 'string' && r.crc.length > 0)
  );

  // Test 3: Empty payload is rejected
  try {
    compareCrcAlgorithms('');
    assert('Rejects empty payload string', false);
  } catch (err) {
    assert('Rejects empty payload string', true);
  }

} catch (error) {
  console.error('Unexpected error during algorithm comparison tests:', error);
}

console.log(`\n----------------------------------------------------`);
console.log(`Test Summary: ${passedTests}/${totalTests} Passed.`);
console.log(`----------------------------------------------------\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

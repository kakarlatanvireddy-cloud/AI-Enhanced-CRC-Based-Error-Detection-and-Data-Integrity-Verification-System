import { generateCrc, verifyCrc, CRC_ALGORITHM_DETAILS } from '../services/crc.service.js';

console.log('====================================================');
console.log('       RUNNING BACKEND CRC SERVICE TESTS            ');
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
  // Test 1: CRC-32 Standard Test Vector ("123456789" -> "CBF43926")
  const crc32Result = generateCrc('123456789', 'CRC-32');
  assert(
    `CRC-32 Test Vector "123456789" produces CBF43926 (Got: ${crc32Result.crc})`,
    crc32Result.crc === 'CBF43926'
  );

  // Test 2: CRC-16 Test Vector ("123456789" -> "BB3D")
  const crc16Result = generateCrc('123456789', 'CRC-16');
  assert(
    `CRC-16 Test Vector "123456789" produces BB3D (Got: ${crc16Result.crc})`,
    crc16Result.crc === 'BB3D'
  );

  // Test 3: CRC-8 Test Vector ("123456789" -> "F4")
  const crc8Result = generateCrc('123456789', 'CRC-8');
  assert(
    `CRC-8 Test Vector "123456789" produces F4 (Got: ${crc8Result.crc})`,
    crc8Result.crc === 'F4'
  );

  // Test 4: Verification - Same data + expected CRC -> VALID
  const verifyValid = verifyCrc('123456789', 'CRC-32', 'CBF43926');
  assert(
    `Verification of unchanged data returns match=true & status=VALID`,
    verifyValid.match === true && verifyValid.status === 'VALID'
  );

  // Test 5: Verification - Modified data + original CRC -> ERROR DETECTED
  const verifyModified = verifyCrc('123456789_MODIFIED', 'CRC-32', 'CBF43926');
  assert(
    `Verification of corrupted payload returns match=false & status=ERROR DETECTED`,
    verifyModified.match === false && verifyModified.status === 'ERROR DETECTED'
  );

  // Test 6: Verification with prefix 0x ("0xCBF43926")
  const verifyPrefix = verifyCrc('123456789', 'CRC-32', '0xCBF43926');
  assert(
    `Verification handles '0x' prefix correctly`,
    verifyPrefix.match === true
  );

  // Test 7: Error handling for invalid algorithm
  try {
    generateCrc('HELLO', 'CRC-INVALID');
    assert('Throws error on invalid algorithm', false);
  } catch (err) {
    assert('Throws error on invalid algorithm', true);
  }

} catch (error) {
  console.error('Unexpected error during test execution:', error);
}

console.log(`\n----------------------------------------------------`);
console.log(`Test Summary: ${passedTests}/${totalTests} Passed.`);
console.log(`----------------------------------------------------\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

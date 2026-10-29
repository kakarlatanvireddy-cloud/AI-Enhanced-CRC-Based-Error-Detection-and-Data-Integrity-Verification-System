import { injectErrorAndSimulate, getErrorInjectionStats } from '../services/errorInjection.service.js';
import { generateCrc } from '../services/crc.service.js';

console.log('====================================================');
console.log('   RUNNING BACKEND ERROR INJECTION SIMULATOR TESTS  ');
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
  // Test 1: SINGLE_BIT error injection
  const resSingle = injectErrorAndSimulate('HELLO', 'CRC-32', 'SINGLE_BIT');
  const origCrcHello = generateCrc('HELLO', 'CRC-32').crc;
  assert(
    'SINGLE_BIT injection succeeds and preserves original CRC (C1446436)',
    resSingle.result.originalCrc === origCrcHello && resSingle.result.originalCrc === 'C1446436'
  );
  assert(
    'SINGLE_BIT changes exactly 1 bit position',
    resSingle.result.changedBitCount === 1 && resSingle.result.changedBitPositions.length === 1
  );
  assert(
    'SINGLE_BIT produces receiver CRC mismatch and status ERROR DETECTED',
    resSingle.result.errorDetected === true && resSingle.result.status === 'ERROR DETECTED'
  );

  // Test 2: MULTI_BIT error injection (bitCount = 3)
  const resMulti = injectErrorAndSimulate('HELLO TRANSMISSION PAYLOAD', 'CRC-32', 'MULTI_BIT', { bitCount: 3 });
  assert(
    'MULTI_BIT injection changes exactly 3 distinct bit positions',
    resMulti.result.changedBitCount === 3 && 
    resMulti.result.changedBitPositions.length === 3 &&
    new Set(resMulti.result.changedBitPositions).size === 3
  );
  assert(
    'MULTI_BIT calculates receiver CRC on corrupted payload and detects error',
    resMulti.result.errorDetected === true
  );

  // Test 3: MULTI_BIT invalid bitCount validations
  try {
    injectErrorAndSimulate('HELLO', 'CRC-32', 'MULTI_BIT', { bitCount: 0 });
    assert('Rejects bitCount = 0', false);
  } catch (err) {
    assert('Rejects bitCount = 0', true);
  }

  try {
    injectErrorAndSimulate('HELLO', 'CRC-32', 'MULTI_BIT', { bitCount: -2 });
    assert('Rejects negative bitCount', false);
  } catch (err) {
    assert('Rejects negative bitCount', true);
  }

  try {
    injectErrorAndSimulate('HI', 'CRC-32', 'MULTI_BIT', { bitCount: 500 });
    assert('Rejects bitCount greater than available bits', false);
  } catch (err) {
    assert('Rejects bitCount greater than available bits', true);
  }

  // Test 4: BURST error injection (burstLength = 4)
  const resBurst = injectErrorAndSimulate('HELLO NETWORK PAYLOAD', 'CRC-32', 'BURST', { burstLength: 4 });
  const positions = resBurst.result.changedBitPositions;
  const isConsecutive = positions.length === 4 && positions.every((val, i) => i === 0 || val === positions[i - 1] + 1);
  assert(
    'BURST injection changes exactly 4 consecutive bit positions',
    resBurst.result.changedBitCount === 4 && isConsecutive
  );
  assert(
    'BURST injection records valid start and end positions',
    resBurst.result.burstDetails && resBurst.result.burstDetails.endPosition - resBurst.result.burstDetails.startPosition === 3
  );

  // Test 5: BURST invalid burstLength validations
  try {
    injectErrorAndSimulate('HI', 'CRC-32', 'BURST', { burstLength: 500 });
    assert('Rejects burstLength greater than available bits', false);
  } catch (err) {
    assert('Rejects burstLength greater than available bits', true);
  }

  // Test 6: RANDOM error injection
  const resRandom = injectErrorAndSimulate('123456789', 'CRC-32', 'RANDOM');
  assert(
    'RANDOM injection changes exactly 1 valid bit position',
    resRandom.result.changedBitCount === 1 && 
    resRandom.result.changedBitPositions[0] >= 0 && 
    resRandom.result.changedBitPositions[0] < resRandom.result.totalBits
  );
  assert(
    'RANDOM injection on 123456789 preserves original CRC CBF43926',
    resRandom.result.originalCrc === 'CBF43926'
  );

  // Test 7: General input validations
  try {
    injectErrorAndSimulate('', 'CRC-32', 'SINGLE_BIT');
    assert('Rejects empty data payload', false);
  } catch (err) {
    assert('Rejects empty data payload', true);
  }

  try {
    injectErrorAndSimulate('HELLO', 'CRC-INVALID', 'SINGLE_BIT');
    assert('Rejects invalid CRC algorithm', false);
  } catch (err) {
    assert('Rejects invalid CRC algorithm', true);
  }

  try {
    injectErrorAndSimulate('HELLO', 'CRC-32', 'INVALID_ERROR_TYPE');
    assert('Rejects invalid errorType', false);
  } catch (err) {
    assert('Rejects invalid errorType', true);
  }

  // Test 8: Statistics updating
  const stats = getErrorInjectionStats();
  assert(
    `Error injection stats updated (Total: ${stats.totalInjections}, Detected: ${stats.errorsDetected})`,
    stats.totalInjections >= 4 && stats.errorsDetected >= 4
  );

} catch (error) {
  console.error('Unexpected error during error injection tests:', error);
}

console.log(`\n----------------------------------------------------`);
console.log(`Test Summary: ${passedTests}/${totalTests} Passed.`);
console.log(`----------------------------------------------------\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

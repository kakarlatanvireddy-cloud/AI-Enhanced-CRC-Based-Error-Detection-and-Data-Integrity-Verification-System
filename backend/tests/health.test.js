import { getSystemHealthStatus } from '../services/health.service.js';

console.log('====================================================');
console.log('   RUNNING BACKEND HEALTH ENDPOINT TESTS            ');
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
  const health = getSystemHealthStatus();

  // Test 1: Top-level status is OK
  assert('Health status is "OK"', health.status === 'OK');

  // Test 2: modules object exists
  assert('Health response contains a modules object', health.modules && typeof health.modules === 'object');

  // Test 3: crcGenerator is active
  assert('crcGenerator module is "active"', health.modules.crcGenerator === 'active');

  // Test 4: transmissionSimulator is active
  assert('transmissionSimulator module is "active"', health.modules.transmissionSimulator === 'active');

  // Test 5: errorInjector is active
  assert('errorInjector module is "active"', health.modules.errorInjector === 'active');

  // Test 6: algorithmComparison is active (Module 4 requirement)
  assert(
    'algorithmComparison module is "active" (Module 4)',
    health.modules.algorithmComparison === 'active'
  );

  // Test 7: timestamp is present and ISO format
  assert(
    'Health response contains an ISO timestamp',
    typeof health.timestamp === 'string' && health.timestamp.includes('T')
  );

  // Test 8: uptimeSeconds is a non-negative number
  assert(
    'uptimeSeconds is a non-negative number',
    typeof health.uptimeSeconds === 'number' && health.uptimeSeconds >= 0
  );

  // Test 9: message is present
  assert(
    'Health response contains a message string',
    typeof health.message === 'string' && health.message.length > 0
  );

} catch (error) {
  console.error('Unexpected error during health tests:', error);
}

console.log(`\n----------------------------------------------------`);
console.log(`Test Summary: ${passedTests}/${totalTests} Passed.`);
console.log(`----------------------------------------------------\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

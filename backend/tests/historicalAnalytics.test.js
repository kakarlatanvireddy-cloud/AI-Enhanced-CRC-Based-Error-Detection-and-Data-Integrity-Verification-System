/**
 * Historical Analytics Tests — Module 8
 *
 * Tests retrospective data aggregation, date-range filtering,
 * timeline bucketing, error-type distributions, algorithm outcome summaries,
 * and CSV export capabilities.
 */

import {
  getHistoricalOverview,
  getHistoricalTimeline,
  getHistoricalErrorDistribution,
  getHistoricalAlgorithmOutcomes,
  exportHistoricalCsv
} from '../services/historicalAnalytics.service.js';
import {
  recordTransmissionEvent,
  recordInjectionEvent,
  clearTelemetry
} from '../services/telemetry.service.js';
import {
  createAlert,
  clearAlertHistory
} from '../services/alert.service.js';

console.log('====================================================');
console.log('   RUNNING MODULE 8 HISTORICAL ANALYTICS TESTS      ');
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

// Clean slate
clearTelemetry();
clearAlertHistory();

// ─── 1. Empty History Analytics Tests ──────────────────────────────────────────

console.log('\n--- 1. Empty History Tests ---');

const emptyOverview = getHistoricalOverview();
assert('Empty overview returns totalEvents: 0', emptyOverview.totalEvents === 0);
assert('Empty overview transmissions total is 0', emptyOverview.transmissions.total === 0);
assert('Empty overview error injections detectionRate is N/A', emptyOverview.errorInjections.detectionRate === 'N/A');

const emptyTimeline = getHistoricalTimeline({ buckets: 6 });
assert('Empty history produces empty timeline array', Array.isArray(emptyTimeline) && emptyTimeline.length === 0);

const emptyDist = getHistoricalErrorDistribution();
assert('Empty error distribution returns totalInjections: 0', emptyDist.totalInjections === 0);
assert('Empty error distribution has 4 canonical error types', emptyDist.distribution.length === 4);

const emptyAlgos = getHistoricalAlgorithmOutcomes();
assert('Empty algorithm outcomes has 3 algorithms (CRC-8, CRC-16, CRC-32)', emptyAlgos.length === 3);
assert('All algorithm detection rates are null when no injections exist', emptyAlgos.every(a => a.empiricalDetectionRate === null));

// ─── 2. Populated History Analytics Tests ──────────────────────────────────────

console.log('\n--- 2. Populated History Tests ---');

const now = Date.now();

// Record Transmissions
recordTransmissionEvent({
  transmissionId: 'TXN-H1',
  timestamp: new Date(now - 60000).toISOString(),
  payloadSize: 10,
  algorithm: 'CRC-32',
  status: 'SUCCESS',
  match: true,
  errorDetected: false
});

recordTransmissionEvent({
  transmissionId: 'TXN-H2',
  timestamp: new Date(now - 45000).toISOString(),
  payloadSize: 10,
  algorithm: 'CRC-16',
  status: 'CRC ERROR',
  match: false,
  errorDetected: true
});

// Record Error Injections
recordInjectionEvent({
  injectionId: 'INJ-H1',
  timestamp: new Date(now - 30000).toISOString(),
  totalBits: 64,
  algorithm: 'CRC-32',
  status: 'ERROR DETECTED',
  match: false,
  errorDetected: true,
  errorType: 'SINGLE_BIT',
  changedBitCount: 1,
  burstDetails: null
});

recordInjectionEvent({
  injectionId: 'INJ-H2',
  timestamp: new Date(now - 15000).toISOString(),
  totalBits: 64,
  algorithm: 'CRC-32',
  status: 'ERROR DETECTED',
  match: false,
  errorDetected: true,
  errorType: 'BURST',
  changedBitCount: 4,
  burstDetails: { burstLength: 4 }
});

recordInjectionEvent({
  injectionId: 'INJ-H3',
  timestamp: new Date(now - 5000).toISOString(),
  totalBits: 64,
  algorithm: 'CRC-8',
  status: 'CRC MATCH (UNDETECTED)',
  match: true,
  errorDetected: false,
  errorType: 'MULTI_BIT',
  changedBitCount: 2,
  burstDetails: null
});

const populatedOverview = getHistoricalOverview();
assert('Populated overview records 5 total events', populatedOverview.totalEvents === 5);
assert('Populated overview transmissions total is 2', populatedOverview.transmissions.total === 2);
assert('Populated overview transmissions failed is 1 (50.0%)', populatedOverview.transmissions.failed === 1 && populatedOverview.transmissions.errorRateNumeric === 50.0);
assert('Populated overview error injections total is 3', populatedOverview.errorInjections.total === 3);
assert('Populated overview error injections detected is 2 (66.7%)', populatedOverview.errorInjections.detected === 2 && populatedOverview.errorInjections.detectionRateNumeric === 66.7);

// ─── 3. Historical Timeline Bucketing Tests ────────────────────────────────────

console.log('\n--- 3. Historical Timeline Tests ---');

const timeline = getHistoricalTimeline({ buckets: 4 });
assert('Timeline returns requested 4 buckets', timeline.length === 4);

const totalTimelineEvents = timeline.reduce((acc, b) => acc + b.totalEvents, 0);
assert('Timeline event count sum equals total events (5)', totalTimelineEvents === 5);

const txSum = timeline.reduce((acc, b) => acc + b.transmissions, 0);
assert('Timeline transmission count equals 2', txSum === 2);

const injSum = timeline.reduce((acc, b) => acc + b.injections, 0);
assert('Timeline injection count equals 3', injSum === 3);

// ─── 4. Error Distribution & Bit Stats Tests ───────────────────────────────────

console.log('\n--- 4. Error Distribution Tests ---');

const dist = getHistoricalErrorDistribution();
assert('Error distribution records 3 total injections', dist.totalInjections === 3);

const singleDist = dist.distribution.find(d => d.errorType === 'SINGLE_BIT');
assert('SINGLE_BIT count is 1 (33.3%)', singleDist && singleDist.count === 1 && singleDist.percentage === 33.3);

const burstDist = dist.distribution.find(d => d.errorType === 'BURST');
assert('BURST count is 1 (33.3%)', burstDist && burstDist.count === 1 && burstDist.percentage === 33.3);

assert('Bit stats count is 3', dist.bitStats.count === 3);
assert('Bit stats mean is calculated correctly (2.33)', dist.bitStats.mean === 2.33);
assert('Bit stats min is 1 and max is 4', dist.bitStats.min === 1 && dist.bitStats.max === 4);

// ─── 5. Algorithm Outcome Summaries Tests ──────────────────────────────────────

console.log('\n--- 5. Algorithm Outcomes Tests ---');

const algos = getHistoricalAlgorithmOutcomes();
const crc32Algo = algos.find(a => a.algorithm === 'CRC-32');
const crc8Algo = algos.find(a => a.algorithm === 'CRC-8');

assert('CRC-32 has 2 injections with 100% detection rate', crc32Algo && crc32Algo.injections === 2 && crc32Algo.empiricalDetectionRate === 100.0);
assert('CRC-8 has 1 injection with 0% detection rate', crc8Algo && crc8Algo.injections === 1 && crc8Algo.empiricalDetectionRate === 0.0);

// ─── 6. Date Range Filtering Tests ─────────────────────────────────────────────

console.log('\n--- 6. Date Range Filter Tests ---');

const recentStart = new Date(now - 20000).toISOString();
const filteredOverview = getHistoricalOverview({ startDate: recentStart });
assert('Date-range filter restricts events to recent window', filteredOverview.totalEvents === 2);
assert('Filtered overview indicates isFiltered: true', filteredOverview.queryRange.isFiltered === true);

// ─── 7. CSV Export Capabilities Tests ──────────────────────────────────────────

console.log('\n--- 7. CSV Export Tests ---');

// Create test alerts for alert export
createAlert({
  alertType: 'TEST_ALERT',
  severity: 'WARNING',
  title: 'Export Test Alert',
  description: 'Testing CSV export.',
  sourceModule: 'Test'
});

const alertCsv = exportHistoricalCsv({ type: 'alerts' });
assert('Alert CSV contains header row with Alert ID and Severity', alertCsv.includes('Alert ID') && alertCsv.includes('Severity'));
assert('Alert CSV contains exported alert data', alertCsv.includes('Export Test Alert'));

const telemetryCsv = exportHistoricalCsv({ type: 'telemetry' });
assert('Telemetry CSV contains header row with Event ID and Algorithm', telemetryCsv.includes('Event ID') && telemetryCsv.includes('Algorithm'));
assert('Telemetry CSV contains recorded transmission TXN-H1', telemetryCsv.includes('TXN-H1'));

const summaryCsv = exportHistoricalCsv({ type: 'summary' });
assert('Summary CSV contains Metric Category header', summaryCsv.includes('Metric Category'));
assert('Summary CSV contains Transmissions metric rows', summaryCsv.includes('Transmissions') && summaryCsv.includes('Error Injections'));

// Reset slate after tests
clearTelemetry();
clearAlertHistory();

// ─── Test Summary ───────────────────────────────────────────────────────────

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================');

if (totalTests === passedTests) {
  console.log('🎉 ALL MODULE 8 HISTORICAL ANALYTICS TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('💥 SOME TESTS FAILED!\n');
  process.exit(1);
}

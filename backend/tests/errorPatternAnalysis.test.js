/**
 * Error Pattern Analysis Tests — Module 6
 *
 * Tests the full Module 6 statistical pattern engine and service layer.
 * Covers:
 *  - Insufficient data handling (0, 1, 2 injection events)
 *  - Complete analysis with adequate events
 *  - Dominant pattern classifications (Single-bit, Burst, Multi-bit, Random, Mixed)
 *  - Error type distributions and bit-change statistics
 *  - Burst statistics and algorithm detection rate breakdown
 *  - Time trend bucketing
 *  - Insight generation with supporting evidence
 *  - Service history tracking, bounded storage, and ID formatting
 *  - Service aggregate statistics
 *  - System health integration (aiErrorPatternAnalysis: active)
 */

import {
  analyzeErrorPatterns,
  MIN_INJECTION_EVENTS,
  KNOWN_ERROR_TYPES,
  KNOWN_ALGORITHMS
} from '../../ml-pipeline/error_pattern_analysis.js';
import {
  analyzePatterns,
  getPatternHistory,
  getPatternStats,
  clearPatternHistory
} from '../services/errorPatternAnalysis.service.js';
import {
  recordTransmissionEvent,
  recordInjectionEvent,
  clearTelemetry
} from '../services/telemetry.service.js';
import { getSystemHealthStatus } from '../services/health.service.js';

console.log('====================================================');
console.log('   RUNNING MODULE 6 ERROR PATTERN ANALYSIS TESTS    ');
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

// ─── Mock Event Factory ───────────────────────────────────────────────────────

const makeInjectionEvent = (id, opts = {}) => ({
  eventId:         `TEL-INJ-${String(id).padStart(5, '0')}`,
  eventType:       'ERROR_INJECTION',
  sourceId:        `INJ-${id}`,
  timestamp:       opts.timestamp || new Date(Date.now() - (100 - id) * 1000).toISOString(),
  payloadSize:     opts.payloadSize ?? 10,
  algorithm:       opts.algorithm ?? 'CRC-32',
  status:          'ERROR_INJECTED',
  crcMatch:        opts.crcMatch ?? false,
  errorDetected:   opts.errorDetected !== undefined ? opts.errorDetected : true,
  errorType:       opts.errorType || 'SINGLE_BIT',
  changedBitCount: opts.changedBitCount !== undefined ? opts.changedBitCount : 1,
  burstLength:     opts.burstLength !== undefined ? opts.burstLength : null
});

const makeTxEvent = (id, opts = {}) => ({
  eventId:         `TEL-TXN-${String(id).padStart(5, '0')}`,
  eventType:       'TRANSMISSION',
  sourceId:        `TXN-${id}`,
  timestamp:       opts.timestamp || new Date(Date.now() - (100 - id) * 1000).toISOString(),
  payloadSize:     opts.payloadSize ?? 10,
  algorithm:       opts.algorithm ?? 'CRC-32',
  status:          'VERIFIED',
  crcMatch:        true,
  errorDetected:   false,
  errorType:       null,
  changedBitCount: null,
  burstLength:     null
});

// Clean test slate
clearTelemetry();
clearPatternHistory();

// ─── 1. Insufficient Data Handling ───────────────────────────────────────────

console.log('\n--- 1. Insufficient Data Tests ---');

const emptyResult = analyzeErrorPatterns([]);
assert('Empty events array returns INSUFFICIENT DATA status', emptyResult.status === 'INSUFFICIENT DATA');
assert('Empty events report 0 injections', emptyResult.injectionCount === 0);
assert('Empty events include instructional guidance message', typeof emptyResult.message === 'string' && emptyResult.message.includes('Module 3'));

const oneEventResult = analyzeErrorPatterns([makeInjectionEvent(1)]);
assert('Single injection event returns INSUFFICIENT DATA status', oneEventResult.status === 'INSUFFICIENT DATA');
assert('Single event reports injectionCount = 1', oneEventResult.injectionCount === 1);

const twoEventResult = analyzeErrorPatterns([makeInjectionEvent(1), makeInjectionEvent(2)]);
assert('Two injection events return INSUFFICIENT DATA status', twoEventResult.status === 'INSUFFICIENT DATA');

// ─── 2. Complete Analysis & Error Type Distribution ─────────────────────────

console.log('\n--- 2. Complete Analysis & Distribution Tests ---');

const mockEvents = [
  makeInjectionEvent(1, { errorType: 'SINGLE_BIT', changedBitCount: 1, algorithm: 'CRC-32', errorDetected: true }),
  makeInjectionEvent(2, { errorType: 'SINGLE_BIT', changedBitCount: 1, algorithm: 'CRC-32', errorDetected: true }),
  makeInjectionEvent(3, { errorType: 'BURST', changedBitCount: 4, burstLength: 4, algorithm: 'CRC-16', errorDetected: true }),
  makeInjectionEvent(4, { errorType: 'MULTI_BIT', changedBitCount: 2, algorithm: 'CRC-8', errorDetected: false }),
  makeTxEvent(5)
];

const completeResult = analyzeErrorPatterns(mockEvents);
assert('Sufficient events return COMPLETE status', completeResult.status === 'COMPLETE');
assert('Correct injection count counted', completeResult.injectionCount === 4);
assert('Correct transmission count counted', completeResult.transmissionCount === 1);
assert('Total events match input length', completeResult.totalEvents === 5);
assert('Detected count is 3', completeResult.detectedCount === 3);
assert('Not detected count is 1', completeResult.notDetectedCount === 1);
assert('Overall detection rate is 75.0%', completeResult.overallDetectionRate === 75.0);

// Check all KNOWN_ERROR_TYPES are in distribution
const distTypes = completeResult.errorTypeDistribution.map(d => d.errorType);
const hasAllKnown = KNOWN_ERROR_TYPES.every(t => distTypes.includes(t));
assert('Distribution contains all canonical KNOWN_ERROR_TYPES', hasAllKnown);

const singleBitDist = completeResult.errorTypeDistribution.find(d => d.errorType === 'SINGLE_BIT');
assert('SINGLE_BIT count is 2 (50.0%)', singleBitDist && singleBitDist.count === 2 && singleBitDist.pct === 50.0);

// ─── 3. Dominant Pattern Classification ─────────────────────────────────────

console.log('\n--- 3. Dominant Pattern Classification Tests ---');

// Burst dominant (> 50%)
const burstEvents = [
  makeInjectionEvent(1, { errorType: 'BURST', changedBitCount: 3, burstLength: 3 }),
  makeInjectionEvent(2, { errorType: 'BURST', changedBitCount: 4, burstLength: 4 }),
  makeInjectionEvent(3, { errorType: 'SINGLE_BIT', changedBitCount: 1 })
];
const burstRes = analyzeErrorPatterns(burstEvents);
assert('Burst dominant classification correctly identified', burstRes.dominantPattern.classification === 'BURST DOMINANT');
assert('Burst confidence is 66.7%', burstRes.dominantPattern.confidence === 66.7);

// Mixed patterns (none > 50%)
const mixedEvents = [
  makeInjectionEvent(1, { errorType: 'SINGLE_BIT', changedBitCount: 1 }),
  makeInjectionEvent(2, { errorType: 'MULTI_BIT', changedBitCount: 2 }),
  makeInjectionEvent(3, { errorType: 'BURST', changedBitCount: 4, burstLength: 4 }),
  makeInjectionEvent(4, { errorType: 'RANDOM', changedBitCount: 3 })
];
const mixedRes = analyzeErrorPatterns(mixedEvents);
assert('Mixed patterns classification correctly identified', mixedRes.dominantPattern.classification === 'MIXED PATTERNS');

// Single-bit dominant (> 50%)
const singleEvents = [
  makeInjectionEvent(1, { errorType: 'SINGLE_BIT', changedBitCount: 1 }),
  makeInjectionEvent(2, { errorType: 'SINGLE_BIT', changedBitCount: 1 }),
  makeInjectionEvent(3, { errorType: 'RANDOM', changedBitCount: 2 })
];
const singleRes = analyzeErrorPatterns(singleEvents);
assert('Single-bit dominant classification correctly identified', singleRes.dominantPattern.classification === 'SINGLE-BIT DOMINANT');

// ─── 4. Bit-Change & Burst Statistics ───────────────────────────────────────

console.log('\n--- 4. Bit-Change & Burst Statistics Tests ---');

const statEvents = [
  makeInjectionEvent(1, { errorType: 'SINGLE_BIT', changedBitCount: 1 }),
  makeInjectionEvent(2, { errorType: 'MULTI_BIT', changedBitCount: 3 }),
  makeInjectionEvent(3, { errorType: 'BURST', changedBitCount: 5, burstLength: 6 })
];
const statsRes = analyzeErrorPatterns(statEvents);
assert('Bit-change stats available', statsRes.bitChangeStats.available === true);
assert('Bit-change mean calculated correctly (3.00)', statsRes.bitChangeStats.mean === 3.00);
assert('Bit-change min and max correct (1, 5)', statsRes.bitChangeStats.min === 1 && statsRes.bitChangeStats.max === 5);
assert('Burst stats available', statsRes.burstStats.available === true);
assert('Burst length is 6', statsRes.burstStats.mean === 6.00 && statsRes.burstStats.max === 6);

// ─── 5. Algorithm Breakdown ─────────────────────────────────────────────────

console.log('\n--- 5. Algorithm Breakdown Tests ---');

const algoEvents = [
  makeInjectionEvent(1, { algorithm: 'CRC-32', errorDetected: true }),
  makeInjectionEvent(2, { algorithm: 'CRC-32', errorDetected: true }),
  makeInjectionEvent(3, { algorithm: 'CRC-8', errorDetected: false })
];
const algoRes = analyzeErrorPatterns(algoEvents);
const crc32Breakdown = algoRes.algorithmBreakdown.find(a => a.algorithm === 'CRC-32');
const crc8Breakdown = algoRes.algorithmBreakdown.find(a => a.algorithm === 'CRC-8');
assert('CRC-32 total is 2 with 100% detectionRate', crc32Breakdown && crc32Breakdown.total === 2 && crc32Breakdown.detectionRate === 100);
assert('CRC-8 total is 1 with 0% detectionRate', crc8Breakdown && crc8Breakdown.total === 1 && crc8Breakdown.detectionRate === 0);

// ─── 6. Time Trend Bucketing ────────────────────────────────────────────────

console.log('\n--- 6. Time Trend Tests ---');

const now = Date.now();
const timedEvents = [
  makeInjectionEvent(1, { timestamp: new Date(now - 60000).toISOString() }),
  makeInjectionEvent(2, { timestamp: new Date(now - 40000).toISOString() }),
  makeInjectionEvent(3, { timestamp: new Date(now - 10000).toISOString() })
];
const timedRes = analyzeErrorPatterns(timedEvents);
assert('Time trend generates 6 buckets', Array.isArray(timedRes.timeTrend) && timedRes.timeTrend.length === 6);
const totalTrendCount = timedRes.timeTrend.reduce((acc, b) => acc + b.count, 0);
assert('Time trend total event count equals input count (3)', totalTrendCount === 3);

// ─── 7. Insight Generation ──────────────────────────────────────────────────

console.log('\n--- 7. Insight Generation Tests ---');

assert('Insights array is populated', Array.isArray(statsRes.insights) && statsRes.insights.length > 0);
assert('Insights contain evidence numbers', statsRes.insights.some(i => /\d+/.test(i)));

// ─── 8. Service Layer Integration ───────────────────────────────────────────

console.log('\n--- 8. Service Layer Integration Tests ---');

clearTelemetry();
clearPatternHistory();

// Record telemetry in service
recordInjectionEvent({
  sourceId: 'INJ-SRV-1',
  algorithm: 'CRC-32',
  status: 'ERROR_INJECTED',
  crcMatch: false,
  errorDetected: true,
  errorType: 'SINGLE_BIT',
  changedBitCount: 1,
  burstLength: null
});
recordInjectionEvent({
  sourceId: 'INJ-SRV-2',
  algorithm: 'CRC-32',
  status: 'ERROR_INJECTED',
  crcMatch: false,
  errorDetected: true,
  errorType: 'SINGLE_BIT',
  changedBitCount: 1,
  burstLength: null
});
recordInjectionEvent({
  sourceId: 'INJ-SRV-3',
  algorithm: 'CRC-16',
  status: 'ERROR_INJECTED',
  crcMatch: false,
  errorDetected: true,
  errorType: 'BURST',
  changedBitCount: 4,
  burstLength: 4
});
recordTransmissionEvent({
  sourceId: 'TXN-SRV-1',
  algorithm: 'CRC-32',
  status: 'VERIFIED',
  crcMatch: true,
  errorDetected: false
});

const serviceAnalysis = analyzePatterns();
assert('Service generates an analysisId matching pattern EPA-YYYYMMDD-XXXX', /^EPA-\d{8}-\d{4}$/.test(serviceAnalysis.analysisId));
assert('Service analysis has COMPLETE status', serviceAnalysis.status === 'COMPLETE');
assert('Service analysis recorded 3 injections', serviceAnalysis.injectionCount === 3);

const history = getPatternHistory(10);
assert('History contains 1 record', history.length === 1);
assert('History item contains analysisId', history[0].analysisId === serviceAnalysis.analysisId);

const patternStats = getPatternStats();
assert('Pattern stats totalAnalyses is 1', patternStats.totalAnalyses === 1);
assert('Pattern stats completeCount is 1', patternStats.completeCount === 1);
assert('Pattern stats dominant pattern matches', patternStats.latestDominantPattern === 'SINGLE-BIT DOMINANT');

// Test history clearing
clearPatternHistory();
assert('clearPatternHistory resets history length to 0', getPatternHistory().length === 0);

// ─── 9. Health Service Integration ──────────────────────────────────────────

console.log('\n--- 9. Health Service Verification ---');

const health = getSystemHealthStatus();
assert('System health reports aiErrorPatternAnalysis as active', health.modules.aiErrorPatternAnalysis === 'active');

// ─── Test Summary ───────────────────────────────────────────────────────────

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================');

if (totalTests === passedTests) {
  console.log('🎉 ALL MODULE 6 TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('💥 SOME TESTS FAILED!\n');
  process.exit(1);
}

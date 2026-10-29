/**
 * Real-Time Monitoring Dashboard Tests — Module 7
 *
 * Tests the Module 7 aggregation service and controller endpoints:
 *  - Overview metrics with valid and empty telemetry
 *  - Unified chronological activity feed merging telemetry & AI events
 *  - Activity pagination and limit validation
 *  - Activity filtering by eventType and algorithm
 *  - Timeline time-bucketing with normal, single-event, and empty inputs
 *  - Handling of missing and malformed timestamps
 *  - System health reporting with monitoringDashboard: active
 *  - Module differentiation (transmissions vs error injections vs AI anomalies)
 */

import {
  getMonitoringOverview,
  getRecentActivity,
  getMonitoringTimeline
} from '../services/monitoring.service.js';
import {
  recordTransmissionEvent,
  recordInjectionEvent,
  clearTelemetry
} from '../services/telemetry.service.js';
import { getSystemHealthStatus } from '../services/health.service.js';

console.log('====================================================');
console.log('   RUNNING MODULE 7 REAL-TIME MONITORING TESTS      ');
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

const makeTxEvent = (id, opts = {}) => ({
  eventId:         `TEL-TXN-${String(id).padStart(5, '0')}`,
  eventType:       'TRANSMISSION',
  sourceId:        `TXN-20261001-${String(id).padStart(4, '0')}`,
  timestamp:       opts.timestamp || new Date(Date.now() - (100 - id) * 1000).toISOString(),
  payloadSize:     opts.payloadSize ?? 16,
  algorithm:       opts.algorithm ?? 'CRC-32',
  status:          opts.status ?? 'SUCCESS',
  crcMatch:        opts.crcMatch !== undefined ? opts.crcMatch : true,
  errorDetected:   opts.errorDetected !== undefined ? opts.errorDetected : false,
  errorType:       null,
  changedBitCount: null,
  burstLength:     null
});

const makeInjectionEvent = (id, opts = {}) => ({
  eventId:         `TEL-INJ-${String(id).padStart(5, '0')}`,
  eventType:       'ERROR_INJECTION',
  sourceId:        `INJ-20261001-${String(id).padStart(4, '0')}`,
  timestamp:       opts.timestamp || new Date(Date.now() - (100 - id) * 1000).toISOString(),
  payloadSize:     opts.payloadSize ?? 16,
  algorithm:       opts.algorithm ?? 'CRC-32',
  status:          opts.status ?? 'ERROR DETECTED',
  crcMatch:        opts.crcMatch !== undefined ? opts.crcMatch : false,
  errorDetected:   opts.errorDetected !== undefined ? opts.errorDetected : true,
  errorType:       opts.errorType || 'SINGLE_BIT',
  changedBitCount: opts.changedBitCount !== undefined ? opts.changedBitCount : 1,
  burstLength:     opts.burstLength !== undefined ? opts.burstLength : null
});

// Clean test slate
clearTelemetry();

// ─── 1. Empty Telemetry Overview ───────────────────────────────────────────────

console.log('\n--- 1. Empty State Overview Tests ---');

const emptyOverview = getMonitoringOverview();
assert('Overview returns valid timestamp', typeof emptyOverview.timestamp === 'string');
assert('Transmissions section exists with total 0 or non-negative', emptyOverview.transmissions.total >= 0);
assert('Empty telemetry produces 0 total events', emptyOverview.telemetry.totalEvents === 0);
assert('System health reports OK status', emptyOverview.systemHealth.status === 'OK');
assert('System health reports monitoringDashboard as active', emptyOverview.systemHealth.modules.monitoringDashboard === 'active');

// ─── 2. Overview With Populated Telemetry ───────────────────────────────────────

console.log('\n--- 2. Populated Telemetry Overview Tests ---');

recordTransmissionEvent({
  transmissionId: 'TXN-M7-001',
  timestamp: new Date(Date.now() - 50000).toISOString(),
  payloadSize: 12,
  algorithm: 'CRC-32',
  status: 'SUCCESS',
  match: true,
  errorDetected: false
});

recordTransmissionEvent({
  transmissionId: 'TXN-M7-002',
  timestamp: new Date(Date.now() - 40000).toISOString(),
  payloadSize: 12,
  algorithm: 'CRC-16',
  status: 'SUCCESS',
  match: true,
  errorDetected: false
});

recordInjectionEvent({
  injectionId: 'INJ-M7-001',
  timestamp: new Date(Date.now() - 30000).toISOString(),
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
  injectionId: 'INJ-M7-002',
  timestamp: new Date(Date.now() - 20000).toISOString(),
  totalBits: 64,
  algorithm: 'CRC-8',
  status: 'ERROR DETECTED',
  match: false,
  errorDetected: true,
  errorType: 'BURST',
  changedBitCount: 4,
  burstDetails: { burstLength: 4 }
});

const populatedOverview = getMonitoringOverview();
assert('Telemetry records 4 total events', populatedOverview.telemetry.totalEvents === 4);
assert('Telemetry records 2 transmission events', populatedOverview.telemetry.transmissionEvents === 2);
assert('Telemetry records 2 injection events', populatedOverview.telemetry.injectionEvents === 2);
assert('Error injection detection rate is calculated', typeof populatedOverview.errorInjections.detectionRate === 'string');
assert('Error injections detection rate numeric is 100.0 or valid number', populatedOverview.errorInjections.detectionRateNumeric === 100.0);
assert('AI Intelligence section contains anomaly & pattern fields', typeof populatedOverview.aiIntelligence.anomaliesDetected === 'number');

// ─── 3. Unified Activity Feed Tests ───────────────────────────────────────────

console.log('\n--- 3. Unified Activity Feed Tests ---');

const activityRes = getRecentActivity({ limit: 10 });
assert('Activity returns activities array', Array.isArray(activityRes.activities));
assert('Activity count is 4', activityRes.count === 4);
assert('Total available matches count', activityRes.totalAvailable === 4);

// Test reverse-chronological ordering
const timestamps = activityRes.activities.map(a => Date.parse(a.timestamp));
let isReverseSorted = true;
for (let i = 0; i < timestamps.length - 1; i++) {
  if (timestamps[i] < timestamps[i + 1]) {
    isReverseSorted = false;
    break;
  }
}
assert('Activity feed is sorted in reverse-chronological order (newest first)', isReverseSorted);

// Test activity item format
const firstItem = activityRes.activities[0];
assert('Activity item has activityId', typeof firstItem.activityId === 'string' && firstItem.activityId.length > 0);
assert('Activity item has eventType', typeof firstItem.eventType === 'string');
assert('Activity item has algorithm', typeof firstItem.algorithm === 'string');
assert('Activity item has human-readable details', typeof firstItem.details === 'string');

// ─── 4. Activity Filtering Tests ───────────────────────────────────────────────

console.log('\n--- 4. Activity Filtering Tests ---');

const txOnly = getRecentActivity({ eventType: 'TRANSMISSION' });
assert('Filtering by TRANSMISSION returns only transmissions', txOnly.activities.every(a => a.eventType === 'TRANSMISSION'));
assert('Transmission filter count is 2', txOnly.count === 2);

const injOnly = getRecentActivity({ eventType: 'ERROR_INJECTION' });
assert('Filtering by ERROR_INJECTION returns only injections', injOnly.activities.every(a => a.eventType === 'ERROR_INJECTION'));
assert('Error injection filter count is 2', injOnly.count === 2);

const crc32Only = getRecentActivity({ algorithm: 'CRC-32' });
assert('Filtering by CRC-32 algorithm returns only CRC-32 events', crc32Only.activities.every(a => a.algorithm === 'CRC-32'));
assert('CRC-32 count matches recorded events (2)', crc32Only.count === 2);

const limitTest = getRecentActivity({ limit: 1 });
assert('Limit 1 restricts returned activities to 1', limitTest.activities.length === 1 && limitTest.count === 1);
assert('Limit test preserves totalAvailable count of 4', limitTest.totalAvailable === 4);

// ─── 5. Timeline Aggregation Tests ─────────────────────────────────────────────

console.log('\n--- 5. Timeline Aggregation Tests ---');

const timeline = getMonitoringTimeline(4);
assert('Timeline returns requested 4 buckets', Array.isArray(timeline) && timeline.length === 4);

const totalTimelineEvents = timeline.reduce((acc, b) => acc + b.totalEvents, 0);
assert('Timeline event count sum equals total events (4)', totalTimelineEvents === 4);

const txTimelineCount = timeline.reduce((acc, b) => acc + b.transmissions, 0);
assert('Timeline transmission count equals 2', txTimelineCount === 2);

const injTimelineCount = timeline.reduce((acc, b) => acc + b.injections, 0);
assert('Timeline injection count equals 2', injTimelineCount === 2);

// Test timeline bucket label format
assert('Timeline bucket has label (e.g., T1)', timeline[0].label === 'T1');
assert('Timeline bucket has formatted timeRange', typeof timeline[0].timeRange === 'string');

// ─── 6. Edge Case Handling Tests ───────────────────────────────────────────────

console.log('\n--- 6. Edge Case Handling Tests ---');

// Clear telemetry for empty timeline test
clearTelemetry();
const emptyTimeline = getMonitoringTimeline(5);
assert('Empty telemetry produces empty timeline array', Array.isArray(emptyTimeline) && emptyTimeline.length === 0);

// Single event timeline
recordTransmissionEvent({
  transmissionId: 'TXN-SINGLE',
  timestamp: new Date().toISOString(),
  payloadSize: 10,
  algorithm: 'CRC-16',
  status: 'SUCCESS',
  match: true,
  errorDetected: false
});

const singleTimeline = getMonitoringTimeline(4);
assert('Single event timeline produces exactly 1 window without division by zero', singleTimeline.length === 1);
assert('Single event timeline contains 1 event', singleTimeline[0].totalEvents === 1);

// Test malformed timestamps are filtered safely
clearTelemetry();
recordTransmissionEvent({
  transmissionId: 'TXN-NO-TIME',
  timestamp: 'INVALID-DATE-STRING',
  payloadSize: 10,
  algorithm: 'CRC-32',
  status: 'SUCCESS',
  match: true,
  errorDetected: false
});

const invalidTimeTimeline = getMonitoringTimeline(4);
assert('Malformed timestamp events are safely omitted from timeline', invalidTimeTimeline.length === 0);

// ─── 7. System Health Status Verification ──────────────────────────────────────

console.log('\n--- 7. Health Endpoint Verification ---');

const health = getSystemHealthStatus();
assert('System health includes monitoringDashboard', 'monitoringDashboard' in health.modules);
assert('monitoringDashboard status is "active"', health.modules.monitoringDashboard === 'active');
assert('Modules 1-6 remain "active"',
  health.modules.crcGenerator === 'active' &&
  health.modules.transmissionSimulator === 'active' &&
  health.modules.errorInjector === 'active' &&
  health.modules.algorithmComparison === 'active' &&
  health.modules.aiAnomalyDetection === 'active' &&
  health.modules.aiErrorPatternAnalysis === 'active'
);

// Reset telemetry after tests
clearTelemetry();

// ─── Test Summary ───────────────────────────────────────────────────────────

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================');

if (totalTests === passedTests) {
  console.log('🎉 ALL MODULE 7 MONITORING TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('💥 SOME TESTS FAILED!\n');
  process.exit(1);
}

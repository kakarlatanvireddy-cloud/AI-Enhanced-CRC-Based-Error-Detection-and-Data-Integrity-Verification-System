/**
 * Alert Management Tests — Module 8
 *
 * Tests alert generation, severity classification, deduplication,
 * filtering, acknowledgement, and statistical aggregations.
 */

import {
  createAlert,
  getAlerts,
  getAlertById,
  acknowledgeAlert,
  getAlertStats,
  clearAlertHistory,
  syncAlertsFromSubsystems
} from '../services/alert.service.js';
import {
  recordTransmissionEvent,
  recordInjectionEvent,
  clearTelemetry
} from '../services/telemetry.service.js';
import { getSystemHealthStatus } from '../services/health.service.js';

console.log('====================================================');
console.log('   RUNNING MODULE 8 ALERT MANAGEMENT TESTS          ');
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

// ─── 1. Empty State Tests ───────────────────────────────────────────────────────

console.log('\n--- 1. Empty State Alert Tests ---');

const emptyAlerts = getAlerts();
assert('Empty store returns alerts array of length 0', emptyAlerts.alerts.length === 0 && emptyAlerts.count === 0);
assert('Total available alerts is 0', emptyAlerts.totalAvailable === 0);

const emptyStats = getAlertStats();
assert('Empty stats reports totalAlerts: 0', emptyStats.totalAlerts === 0);
assert('Empty stats reports unacknowledged: 0', emptyStats.unacknowledged === 0);
assert('Empty stats reports acknowledged: 0', emptyStats.acknowledged === 0);

// ─── 2. Manual Alert Creation & Severity Tests ──────────────────────────────────

console.log('\n--- 2. Alert Creation & Severity Tests ---');

const infoAlert = createAlert({
  alertType: 'SYSTEM_BOOT',
  severity: 'INFO',
  title: 'System Initialized',
  description: 'Data integrity system booted.',
  sourceModule: 'Core',
  relatedId: 'BOOT-01'
});
assert('Creates INFO alert with unique ID matching ALT-YYYYMMDD-XXXX', /^ALT-\d{8}-\d{4}$/.test(infoAlert.alertId));
assert('Alert severity is normalized to INFO', infoAlert.severity === 'INFO');
assert('Alert starts unacknowledged', infoAlert.acknowledged === false && infoAlert.acknowledgedAt === null);

const warnAlert = createAlert({
  alertType: 'CORRUPTED_FRAME_CAUGHT',
  severity: 'WARNING',
  title: 'Corrupted Frame Caught',
  description: 'Single-bit error intercepted by CRC-32.',
  sourceModule: 'Module 3',
  relatedId: 'INJ-TEST-01'
});
assert('Creates WARNING alert', warnAlert && warnAlert.severity === 'WARNING');

const critAlert = createAlert({
  alertType: 'CRC_BYPASS_UNDETECTED',
  severity: 'CRITICAL',
  title: 'Undetected Corruption Breach',
  description: 'Payload corrupted but receiver CRC matched.',
  sourceModule: 'Module 3',
  relatedId: 'INJ-TEST-02'
});
assert('Creates CRITICAL alert', critAlert && critAlert.severity === 'CRITICAL');

// ─── 3. Deduplication Tests ────────────────────────────────────────────────────

console.log('\n--- 3. Deduplication Tests ---');

const duplicateAttempt = createAlert({
  alertType: 'CRC_BYPASS_UNDETECTED',
  severity: 'CRITICAL',
  title: 'Undetected Corruption Breach',
  description: 'Repeated poll of the same event.',
  sourceModule: 'Module 3',
  relatedId: 'INJ-TEST-02'
});
assert('Duplicate alert creation with same relatedId & alertType returns null', duplicateAttempt === null);

// ─── 4. Subsystem Sync & Telemetry Alert Generation ────────────────────────────

console.log('\n--- 4. Subsystem Sync Tests ---');

// Record a simulated undetected injection in telemetry
recordInjectionEvent({
  injectionId: 'INJ-SYNC-01',
  timestamp: new Date().toISOString(),
  totalBits: 64,
  algorithm: 'CRC-32',
  status: 'CRC MATCH (UNDETECTED)',
  match: true,
  errorDetected: false,
  errorType: 'MULTI_BIT',
  changedBitCount: 2,
  burstDetails: null
});

// Record a detected injection in telemetry
recordInjectionEvent({
  injectionId: 'INJ-SYNC-02',
  timestamp: new Date().toISOString(),
  totalBits: 64,
  algorithm: 'CRC-16',
  status: 'ERROR DETECTED',
  match: false,
  errorDetected: true,
  errorType: 'SINGLE_BIT',
  changedBitCount: 1,
  burstDetails: null
});

// Sync subsystem alerts
syncAlertsFromSubsystems();

const syncedAlerts = getAlerts();
const undetectedAlert = syncedAlerts.alerts.find(a => a.relatedId === 'INJ-SYNC-01');
assert('Telemetry undetected error automatically creates CRITICAL alert', undetectedAlert && undetectedAlert.severity === 'CRITICAL');

const detectedAlert = syncedAlerts.alerts.find(a => a.relatedId === 'INJ-SYNC-02');
assert('Telemetry detected error creates WARNING alert', detectedAlert && detectedAlert.severity === 'WARNING');

// Repeated sync should not produce duplicates
syncAlertsFromSubsystems();
const countAfterSecondSync = getAlerts().totalAvailable;
assert('Repeated subsystem sync does not duplicate alert count', countAfterSecondSync === syncedAlerts.totalAvailable);

// ─── 5. Filtering Tests ────────────────────────────────────────────────────────

console.log('\n--- 5. Alert Filtering Tests ---');

const critOnly = getAlerts({ severity: 'CRITICAL' });
assert('Filtering by CRITICAL returns only CRITICAL alerts', critOnly.alerts.every(a => a.severity === 'CRITICAL'));
assert('CRITICAL filter count is positive', critOnly.count >= 2);

const warnOnly = getAlerts({ severity: 'WARNING' });
assert('Filtering by WARNING returns only WARNING alerts', warnOnly.alerts.every(a => a.severity === 'WARNING'));

const limitTwo = getAlerts({ limit: 2 });
assert('Limit 2 caps returned alerts to 2', limitTwo.alerts.length === 2 && limitTwo.count === 2);

// ─── 6. Acknowledgement Tests ──────────────────────────────────────────────────

console.log('\n--- 6. Acknowledgement Tests ---');

const targetAlert = critOnly.alerts[0];
const ackResult = acknowledgeAlert(targetAlert.alertId);
assert('Acknowledge alert returns updated record with acknowledged: true', ackResult && ackResult.acknowledged === true);
assert('Acknowledge alert sets ISO acknowledgedAt timestamp', typeof ackResult.acknowledgedAt === 'string' && ackResult.acknowledgedAt.includes('T'));

// Query by acknowledgement status
const unacked = getAlerts({ acknowledged: false });
const acked = getAlerts({ acknowledged: true });
assert('Unacknowledged filter does not contain the acknowledged alert', !unacked.alerts.some(a => a.alertId === targetAlert.alertId));
assert('Acknowledged filter contains the acknowledged alert', acked.alerts.some(a => a.alertId === targetAlert.alertId));

// Invalid alert ID test
const invalidAck = acknowledgeAlert('ALT-INVALID-9999');
assert('Acknowledging invalid ID returns null', invalidAck === null);

const invalidLookup = getAlertById('ALT-INVALID-9999');
assert('Looking up invalid ID returns null', invalidLookup === null);

// ─── 7. Alert Stats Aggregation ────────────────────────────────────────────────

console.log('\n--- 7. Alert Stats Verification ---');

const stats = getAlertStats();
assert('Stats has totalAlerts matching totalAvailable', stats.totalAlerts === countAfterSecondSync);
assert('Stats reports acknowledged count >= 1', stats.acknowledged >= 1);
assert('Stats unacknowledged + acknowledged equals total', stats.unacknowledged + stats.acknowledged === stats.totalAlerts);
assert('Stats has bySeverity object with critical, high, warning, info',
  typeof stats.bySeverity.critical === 'number' &&
  typeof stats.bySeverity.high === 'number' &&
  typeof stats.bySeverity.warning === 'number' &&
  typeof stats.bySeverity.info === 'number'
);

// ─── 8. Health Status Integration ──────────────────────────────────────────────

console.log('\n--- 8. Health Endpoint Verification ---');

const health = getSystemHealthStatus();
assert('System health reports analytics as active', health.modules.analytics === 'active');

// Reset slate after tests
clearTelemetry();
clearAlertHistory();

// ─── Test Summary ───────────────────────────────────────────────────────────

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================');

if (totalTests === passedTests) {
  console.log('🎉 ALL MODULE 8 ALERT TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('💥 SOME TESTS FAILED!\n');
  process.exit(1);
}

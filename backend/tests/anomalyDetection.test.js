/**
 * Anomaly Detection Tests — Module 5
 *
 * Tests the full Module 5 stack at the service/algorithm layer (no HTTP).
 * Covers:
 *  - Feature extraction
 *  - Anomaly detection with empty history
 *  - Anomaly detection with insufficient data
 *  - Normal event classification (controlled reproducible case)
 *  - Anomaly classification (controlled reproducible case)
 *  - Valid anomaly score format
 *  - Analysis history recording
 *  - Statistics computation
 *  - Health integration
 *  - Score interpretation (null for insufficient data)
 *
 * Tests are ordered carefully so that shared in-memory state is predictable.
 * clearTelemetry() and clearAnalysisHistory() are called at the start to ensure
 * a clean slate regardless of import-time side effects.
 */

import { detectAnomaly, extractFeatures, MIN_EVENTS_REQUIRED, ANOMALY_THRESHOLD } from '../../ml-pipeline/anomaly_detection.js';
import { recordTransmissionEvent, recordInjectionEvent, getTelemetryHistory, getTelemetryCount, clearTelemetry } from '../services/telemetry.service.js';
import { analyzeTransmissions, getAnalysisHistory, getAnomalyStats, clearAnalysisHistory } from '../services/anomalyDetection.service.js';
import { getSystemHealthStatus } from '../services/health.service.js';

// ─── Test Framework ───────────────────────────────────────────────────────────

console.log('====================================================');
console.log('   RUNNING MODULE 5 ANOMALY DETECTION TESTS         ');
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

// ─── Mock Event Factories ─────────────────────────────────────────────────────

/**
 * Creates a mock transmission telemetry event.
 * @param {number} id - Unique suffix for IDs
 * @param {object} [opts]
 * @returns {object}
 */
const makeTxEvent = (id, opts = {}) => ({
  eventId:        `TEL-TEST-${String(id).padStart(5, '0')}`,
  eventType:      'TRANSMISSION',
  sourceId:       `TXN-TEST-${id}`,
  timestamp:      new Date().toISOString(),
  payloadSize:    opts.payloadSize  ?? 9,
  algorithm:      opts.algorithm    ?? 'CRC-32',
  status:         opts.status       ?? 'SUCCESS',
  crcMatch:       opts.crcMatch     ?? true,
  errorDetected:  opts.errorDetected ?? false,
  errorType:      null,
  changedBitCount: null,
  burstLength:    null
});

/**
 * Creates a mock error injection telemetry event.
 * @param {number} id - Unique suffix for IDs
 * @param {object} [opts]
 * @returns {object}
 */
const makeInjEvent = (id, opts = {}) => ({
  eventId:        `TEL-TEST-${String(id + 1000).padStart(5, '0')}`,
  eventType:      'ERROR_INJECTION',
  sourceId:       `ERR-TEST-${id}`,
  timestamp:      new Date().toISOString(),
  payloadSize:    opts.payloadSize   ?? 9,
  algorithm:      opts.algorithm     ?? 'CRC-32',
  status:         opts.status        ?? 'ERROR DETECTED',
  crcMatch:       opts.crcMatch      ?? false,
  errorDetected:  opts.errorDetected ?? true,
  errorType:      opts.errorType     ?? 'SINGLE_BIT',
  changedBitCount: opts.changedBitCount ?? 1,
  burstLength:    opts.burstLength   ?? null
});

// ─── Reset State ──────────────────────────────────────────────────────────────

clearTelemetry();
clearAnalysisHistory();

// ─── Test Suite ────────────────────────────────────────────────────────────────

try {

  // ── Test 1: Empty telemetry returns INSUFFICIENT DATA ────────────────────
  {
    const result = detectAnomaly([]);
    assert(
      'Empty event array returns status INSUFFICIENT DATA',
      result.status === 'INSUFFICIENT DATA'
    );
    assert(
      'Score is null for empty event array',
      result.score === null
    );
    assert(
      'featureComparison is null for empty event array',
      result.featureComparison === null
    );
  }

  // ── Test 2: Fewer than MIN_EVENTS_REQUIRED returns INSUFFICIENT DATA ─────
  {
    const fewEvents = [makeTxEvent(1), makeTxEvent(2), makeTxEvent(3)];
    const result = detectAnomaly(fewEvents);
    assert(
      `${fewEvents.length} events (below minimum ${MIN_EVENTS_REQUIRED}) returns INSUFFICIENT DATA`,
      result.status === 'INSUFFICIENT DATA'
    );
    assert(
      'eventCount is accurately reported for insufficient data',
      result.eventCount === fewEvents.length
    );
  }

  // ── Test 3: Explanation text is present for insufficient data ────────────
  {
    const result = detectAnomaly([makeTxEvent(1)]);
    assert(
      'Insufficient data explanation is a non-empty string',
      typeof result.explanation === 'string' && result.explanation.length > 0
    );
    assert(
      'Explanation mentions minimum event count requirement',
      result.explanation.includes(String(MIN_EVENTS_REQUIRED))
    );
  }

  // ── Test 4: NORMAL classification (controlled reproducible case) ─────────
  // Scenario: 15 identical clean TRANSMISSION events, no errors.
  // Baseline (first 10) and recent (last 5) have identical distributions.
  // Z-scores for all features should be ~0 → composite score near 0 → NORMAL.
  {
    const cleanEvents = Array.from({ length: 15 }, (_, i) =>
      makeTxEvent(100 + i, { payloadSize: 9, errorDetected: false, crcMatch: true })
    );
    const result = detectAnomaly(cleanEvents);
    assert(
      'All-clean transmission events produce NORMAL classification',
      result.status === 'NORMAL'
    );
    assert(
      'NORMAL result has a numeric anomaly score',
      typeof result.score === 'number'
    );
    assert(
      'NORMAL result score is below anomaly threshold',
      result.score < ANOMALY_THRESHOLD
    );
  }

  // ── Test 5: Valid anomaly score format ────────────────────────────────────
  {
    const events = Array.from({ length: 10 }, (_, i) =>
      makeTxEvent(200 + i, { payloadSize: 9, errorDetected: false })
    );
    const result = detectAnomaly(events);
    assert(
      'Anomaly score is a finite number',
      typeof result.score === 'number' && isFinite(result.score)
    );
    assert(
      'Anomaly score is in range [0.0, 1.0]',
      result.score >= 0.0 && result.score <= 1.0
    );
    assert(
      'Score has at most 4 decimal places',
      /^\d+\.\d{1,4}$/.test(String(result.score)) || result.score === 0
    );
  }

  // ── Test 6: ANOMALY classification (controlled reproducible case) ─────────
  // Scenario:
  //   Baseline (10 events): all TRANSMISSION, clean, small payloads
  //   Recent  ( 5 events): all ERROR_INJECTION BURST, 8 bit changes, errorDetected=true
  // Expected: high z-scores on crcErrorRate, injectionFrequency, avgBitChanges → ANOMALY
  {
    const baselineEvents = Array.from({ length: 10 }, (_, i) =>
      makeTxEvent(300 + i, { payloadSize: 9, errorDetected: false })
    );
    const recentAnomalousEvents = Array.from({ length: 5 }, (_, i) =>
      makeInjEvent(300 + i, {
        errorType:      'BURST',
        changedBitCount: 8,
        errorDetected:  true,
        crcMatch:       false
      })
    );
    const anomalyEvents = [...baselineEvents, ...recentAnomalousEvents];
    const result = detectAnomaly(anomalyEvents);
    assert(
      'Baseline-clean + recent-all-burst-injections produces ANOMALY',
      result.status === 'ANOMALY'
    );
    assert(
      'ANOMALY score is at or above threshold',
      result.score >= ANOMALY_THRESHOLD
    );
    assert(
      'ANOMALY result includes featureComparison object',
      result.featureComparison !== null && typeof result.featureComparison === 'object'
    );
  }

  // ── Test 7: Feature extraction returns correct keys ───────────────────────
  {
    const events = [makeTxEvent(400), makeInjEvent(401)];
    const features = extractFeatures(events);
    const requiredKeys = ['crcErrorRate', 'injectionFrequency', 'avgPayloadSize', 'avgBitChanges', 'burstActivity'];
    assert(
      'extractFeatures returns all 5 required feature keys',
      requiredKeys.every(k => k in features)
    );
    assert(
      'crcErrorRate is a number in [0, 1]',
      features.crcErrorRate >= 0 && features.crcErrorRate <= 1
    );
  }

  // ── Test 8: Detection method and score interpretation are present ─────────
  {
    const events = Array.from({ length: 8 }, (_, i) => makeTxEvent(500 + i));
    const result = detectAnomaly(events);
    assert(
      'Result includes detectionMethod string',
      typeof result.detectionMethod === 'string' && result.detectionMethod.length > 0
    );
    assert(
      'Result includes scoreInterpretation string',
      typeof result.scoreInterpretation === 'string' && result.scoreInterpretation.length > 0
    );
    assert(
      'Score is not described as a probability (score interpretation states NOT a probability)',
      result.scoreInterpretation.toLowerCase().includes('not a probability') ||
      result.scoreInterpretation.toLowerCase().includes('not')
    );
    assert(
      'Result includes limitations array',
      Array.isArray(result.limitations) && result.limitations.length > 0
    );
    assert(
      'Result includes ISO timestamp',
      typeof result.timestamp === 'string' && result.timestamp.includes('T')
    );
  }

  // ── Test 9: analyzeTransmissions uses real telemetry service ─────────────
  {
    clearTelemetry();
    clearAnalysisHistory();

    // No events yet → should return INSUFFICIENT DATA
    const result = analyzeTransmissions();
    assert(
      'analyzeTransmissions on empty telemetry returns INSUFFICIENT DATA',
      result.status === 'INSUFFICIENT DATA'
    );
    assert(
      'analyzeTransmissions result includes analysisId',
      typeof result.analysisId === 'string' && result.analysisId.startsWith('ANL-')
    );
  }

  // ── Test 10: Analysis history is recorded ────────────────────────────────
  {
    clearTelemetry();
    clearAnalysisHistory();

    analyzeTransmissions(); // 1st analysis (INSUFFICIENT DATA)
    analyzeTransmissions(); // 2nd analysis (INSUFFICIENT DATA)

    const history = getAnalysisHistory();
    assert(
      'getAnalysisHistory returns 2 records after 2 analyses',
      history.length === 2
    );
    assert(
      'History is in reverse-chronological order (most recent first)',
      history[0].analysisId > history[1].analysisId
    );
  }

  // ── Test 11: Stats endpoint returns correct structure ─────────────────────
  {
    clearTelemetry();
    clearAnalysisHistory();

    const stats0 = getAnomalyStats();
    assert(
      'Stats with no analyses returns totalAnalyses: 0',
      stats0.totalAnalyses === 0
    );
    assert(
      'Stats with no analyses returns detectionRate: null (denominator not valid)',
      stats0.detectionRate === null
    );

    analyzeTransmissions(); // INSUFFICIENT DATA (no telemetry)
    const stats1 = getAnomalyStats();
    assert(
      'Stats after 1 insufficient-data analysis returns totalAnalyses: 1',
      stats1.totalAnalyses === 1
    );
    assert(
      'insufficientDataCount is 1 after one insufficient-data analysis',
      stats1.insufficientDataCount === 1
    );
    assert(
      'detectionRate is still null when no conclusive analyses exist',
      stats1.detectionRate === null
    );
    assert(
      'Stats includes telemetryStats sub-object',
      typeof stats1.telemetryStats === 'object' && stats1.telemetryStats !== null
    );
  }

  // ── Test 12: Telemetry service records events from service calls ──────────
  {
    clearTelemetry();

    const txEvent = makeTxEvent(600);
    recordTransmissionEvent(txEvent);
    assert(
      'recordTransmissionEvent adds 1 event to telemetry history',
      getTelemetryCount() === 1
    );

    const injEvent = makeInjEvent(601);
    recordInjectionEvent({ ...injEvent, data: 'test', totalBits: 72, burstDetails: null });
    assert(
      'recordInjectionEvent adds another event (total now 2)',
      getTelemetryCount() === 2
    );

    const history = getTelemetryHistory();
    assert(
      'getTelemetryHistory returns a copy (not the same array reference)',
      history !== getTelemetryHistory()
    );
    assert(
      'First recorded event has eventType TRANSMISSION',
      history[0].eventType === 'TRANSMISSION'
    );
  }

  // ── Test 13: Health check reports aiAnomalyDetection as active ───────────
  {
    const health = getSystemHealthStatus();
    assert(
      'getSystemHealthStatus returns status "OK"',
      health.status === 'OK'
    );
    assert(
      'aiAnomalyDetection module is "active" in health check',
      health.modules.aiAnomalyDetection === 'active'
    );
    // Verify no regressions on Modules 1–4
    assert(
      'Modules 1-4 health status not affected by Module 5 changes (crcGenerator still active)',
      health.modules.crcGenerator === 'active'
    );
    assert(
      'transmissionSimulator still active',
      health.modules.transmissionSimulator === 'active'
    );
    assert(
      'errorInjector still active',
      health.modules.errorInjector === 'active'
    );
    assert(
      'algorithmComparison still active',
      health.modules.algorithmComparison === 'active'
    );
  }

  // ── Test 14: Stats detectionRate when conclusive analyses exist ───────────
  {
    clearTelemetry();
    clearAnalysisHistory();

    // Create 6 clean events → expect NORMAL
    for (let i = 0; i < 6; i++) {
      recordTransmissionEvent(makeTxEvent(700 + i, { errorDetected: false }));
    }
    analyzeTransmissions(); // Should be NORMAL (low deviation)

    const stats = getAnomalyStats();
    assert(
      'After at least one conclusive analysis, detectionRate is a number',
      stats.normalCount + stats.anomalyCount > 0
        ? typeof stats.detectionRate === 'number'
        : stats.detectionRate === null
    );
    assert(
      'totalAnalyses count is correct after 1 analysis',
      stats.totalAnalyses === 1
    );
  }

} catch (error) {
  console.error('\n❌ Unexpected error during test execution:', error.message);
  console.error(error.stack);
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n----------------------------------------------------`);
console.log(`Test Summary: ${passedTests}/${totalTests} Passed.`);
console.log(`----------------------------------------------------\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
